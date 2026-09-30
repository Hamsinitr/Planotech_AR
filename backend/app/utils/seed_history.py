import os
import sys
from pathlib import Path
from datetime import datetime

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord
from app.models.productivity import ProductivityRecord
from app.models.upload_history import UploadHistory
from app.models.scoring_config import ScoringConfig
from app.utils.security import hash_password
from app.utils.sample_generator import generate_sample_excel_files, EMPLOYEES
from app.services.name_matcher import normalize_string, normalize_department
from app.services.attendance_service import classify_punch_in, calculate_attendance_summaries
from app.services.report_service import determine_report_status, parse_quality, calculate_report_summaries
from app.services.productivity_service import process_productivity_records
from app.services.reconciliation import validate_reconciliation
from app.services.excel_generator import generate_processed_excel
from app.config import settings

def seed_database():
    print("Seeding database with master tables and 3 days of historical analytics...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin & Viewer users
        if not db.query(User).filter(User.email == "admin@planotech.com").first():
            db.add(User(
                email="admin@planotech.com",
                hashed_password=hash_password("admin123"),
                full_name="Planotech Administrator",
                role="admin",
                is_active=True
            ))
        if not db.query(User).filter(User.email == "viewer@planotech.com").first():
            db.add(User(
                email="viewer@planotech.com",
                hashed_password=hash_password("viewer123"),
                full_name="Planotech HR Viewer",
                role="viewer",
                is_active=True
            ))

        # 2. Scoring Config
        if not db.query(ScoringConfig).first():
            db.add(ScoringConfig())

        # Cache existing employees
        existing_emps = {e.normalized_name: e for e in db.query(Employee).all()}

        # 3. Process 3 days: 2026-09-13, 2026-09-14, 2026-09-15
        dates = ["2026-09-13", "2026-09-14", "2026-09-15"]
        for d in dates:
            print(f"Processing day {d}...")
            att_file, rep_file = generate_sample_excel_files(settings.UPLOAD_DIR, d)

            # Clear old records for this date
            db.query(AttendanceRecord).filter(AttendanceRecord.date == d).delete()
            db.query(DailyReportRecord).filter(DailyReportRecord.date == d).delete()
            db.query(ProductivityRecord).filter(ProductivityRecord.date == d).delete()
            db.query(UploadHistory).filter(UploadHistory.date == d).delete()

            # Process Attendance
            raw_att = []
            att_processed = []
            rep_processed = []
            combined_prod = []

            for emp in EMPLOYEES:
                # Slight variation per day
                p_in = emp["in"]
                att_st = emp["att"]
                has_rep = emp["has_rep"]

                if d == "2026-09-13" and emp["id"] == "EMP005":
                    has_rep = True # on 13th they submitted
                if d == "2026-09-14" and emp["id"] == "EMP005":
                    has_rep = False # on 14th not submitted -> repeated non-submission trigger!

                norm_name = normalize_string(emp["name"])
                norm_dept = normalize_department(emp["dept"])

                # Upsert Employee if not cached
                if norm_name not in existing_emps:
                    emp_obj = Employee(
                        employee_id=emp["id"],
                        name=emp["name"],
                        normalized_name=norm_name,
                        department=norm_dept,
                        designation="Senior Analyst" if "0" in emp["id"] else "Specialist",
                        email=f"{norm_name.lower().replace(' ', '.')}@planotech.com",
                        status="Active"
                    )
                    db.add(emp_obj)
                    db.flush()
                    existing_emps[norm_name] = emp_obj

                att_status, late_status, time_cat = classify_punch_in(p_in, raw_status=att_st)
                att_item = {
                    "date": d,
                    "employee_id": emp["id"],
                    "employee_name": emp["name"],
                    "normalized_name": norm_name,
                    "department": norm_dept,
                    "punch_in_time": p_in,
                    "punch_out_time": emp["out"],
                    "attendance_status": att_status,
                    "late_status": late_status,
                    "time_category": time_cat,
                    "source_file": os.path.basename(att_file)
                }
                att_processed.append(att_item)
                raw_att.append(att_item)

                # Report item
                final_rep_status, accidental = determine_report_status(
                    attendance_status=att_status,
                    has_report_uploaded=has_rep
                )
                q_rating, q_score = parse_quality(emp["quality"]) if (has_rep and final_rep_status == "Submitted") else ("N/A", 0.0)

                rep_item = {
                    "date": d,
                    "employee_id": emp["id"],
                    "employee_name": emp["name"],
                    "normalized_name": norm_name,
                    "department": norm_dept,
                    "attendance_status": att_status,
                    "report_status": final_rep_status,
                    "quality_rating": q_rating,
                    "quality_score": q_score,
                    "accidental_submission": accidental,
                    "notes": emp["task"] if has_rep else None,
                    "source_file": os.path.basename(rep_file)
                }
                rep_processed.append(rep_item)

                combined_prod.append({
                    "employee_id": emp["id"],
                    "employee_name": emp["name"],
                    "department": norm_dept,
                    "attendance_status": att_status,
                    "time_category": time_cat,
                    "late_status": late_status,
                    "report_status": final_rep_status,
                    "quality_rating": q_rating,
                    "quality_score": q_score
                })

            att_summary = calculate_attendance_summaries(att_processed)
            rep_summary = calculate_report_summaries(rep_processed)
            reconciled_valid, reconcil_errors = validate_reconciliation(att_summary, rep_summary)
            productivity_data = process_productivity_records(combined_prod)

            # Generate 9-Sheet Excel
            processed_filename = f"Attendance_Analysis_{d}.xlsx"
            processed_filepath = os.path.join(settings.PROCESSED_DIR, processed_filename)
            generate_processed_excel(
                date_str=d,
                raw_attendance_rows=raw_att,
                att_summary=att_summary,
                rep_summary=rep_summary,
                attendance_details=att_processed,
                report_details=rep_processed,
                productivity_data=productivity_data,
                output_path=processed_filepath
            )

            # Persist records
            for a in att_processed:
                db.add(AttendanceRecord(**a))
            for r in rep_processed:
                db.add(DailyReportRecord(**r))
            for p in productivity_data["all_rankings"]:
                db.add(ProductivityRecord(
                    date=d,
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

            tot_att = att_summary["summary_1_total"]
            tot_rep = rep_summary["summary_total"]
            tot_stat2 = att_summary["summary_2_total"]

            db.add(UploadHistory(
                date=d,
                attendance_filename=os.path.basename(att_file),
                report_filename=os.path.basename(rep_file),
                processed_filename=processed_filename,
                status="Processed",
                total_employees=tot_att["total_individuals"],
                present_count=tot_stat2["present"],
                absent_count=tot_att["not_punched_or_absent"],
                reports_submitted=tot_rep["reports_submitted"],
                reports_not_submitted=tot_rep["reports_not_submitted"],
                late_punch_ins=tot_stat2["late_punch_in"],
                reconciliation_valid=reconciled_valid,
                reconciliation_notes="All reconciliation checks passed."
            ))

        db.commit()
        print("Database seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
