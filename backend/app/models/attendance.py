from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from app.database import Base

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), index=True, nullable=False)  # YYYY-MM-DD
    employee_id = Column(String(100), index=True, nullable=True)
    employee_name = Column(String(255), index=True, nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    department = Column(String(255), index=True, nullable=False)
    punch_in_time = Column(String(50), nullable=True)
    punch_out_time = Column(String(50), nullable=True)
    attendance_status = Column(String(50), index=True, nullable=False)  # Present, Absent, Leave, Holiday, Not Punched In
    late_status = Column(String(50), index=True, nullable=False)        # On Time, Grace (9:30-9:45), Late, Not Punched In, Absent
    time_category = Column(String(50), index=True, nullable=False)      # Before 9:30 AM, 9:30 AM–9:45 AM, After 9:45 AM, Not Punched In, Absent
    source_file = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_att_date_empid", "date", "employee_id"),
        Index("ix_att_date_dept", "date", "department"),
        Index("ix_att_date_status", "date", "attendance_status"),
    )
