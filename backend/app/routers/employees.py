from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord
from app.models.productivity import ProductivityRecord
from app.routers.auth import get_current_user
from app.services.name_matcher import normalize_string

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("")
def list_employees(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Employee)
    if department and department.lower() != "all":
        query = query.filter(Employee.department == department)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Employee.name.ilike(s)) | (Employee.employee_id.ilike(s)))
    
    return query.order_by(Employee.department, Employee.name).all()

@router.get("/{emp_identifier}/history")
def get_employee_history(
    emp_identifier: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Fetches comprehensive employee profile, attendance history, report history, and productivity trends."""
    # Find employee by employee_id or normalized_name or id
    emp = None
    if emp_identifier.isdigit():
        emp = db.query(Employee).filter(Employee.id == int(emp_identifier)).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.employee_id == emp_identifier).first()
    if not emp:
        norm = normalize_string(emp_identifier)
        emp = db.query(Employee).filter(Employee.normalized_name == norm).first()
    
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    norm_name = emp.normalized_name

    # Attendance records
    att_records = db.query(AttendanceRecord)\
        .filter((AttendanceRecord.normalized_name == norm_name) | (AttendanceRecord.employee_id == emp.employee_id))\
        .order_by(desc(AttendanceRecord.date))\
        .all()

    # Report records
    rep_records = db.query(DailyReportRecord)\
        .filter((DailyReportRecord.normalized_name == norm_name) | (DailyReportRecord.employee_id == emp.employee_id))\
        .order_by(desc(DailyReportRecord.date))\
        .all()

    # Productivity records
    prod_records = db.query(ProductivityRecord)\
        .filter((ProductivityRecord.employee_name == emp.name) | (ProductivityRecord.employee_id == emp.employee_id))\
        .order_by(desc(ProductivityRecord.date))\
        .all()

    # Aggregate stats
    total_days = len(att_records)
    present_days = sum(1 for a in att_records if a.attendance_status == "Present")
    absent_days = sum(1 for a in att_records if a.attendance_status in ["Absent", "Leave", "Not Punched In"])
    late_days = sum(1 for a in att_records if a.late_status == "Late")
    on_time_days = sum(1 for a in att_records if a.late_status == "On Time")

    reports_submitted = sum(1 for r in rep_records if r.report_status == "Submitted")
    reports_unsubmitted = sum(1 for r in rep_records if r.report_status == "Not Submitted")

    excellent_count = sum(1 for r in rep_records if r.quality_rating == "Excellent")
    good_count = sum(1 for r in rep_records if r.quality_rating == "Good")
    avg_count = sum(1 for r in rep_records if r.quality_rating == "Average")
    poor_count = sum(1 for r in rep_records if r.quality_rating == "Poor")

    # Productivity timeline
    timeline = []
    scores = []
    for p in reversed(prod_records):
        timeline.append({
            "date": p.date,
            "productivity_score": p.productivity_score,
            "submission_score": p.submission_score,
            "quality_score": p.quality_score,
            "attendance_score": p.attendance_score
        })
        scores.append(p.productivity_score)

    avg_prod_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return {
        "employee": {
            "id": emp.id,
            "employee_id": emp.employee_id or "N/A",
            "name": emp.name,
            "department": emp.department,
            "designation": emp.designation or "Team Member",
            "email": emp.email or f"{emp.normalized_name.lower().replace(' ', '.')}@planotech.com",
            "joining_date": emp.joining_date or "2024-01-15",
            "status": emp.status
        },
        "stats": {
            "total_days_tracked": total_days,
            "present_days": present_days,
            "absent_days": absent_days,
            "late_days": late_days,
            "on_time_days": on_time_days,
            "attendance_rate": round(present_days / total_days * 100, 1) if total_days > 0 else 0.0,
            "reports_submitted": reports_submitted,
            "reports_unsubmitted": reports_unsubmitted,
            "submission_rate": round(reports_submitted / present_days * 100, 1) if present_days > 0 else 0.0,
            "avg_productivity_score": avg_prod_score,
            "quality_breakdown": {
                "excellent": excellent_count,
                "good": good_count,
                "average": avg_count,
                "poor": poor_count
            }
        },
        "productivity_timeline": timeline,
        "recent_attendance": att_records[:15],
        "recent_reports": rep_records[:15]
    }
