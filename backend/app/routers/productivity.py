from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.productivity import ProductivityRecord
from app.models.upload_history import UploadHistory
from app.schemas.productivity import ProductivityLeaderboardResponse, ProductivityRecordOut, DeptProductivitySummaryRow
from app.routers.auth import get_current_user

router = APIRouter(prefix="/productivity", tags=["Productivity Analytics"])

@router.get("/summary", response_model=ProductivityLeaderboardResponse)
def get_productivity_summary(
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
            "average_productivity": 0.0,
            "top_performers": [],
            "needs_attention": [],
            "department_summary": [],
            "all_rankings": []
        }

    records = db.query(ProductivityRecord).filter(ProductivityRecord.date == date)\
        .order_by(ProductivityRecord.productivity_score.desc()).all()

    avg_score = db.query(func.avg(ProductivityRecord.productivity_score))\
        .filter(ProductivityRecord.date == date).scalar() or 0.0

    top_performers = [r for r in records if r.category == "Top Performer"]
    needs_attention = [r for r in records if r.category == "Needs Attention"]

    # Calculate department-level productivity
    dept_map = {}
    for r in records:
        d = r.department or "General"
        if d not in dept_map:
            dept_map[d] = {
                "employees": 0,
                "present": 0,
                "submitted": 0,
                "not_submitted": 0,
                "quality_sum": 0.0,
                "quality_count": 0,
                "prod_score_sum": 0.0
            }
        dm = dept_map[d]
        dm["employees"] += 1
        if r.attendance_status == "Present":
            dm["present"] += 1
        if r.report_status == "Submitted":
            dm["submitted"] += 1
            dm["quality_sum"] += (r.quality_score or 0.0)
            dm["quality_count"] += 1
        elif r.report_status == "Not Submitted":
            dm["not_submitted"] += 1
        dm["prod_score_sum"] += r.productivity_score

    dept_summary = []
    for d, data in sorted(dept_map.items()):
        avg_q = round(data["quality_sum"] / data["quality_count"], 1) if data["quality_count"] > 0 else 0.0
        avg_p = round(data["prod_score_sum"] / data["employees"], 1) if data["employees"] > 0 else 0.0
        dept_summary.append({
            "department": d,
            "employees": data["employees"],
            "present": data["present"],
            "reports_submitted": data["submitted"],
            "reports_not_submitted": data["not_submitted"],
            "avg_quality": avg_q,
            "productivity_score": avg_p
        })

    return {
        "date": date,
        "average_productivity": round(float(avg_score), 1),
        "top_performers": top_performers[:10],
        "needs_attention": needs_attention,
        "department_summary": dept_summary,
        "all_rankings": records
    }
