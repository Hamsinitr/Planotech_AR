import os
import io
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.daily_report import DailyReportRecord
from app.models.attendance import AttendanceRecord
from app.models.productivity import ProductivityRecord
from app.models.scoring_config import ScoringConfig
from app.models.user import User
from app.utils.security import decode_token
from app.services.attendance_service import calculate_attendance_summaries
from app.services.report_service import calculate_report_summaries
from app.services.productivity_service import process_productivity_records, DEFAULT_WEIGHTS
from app.services.excel_generator import generate_processed_excel

router = APIRouter(prefix="/export", tags=["Export"])

oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user_flexible(
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    header_token: Optional[str] = Depends(oauth2_optional)
) -> Optional[User]:
    actual_token = header_token or token
    if actual_token:
        try:
            payload = decode_token(actual_token)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.email == payload["sub"]).first()
                if user and user.is_active:
                    return user
        except Exception:
            pass
    return None

@router.get("/{date}/excel")
def download_excel(
    date: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_flexible)
):
    """Downloads the generated 9-sheet processed Excel file for the specified date."""
    filename = f"Attendance_Analysis_{date}.xlsx"
    filepath = os.path.join(settings.PROCESSED_DIR, filename)

    if not os.path.exists(filepath):
        # Dynamically regenerate from DB records if available
        att_records = db.query(AttendanceRecord).filter(AttendanceRecord.date == date).all()
        if not att_records:
            raise HTTPException(status_code=404, detail=f"Processed Excel file for {date} not found.")

        rep_records = db.query(DailyReportRecord).filter(DailyReportRecord.date == date).all()
        rep_map = {r.normalized_name: r for r in rep_records}

        attendance_details = [
            {
                "date": r.date,
                "employee_id": r.employee_id,
                "employee_name": r.employee_name,
                "normalized_name": r.normalized_name,
                "department": r.department,
                "punch_in_time": r.punch_in_time,
                "punch_out_time": r.punch_out_time,
                "attendance_status": r.attendance_status,
                "late_status": r.late_status,
                "time_category": r.time_category,
                "out_of_location": getattr(r, "out_of_location", None),
                "source_file": r.source_file
            }
            for r in att_records
        ]

        report_details = [
            {
                "date": r.date,
                "employee_id": r.employee_id,
                "employee_name": r.employee_name,
                "normalized_name": r.normalized_name,
                "department": r.department,
                "attendance_status": r.attendance_status,
                "report_submitted": r.report_status == "Submitted",
                "report_status": r.report_status,
                "quality_rating": r.quality_rating,
                "quality_score": r.quality_score,
                "accidental_submission": r.accidental_submission,
                "notes": r.notes,
                "source_file": r.source_file
            }
            for r in rep_records
        ]

        att_summary = calculate_attendance_summaries(attendance_details)
        rep_summary = calculate_report_summaries(report_details)

        cfg = db.query(ScoringConfig).first()
        weights = DEFAULT_WEIGHTS.copy()
        if cfg:
            weights = {
                "report_submission_weight": cfg.report_submission_weight,
                "report_quality_weight": cfg.report_quality_weight,
                "attendance_weight": cfg.attendance_weight,
                "excellent_score": cfg.excellent_score,
                "good_score": cfg.good_score,
                "average_score": cfg.average_score,
                "poor_score": cfg.poor_score,
                "before_930_score": cfg.before_930_score,
                "grace_score": cfg.grace_score,
                "after_945_score": cfg.after_945_score,
            }

        combined_for_prod = []
        for att in attendance_details:
            r = rep_map.get(att["normalized_name"])
            combined_for_prod.append({
                "employee_name": att["employee_name"],
                "employee_id": att["employee_id"],
                "department": att["department"],
                "attendance_status": att["attendance_status"],
                "time_category": att["time_category"],
                "late_status": att["late_status"],
                "report_status": r.report_status if r else "Absent",
                "quality_rating": r.quality_rating if r else None,
                "quality_score": r.quality_score if r else 0.0,
            })

        prod_data = process_productivity_records(combined_for_prod, weights)

        raw_att_rows = [
            {
                "employee_name": a["employee_name"],
                "employee_id": a["employee_id"],
                "department": a["department"],
                "punch_in_time": a["punch_in_time"],
                "punch_out_time": a["punch_out_time"],
                "attendance_status": a["attendance_status"],
                "out_of_location": a.get("out_of_location"),
            }
            for a in attendance_details
        ]

        generate_processed_excel(
            date_str=date,
            raw_attendance_rows=raw_att_rows,
            att_summary=att_summary,
            rep_summary=rep_summary,
            attendance_details=attendance_details,
            report_details=report_details,
            productivity_data=prod_data,
            output_path=filepath
        )

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/{date}/csv")
def export_csv(
    date: str,
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_flexible)
):
    """Exports employee daily status records as CSV with optional department and status filters."""
    query = db.query(
        AttendanceRecord.date,
        AttendanceRecord.employee_id,
        AttendanceRecord.employee_name,
        AttendanceRecord.department,
        AttendanceRecord.punch_in_time,
        AttendanceRecord.punch_out_time,
        AttendanceRecord.attendance_status,
        AttendanceRecord.late_status,
        DailyReportRecord.report_status,
        DailyReportRecord.quality_rating,
        DailyReportRecord.quality_score,
        ProductivityRecord.productivity_score,
        ProductivityRecord.category
    ).join(
        DailyReportRecord,
        (AttendanceRecord.date == DailyReportRecord.date) &
        (AttendanceRecord.normalized_name == DailyReportRecord.normalized_name),
        isouter=True
    ).join(
        ProductivityRecord,
        (AttendanceRecord.date == ProductivityRecord.date) &
        (AttendanceRecord.employee_name == ProductivityRecord.employee_name),
        isouter=True
    ).filter(AttendanceRecord.date == date)

    if department and department.lower() != "all":
        query = query.filter(AttendanceRecord.department == department)
    if status and status.lower() != "all":
        query = query.filter(DailyReportRecord.report_status == status)

    rows = query.all()
    data = []
    for r in rows:
        data.append({
            "Date": r[0],
            "Employee ID": r[1] or "",
            "Employee Name": r[2],
            "Department": r[3],
            "Punch In": r[4] or "",
            "Punch Out": r[5] or "",
            "Attendance Status": r[6],
            "Late Status": r[7],
            "Report Status": r[8] or "",
            "Quality Rating": r[9] or "",
            "Quality Score": r[10] or 0.0,
            "Productivity Score": r[11] or 0.0,
            "Category": r[12] or ""
        })

    df = pd.DataFrame(data)
    csv_stream = io.StringIO()
    df.to_csv(csv_stream, index=False)

    return Response(
        content=csv_stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Employee_Analysis_{date}.csv"}
    )
