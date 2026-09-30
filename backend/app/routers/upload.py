import os
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord
from app.models.productivity import ProductivityRecord
from app.models.upload_history import UploadHistory
from app.models.scoring_config import ScoringConfig
from app.schemas.upload import ProcessDailyResponse
from app.routers.auth import get_current_user, require_admin
from app.services.excel_parser import parse_excel_file, detect_column_mapping
from app.services.name_matcher import normalize_string, normalize_department
from app.services.attendance_service import classify_punch_in, calculate_attendance_summaries
from app.services.report_service import determine_report_status, parse_quality, calculate_report_summaries
from app.services.productivity_service import process_productivity_records, DEFAULT_WEIGHTS
from app.services.reconciliation import validate_reconciliation
from app.services.excel_generator import generate_processed_excel
import pandas as pd
import io

router = APIRouter(prefix="/upload", tags=["Upload & Processing"])

@router.post("/preview")
async def preview_columns(file: UploadFile = File(...)):
    """Inspects an uploaded Excel file and returns detected columns and mapped fields."""
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
        cols = [str(c).strip() for c in df.columns]
        mapping = detect_column_mapping(cols)
        sample_rows = df.head(5).fillna("").to_dict(orient="records")
        return {
            "filename": file.filename,
            "columns": cols,
            "detected_mapping": mapping,
            "sample_rows": sample_rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")

@router.post("/daily-files", response_model=ProcessDailyResponse)
async def process_daily_files(
    date: str = Form(...),
    attendance_file: UploadFile = File(...),
    report_file: UploadFile = File(...),
    replace_existing: bool = Form(True),
    custom_mapping: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Processes attendance and daily report Excel files for a given date with strict invariant enforcement."""
    # 1. Check existing history
    existing_upload = db.query(UploadHistory).filter(UploadHistory.date == date).first()
    if existing_upload and not replace_existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Data for date '{date}' has already been processed. Enable 'Replace Existing Data' to reprocess."
        )

    # 2. Save raw files
    date_clean = date.replace("-", "_")
    att_raw_path = os.path.join(settings.UPLOAD_DIR, f"Attendance_{date_clean}_{attendance_file.filename}")
    rep_raw_path = os.path.join(settings.UPLOAD_DIR, f"Daily_Report_{date_clean}_{report_file.filename}")

    att_bytes = await attendance_file.read()
    rep_bytes = await report_file.read()

    with open(att_raw_path, "wb") as f:
        f.write(att_bytes)
    with open(rep_raw_path, "wb") as f:
        f.write(rep_bytes)

    # Parse custom mapping if passed
    mapping_dict = None
    if custom_mapping:
        try:
            mapping_dict = json.loads(custom_mapping)
        except Exception:
            pass

    # 3. Parse Excel files
    try:
        raw_attendance = parse_excel_file(att_bytes, mapping_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Attendance file parsing error: {str(e)}")

    try:
        raw_reports = parse_excel_file(rep_bytes, mapping_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Report file parsing error: {str(e)}")

    # 4. Normalize & Sync Employee Master
    known_employees = db.query(Employee).all()
    emp_cache = {e.normalized_name: e for e in known_employees}

    for row in raw_attendance:
        norm_name = normalize_string(row["employee_name"])
        norm_dept = normalize_department(row["department"])
        emp_id = row["employee_id"]

        if norm_name not in emp_cache:
            new_emp = Employee(
                employee_id=emp_id,
                name=row["employee_name"].strip(),
                normalized_name=norm_name,
                department=norm_dept,
                status="Active"
            )
            db.add(new_emp)
            emp_cache[norm_name] = new_emp
        else:
            existing = emp_cache[norm_name]
            if emp_id and not existing.employee_id:
                existing.employee_id = emp_id
            if norm_dept and not existing.department:
                existing.department = norm_dept

    db.commit()

    # 5. Process Attendance Rows
    attendance_processed = []
    att_lookup = {}  # norm_name -> att record dict

    for row in raw_attendance:
        norm_name = normalize_string(row["employee_name"])
        norm_dept = normalize_department(row["department"])
        att_status, late_status, time_cat = classify_punch_in(
            punch_in_str=row.get("punch_in_time"),
            raw_status=row.get("attendance_status")
        )

        item = {
            "date": date,
            "employee_id": row.get("employee_id") or (emp_cache[norm_name].employee_id if norm_name in emp_cache else None),
            "employee_name": row["employee_name"],
            "normalized_name": norm_name,
            "department": norm_dept,
            "punch_in_time": row.get("punch_in_time"),
            "punch_out_time": row.get("punch_out_time"),
            "attendance_status": att_status,
            "late_status": late_status,
            "time_category": time_cat,
            "source_file": attendance_file.filename
        }
        attendance_processed.append(item)
        att_lookup[norm_name] = item

    # 6. Process Report Rows & Map against Attendance
    # Build lookup of raw reports by normalized employee name
    rep_raw_lookup = {}
    for r in raw_reports:
        r_norm = normalize_string(r["employee_name"])
        rep_raw_lookup[r_norm] = r

    report_processed = []
    warnings = []

    # Iterate over all employees present in attendance (primary universe of employees today)
    for norm_name, att_item in att_lookup.items():
        raw_rep = rep_raw_lookup.get(norm_name)
        has_report = False

        if raw_rep:
            rep_sub = str(raw_rep.get("report_submitted") or "").strip().lower()
            rep_stat = str(raw_rep.get("report_status") or "").strip().lower()
            notes = str(raw_rep.get("notes") or "").strip().lower()

            if rep_sub:
                has_report = rep_sub in ["yes", "y", "true", "1", "submitted", "done", "present"]
            elif rep_stat:
                has_report = rep_stat not in ["not submitted", "no", "absent", "pending", "n/a", "none", "0"]
            elif notes:
                has_report = notes not in ["n/a", "na", "none", "null", "-", "nil", ""]
            else:
                has_report = True

        # CRITICAL INVARIANT: Check attendance first!
        final_rep_status, accidental = determine_report_status(
            attendance_status=att_item["attendance_status"],
            has_report_uploaded=has_report
        )

        if accidental:
            warnings.append(f"Notice: Employee '{att_item['employee_name']}' was Absent in attendance, but a report was submitted. Classified as Absent.")

        # Quality rating
        q_rating, q_score = ("N/A", 0.0)
        if final_rep_status == "Submitted" and raw_rep:
            q_raw = raw_rep.get("quality_rating")
            if q_raw:
                q_rating, q_score = parse_quality(q_raw)
            else:
                notes_len = len(str(raw_rep.get("notes") or "").strip())
                if notes_len > 60:
                    q_rating, q_score = ("Good", 75.0)
                else:
                    q_rating, q_score = ("Average", 50.0)


        rep_item = {
            "date": date,
            "employee_id": att_item.get("employee_id"),
            "employee_name": att_item["employee_name"],
            "normalized_name": norm_name,
            "department": att_item["department"],
            "attendance_status": att_item["attendance_status"],
            "report_status": final_rep_status,
            "quality_rating": q_rating if final_rep_status == "Submitted" else ("N/A" if final_rep_status == "Absent" else "None"),
            "quality_score": q_score if final_rep_status == "Submitted" else 0.0,
            "accidental_submission": accidental,
            "notes": raw_rep.get("notes"),
            "source_file": report_file.filename
        }
        report_processed.append(rep_item)

    # 7. Check if report file contained any employees NOT in attendance file
    for r_norm, r_data in rep_raw_lookup.items():
        if r_norm not in att_lookup:
            warnings.append(f"Warning: Employee '{r_data['employee_name']}' found in report file but not in attendance file.")

    # 8. Compute Summaries & Reconcile
    att_summary = calculate_attendance_summaries(attendance_processed)
    rep_summary = calculate_report_summaries(report_processed)

    reconciled_valid, reconcil_errors = validate_reconciliation(att_summary, rep_summary)

    # 9. Calculate Productivity
    scoring_cfg = db.query(ScoringConfig).first()
    weights = None
    if scoring_cfg:
        weights = {
            "report_submission_weight": scoring_cfg.report_submission_weight,
            "report_quality_weight": scoring_cfg.report_quality_weight,
            "attendance_weight": scoring_cfg.attendance_weight,
            "excellent_score": scoring_cfg.excellent_score,
            "good_score": scoring_cfg.good_score,
            "average_score": scoring_cfg.average_score,
            "poor_score": scoring_cfg.poor_score,
            "before_930_score": scoring_cfg.before_930_score,
            "grace_score": scoring_cfg.grace_score,
            "after_945_score": scoring_cfg.after_945_score,
        }

    # Merge for productivity calculation
    combined_for_prod = []
    for att_item in attendance_processed:
        r_item = next((x for x in report_processed if x["normalized_name"] == att_item["normalized_name"]), {})
        combined_for_prod.append({
            "employee_id": att_item.get("employee_id"),
            "employee_name": att_item["employee_name"],
            "department": att_item["department"],
            "attendance_status": att_item["attendance_status"],
            "time_category": att_item["time_category"],
            "late_status": att_item["late_status"],
            "report_status": r_item.get("report_status", "Absent"),
            "quality_rating": r_item.get("quality_rating"),
            "quality_score": r_item.get("quality_score", 0.0)
        })

    productivity_data = process_productivity_records(combined_for_prod, weights)

    # 10. Generate 9-Sheet Processed Excel
    processed_filename = f"Attendance_Analysis_{date}.xlsx"
    processed_filepath = os.path.join(settings.PROCESSED_DIR, processed_filename)
    generate_processed_excel(
        date_str=date,
        raw_attendance_rows=raw_attendance,
        att_summary=att_summary,
        rep_summary=rep_summary,
        attendance_details=attendance_processed,
        report_details=report_processed,
        productivity_data=productivity_data,
        output_path=processed_filepath
    )

    # 11. Persist to Database (Delete old records for this date if replace_existing)
    if existing_upload:
        db.query(AttendanceRecord).filter(AttendanceRecord.date == date).delete()
        db.query(DailyReportRecord).filter(DailyReportRecord.date == date).delete()
        db.query(ProductivityRecord).filter(ProductivityRecord.date == date).delete()
        db.query(UploadHistory).filter(UploadHistory.date == date).delete()
        db.commit()

    # Save Attendance records
    for a in attendance_processed:
        db.add(AttendanceRecord(
            date=a["date"],
            employee_id=a["employee_id"],
            employee_name=a["employee_name"],
            normalized_name=a["normalized_name"],
            department=a["department"],
            punch_in_time=a["punch_in_time"],
            punch_out_time=a["punch_out_time"],
            attendance_status=a["attendance_status"],
            late_status=a["late_status"],
            time_category=a["time_category"],
            source_file=a["source_file"]
        ))

    # Save Report records
    for r in report_processed:
        db.add(DailyReportRecord(
            date=r["date"],
            employee_id=r["employee_id"],
            employee_name=r["employee_name"],
            normalized_name=r["normalized_name"],
            department=r["department"],
            attendance_status=r["attendance_status"],
            report_status=r["report_status"],
            quality_rating=r["quality_rating"],
            quality_score=r["quality_score"],
            accidental_submission=r["accidental_submission"],
            notes=r["notes"],
            source_file=r["source_file"]
        ))

    # Save Productivity records
    for p in productivity_data["all_rankings"]:
        db.add(ProductivityRecord(
            date=date,
            employee_id=p.get("employee_id"),
            employee_name=p["employee_name"],
            department=p["department"],
            submission_score=p["submission_score"],
            quality_score=p["quality_score"],
            attendance_score=p["attendance_score"],
            productivity_score=p["productivity_score"],
            rank=p.get("rank"),
            category=p["category"],
            attendance_status=p.get("attendance_status"),
            report_status=p.get("report_status"),
            late_status=p.get("late_status")
        ))

    # Save Upload History Audit
    tot_att = att_summary["summary_1_total"]
    tot_rep = rep_summary["summary_total"]
    tot_stat2 = att_summary["summary_2_total"]

    history_entry = UploadHistory(
        date=date,
        attendance_filename=attendance_file.filename,
        report_filename=report_file.filename,
        processed_filename=processed_filename,
        status="Processed" if reconciled_valid else "Reconciliation Warning",
        total_employees=tot_att["total_individuals"],
        present_count=tot_stat2["present"],
        absent_count=tot_att["not_punched_or_absent"],
        reports_submitted=tot_rep["reports_submitted"],
        reports_not_submitted=tot_rep["reports_not_submitted"],
        late_punch_ins=tot_stat2["late_punch_in"],
        reconciliation_valid=reconciled_valid,
        reconciliation_notes="; ".join(reconcil_errors) if reconcil_errors else "All reconciliation checks passed."
    )
    db.add(history_entry)
    db.commit()

    return {
        "success": True,
        "date": date,
        "message": "Daily attendance and report data successfully processed and reconciled.",
        "total_employees": tot_att["total_individuals"],
        "present_count": tot_stat2["present"],
        "absent_count": tot_att["not_punched_or_absent"],
        "reports_submitted": tot_rep["reports_submitted"],
        "reports_not_submitted": tot_rep["reports_not_submitted"],
        "late_punch_ins": tot_stat2["late_punch_in"],
        "reconciliation_valid": reconciled_valid,
        "reconciliation_errors": reconcil_errors,
        "processed_excel_filename": processed_filename,
        "download_url": f"/api/export/{date}/excel",
        "warnings": warnings
    }

@router.delete("/{date}")
def delete_upload_date(
    date: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deletes all data associated with a specific date."""
    db.query(AttendanceRecord).filter(AttendanceRecord.date == date).delete()
    db.query(DailyReportRecord).filter(DailyReportRecord.date == date).delete()
    db.query(ProductivityRecord).filter(ProductivityRecord.date == date).delete()
    db.query(UploadHistory).filter(UploadHistory.date == date).delete()
    db.commit()
    return {"success": True, "message": f"All data for {date} deleted."}
