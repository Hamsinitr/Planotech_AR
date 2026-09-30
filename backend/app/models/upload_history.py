from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), unique=True, index=True, nullable=False)  # YYYY-MM-DD
    attendance_filename = Column(String(255), nullable=False)
    report_filename = Column(String(255), nullable=False)
    processed_filename = Column(String(255), nullable=True)
    status = Column(String(50), default="Processed")  # Processed, Failed, Warning
    total_employees = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    reports_submitted = Column(Integer, default=0)
    reports_not_submitted = Column(Integer, default=0)
    late_punch_ins = Column(Integer, default=0)
    reconciliation_valid = Column(Boolean, default=True)
    reconciliation_notes = Column(Text, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
