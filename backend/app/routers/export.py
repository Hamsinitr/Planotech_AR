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
from app.models.user import User
from app.utils.security import decode_token

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
        raise HTTPException(status_code=404, detail=f"Processed Excel file for {date} not found.")

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
