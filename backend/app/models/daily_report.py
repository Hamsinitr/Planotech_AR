from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Index
from app.database import Base

class DailyReportRecord(Base):
    __tablename__ = "daily_report_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), index=True, nullable=False)  # YYYY-MM-DD
    employee_id = Column(String(100), index=True, nullable=True)
    employee_name = Column(String(255), index=True, nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    department = Column(String(255), index=True, nullable=False)
    attendance_status = Column(String(50), index=True, nullable=False)  # Present, Absent, etc.
    report_status = Column(String(50), index=True, nullable=False)      # Submitted, Not Submitted, Absent
    quality_rating = Column(String(50), nullable=True)                  # Excellent, Good, Average, Poor, N/A
    quality_score = Column(Float, nullable=True)                        # 0 - 100
    accidental_submission = Column(Boolean, default=False)              # True if absent but submitted
    notes = Column(Text, nullable=True)
    source_file = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_rep_date_empid", "date", "employee_id"),
        Index("ix_rep_date_dept", "date", "department"),
        Index("ix_rep_date_status", "date", "report_status"),
    )
