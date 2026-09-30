from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.upload_history import UploadHistory
from app.models.productivity import ProductivityRecord
from app.models.daily_report import DailyReportRecord
from app.models.attendance import AttendanceRecord
from app.services.trend_service import get_historical_trends, detect_attention_required_issues
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])

@router.get("/kpis")
def get_dashboard_kpis(
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
            "present_today": 0,
            "absent_today": 0,
            "reports_submitted": 0,
            "reports_not_submitted": 0,
            "late_punch_ins": 0,
            "avg_quality_score": 0.0,
            "avg_productivity_score": 0.0,
            "reconciliation_valid": True
        }

    history = db.query(UploadHistory).filter(UploadHistory.date == date).first()
    
    # Average Quality
    avg_q = db.query(func.avg(DailyReportRecord.quality_score))\
        .filter(DailyReportRecord.date == date, DailyReportRecord.report_status == "Submitted")\
        .scalar() or 0.0

    # Average Productivity
    avg_prod = db.query(func.avg(ProductivityRecord.productivity_score))\
        .filter(ProductivityRecord.date == date)\
        .scalar() or 0.0

    return {
        "date": date,
        "total_employees": history.total_employees if history else 0,
        "present_today": history.present_count if history else 0,
        "absent_today": history.absent_count if history else 0,
        "reports_submitted": history.reports_submitted if history else 0,
        "reports_not_submitted": history.reports_not_submitted if history else 0,
        "late_punch_ins": history.late_punch_ins if history else 0,
        "avg_quality_score": round(float(avg_q), 1),
        "avg_productivity_score": round(float(avg_prod), 1),
        "reconciliation_valid": history.reconciliation_valid if history else True,
        "reconciliation_notes": history.reconciliation_notes if history else ""
    }

@router.get("/attention")
def get_attention_issues(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not date:
        latest = db.query(UploadHistory).order_by(desc(UploadHistory.date)).first()
        date = latest.date if latest else ""

    if not date:
        return {
            "absent_today": [],
            "unsubmitted_today": [],
            "repeated_unsubmitted": [],
            "repeated_late": [],
            "top_performers": []
        }

    return detect_attention_required_issues(db, date)

@router.get("/trends")
def get_trends(
    days: int = Query(30),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_historical_trends(db, days)
