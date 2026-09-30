from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.attendance import AttendanceRecord
from app.models.upload_history import UploadHistory
from app.schemas.attendance import AttendanceSummaryResponse, AttendanceRecordOut
from app.services.attendance_service import calculate_attendance_summaries
from app.routers.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance Analytics"])

@router.get("/summary", response_model=AttendanceSummaryResponse)
def get_attendance_summary(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Default to latest date if not specified
    if not date:
        latest = db.query(UploadHistory).order_by(desc(UploadHistory.date)).first()
        if latest:
            date = latest.date
        else:
            return {
                "date": "",
                "total_employees": 0,
                "present_today": 0,
                "absent_today": 0,
                "late_punch_ins": 0,
                "not_punched_in": 0,
                "summary_1": [],
                "summary_1_total": {"department": "Total", "total_individuals": 0, "before_930": 0, "between_930_945": 0, "after_945": 0, "not_punched_or_absent": 0, "reconciled": True},
                "summary_2": [],
                "summary_2_total": {"department": "Total", "total_individuals": 0, "not_punched_in": 0, "present": 0, "late_punch_in": 0, "reconciled": True},
                "reconciliation_valid": True,
                "reconciliation_errors": []
            }

    records = db.query(AttendanceRecord).filter(AttendanceRecord.date == date).all()
    record_dicts = [{
        "department": r.department,
        "time_category": r.time_category,
        "attendance_status": r.attendance_status,
        "late_status": r.late_status
    } for r in records]

    summaries = calculate_attendance_summaries(record_dicts)
    tot1 = summaries["summary_1_total"]
    tot2 = summaries["summary_2_total"]

    return {
        "date": date,
        "total_employees": tot1["total_individuals"],
        "present_today": tot2["present"],
        "absent_today": tot1["not_punched_or_absent"],
        "late_punch_ins": tot2["late_punch_in"],
        "not_punched_in": tot2["not_punched_in"],
        "summary_1": summaries["summary_1"],
        "summary_1_total": tot1,
        "summary_2": summaries["summary_2"],
        "summary_2_total": tot2,
        "reconciliation_valid": summaries["reconciliation_valid"],
        "reconciliation_errors": summaries["reconciliation_errors"]
    }

@router.get("/details", response_model=List[AttendanceRecordOut])
def get_attendance_details(
    date: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    late_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not date:
        latest = db.query(UploadHistory).order_by(desc(UploadHistory.date)).first()
        date = latest.date if latest else ""

    query = db.query(AttendanceRecord).filter(AttendanceRecord.date == date)

    if department and department.lower() != "all":
        query = query.filter(AttendanceRecord.department == department)
    if status and status.lower() != "all":
        query = query.filter(AttendanceRecord.attendance_status == status)
    if late_status and late_status.lower() != "all":
        query = query.filter(AttendanceRecord.late_status == late_status)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (AttendanceRecord.employee_name.ilike(search_pattern)) |
            (AttendanceRecord.employee_id.ilike(search_pattern))
        )

    return query.order_by(AttendanceRecord.department, AttendanceRecord.employee_name).all()
