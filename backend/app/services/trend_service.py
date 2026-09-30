from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord
from app.models.productivity import ProductivityRecord
from app.models.upload_history import UploadHistory

def get_historical_trends(db: Session, limit_days: int = 30) -> Dict[str, Any]:
    """Fetches daily trend aggregated metrics for 7D, 30D or custom ranges."""
    history = db.query(UploadHistory).order_by(UploadHistory.date.desc()).limit(limit_days).all()
    # Reverse to chronological order
    history = list(reversed(history))

    dates = []
    submission_trend = []
    attendance_trend = []
    productivity_trend = []

    for h in history:
        dates.append(h.date)
        
        # Submission rate
        rate = round((h.reports_submitted / h.present_count * 100), 1) if h.present_count > 0 else 0.0
        submission_trend.append({
            "date": h.date,
            "submission_rate": rate,
            "submitted": h.reports_submitted,
            "not_submitted": h.reports_not_submitted
        })

        # Attendance trend
        attendance_trend.append({
            "date": h.date,
            "total": h.total_employees,
            "present": h.present_count,
            "absent": h.absent_count,
            "late": h.late_punch_ins
        })

        # Average productivity
        avg_prod = db.query(func.avg(ProductivityRecord.productivity_score))\
            .filter(ProductivityRecord.date == h.date).scalar() or 0.0
        productivity_trend.append({
            "date": h.date,
            "avg_productivity": round(float(avg_prod), 1)
        })

    return {
        "dates": dates,
        "submission_trend": submission_trend,
        "attendance_trend": attendance_trend,
        "productivity_trend": productivity_trend
    }

def detect_attention_required_issues(db: Session, target_date: str) -> Dict[str, Any]:
    """
    Identifies employees needing attention:
    1. Absent today (explicitly noted as absent, NOT as non-submitters)
    2. Present today but report not submitted
    3. Repeated non-submission (present on multiple dates but missing reports)
    4. Repeated late punch-ins (>= 2 late punch-ins)
    5. Consistently high performers
    """
    # 1. Today's absent
    absent_today = db.query(AttendanceRecord)\
        .filter(AttendanceRecord.date == target_date, AttendanceRecord.attendance_status.in_(["Absent", "Leave", "Not Punched In"]))\
        .all()
    absent_list = [{"employee_name": a.employee_name, "employee_id": a.employee_id, "department": a.department, "reason": a.attendance_status} for a in absent_today]

    # 2. Present today but report NOT submitted
    present_unsubmitted = db.query(DailyReportRecord)\
        .filter(DailyReportRecord.date == target_date, DailyReportRecord.report_status == "Not Submitted")\
        .all()
    unsubmitted_today_list = [{"employee_name": r.employee_name, "employee_id": r.employee_id, "department": r.department} for r in present_unsubmitted]

    # 3. Repeated non-submission (checked over recent dates)
    repeated_unsubmitted_query = db.query(
        DailyReportRecord.employee_name,
        DailyReportRecord.employee_id,
        DailyReportRecord.department,
        func.count(DailyReportRecord.id).label("unsubmitted_count")
    ).filter(DailyReportRecord.report_status == "Not Submitted")\
     .group_by(DailyReportRecord.employee_name, DailyReportRecord.employee_id, DailyReportRecord.department)\
     .having(func.count(DailyReportRecord.id) >= 2)\
     .all()

    repeated_unsubmitted_list = [
        {"employee_name": r[0], "employee_id": r[1], "department": r[2], "unsubmitted_count": r[3]}
        for r in repeated_unsubmitted_query
    ]

    # 4. Repeated Late Punch-Ins
    repeated_late_query = db.query(
        AttendanceRecord.employee_name,
        AttendanceRecord.employee_id,
        AttendanceRecord.department,
        func.count(AttendanceRecord.id).label("late_count")
    ).filter(AttendanceRecord.late_status == "Late")\
     .group_by(AttendanceRecord.employee_name, AttendanceRecord.employee_id, AttendanceRecord.department)\
     .having(func.count(AttendanceRecord.id) >= 2)\
     .all()

    repeated_late_list = [
        {"employee_name": r[0], "employee_id": r[1], "department": r[2], "late_count": r[3]}
        for r in repeated_late_query
    ]

    # 5. Top performers today
    top_performers = db.query(ProductivityRecord)\
        .filter(ProductivityRecord.date == target_date, ProductivityRecord.category == "Top Performer")\
        .order_by(ProductivityRecord.productivity_score.desc())\
        .limit(10).all()
    top_list = [
        {"employee_name": p.employee_name, "employee_id": p.employee_id, "department": p.department, "score": p.productivity_score, "rank": p.rank}
        for p in top_performers
    ]

    return {
        "absent_today": absent_list,
        "unsubmitted_today": unsubmitted_today_list,
        "repeated_unsubmitted": repeated_unsubmitted_list,
        "repeated_late": repeated_late_list,
        "top_performers": top_list
    }
