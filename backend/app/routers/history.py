from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.upload_history import UploadHistory
from app.schemas.upload import UploadHistoryOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/upload-history", tags=["Upload History"])

@router.get("", response_model=List[UploadHistoryOut])
def get_upload_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(UploadHistory).order_by(desc(UploadHistory.date)).all()
