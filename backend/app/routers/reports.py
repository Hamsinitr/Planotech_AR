from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.daily_report import DailyReportRecord
from app.models.upload_history import UploadHistory
from app.schemas.report import ReportSummaryResponse, DailyReportOut
from app.services.report_service import calculate_report_summaries
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Report Analytics"])

@router.get("/summary", response_model=ReportSummaryResponse)
def get_report_summary(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not date:
        latest = db.query(UploadHistory).order_by(desc(UploadHistory.date)).first()
        date = latest.date if latest else ""
    
    if not date:
        return {
            "date": "",
            "total_employees": 0,
            "reports_submitted": 0,
            "reports_not_submitted": 0,
            "absent": 0,
            "submission_rate": 0.0,
            "avg_quality_score": 0.0,
            "summary": [],
            "summary_total": {"department": "Total", "total_individuals": 0, "reports_submitted": 0, "reports_not_submitted": 0, "absent": 0, "reconciled": True},
            "quality_summary": [],
            "quality_total": {"department": "Total", "total_reports": 0, "excellent": 0, "good": 0, "average": 0, "poor": 0, "avg_quality_score": 0.0},
            "reconciliation_valid": True,
            "reconciliation_errors": []
        }

    records = db.query(DailyReportRecord).filter(DailyReportRecord.date == date).all()
    record_dicts = [{
        "department": r.department,
        "report_status": r.report_status,
        "quality_rating": r.quality_rating,
        "quality_score": r.quality_score
    } for r in records]

    summaries = calculate_report_summaries(record_dicts)
    tot = summaries["summary_total"]
    qtot = summaries["quality_total"]

    present_count = tot["reports_submitted"] + tot["reports_not_submitted"]
    sub_rate = round((tot["reports_submitted"] / present_count * 100), 1) if present_count > 0 else 0.0

    return {
        "date": date,
        "total_employees": tot["total_individuals"],
        "reports_submitted": tot["reports_submitted"],
        "reports_not_submitted": tot["reports_not_submitted"],
        "absent": tot["absent"],
        "submission_rate": sub_rate,
        "avg_quality_score": qtot["avg_quality_score"],
        "summary": summaries["summary"],
        "summary_total": tot,
        "quality_summary": summaries["quality_summary"],
        "quality_total": qtot,
        "reconciliation_valid": summaries["reconciliation_valid"],
        "reconciliation_errors": summaries["reconciliation_errors"]
    }

@router.get("/details", response_model=List[DailyReportOut])
def get_report_details(
    date: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    quality: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not date:
        latest = db.query(UploadHistory).order_by(desc(UploadHistory.date)).first()
        date = latest.date if latest else ""

    query = db.query(DailyReportRecord).filter(DailyReportRecord.date == date)

    if department and department.lower() != "all":
        query = query.filter(DailyReportRecord.department == department)
    if status and status.lower() != "all":
        query = query.filter(DailyReportRecord.report_status == status)
    if quality and quality.lower() != "all":
        query = query.filter(DailyReportRecord.quality_rating == quality)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (DailyReportRecord.employee_name.ilike(search_pattern)) |
            (DailyReportRecord.employee_id.ilike(search_pattern))
        )

    return query.order_by(DailyReportRecord.department, DailyReportRecord.employee_name).all()
