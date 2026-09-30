from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from app.database import Base

class ProductivityRecord(Base):
    __tablename__ = "productivity_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), index=True, nullable=False)  # YYYY-MM-DD
    employee_id = Column(String(100), index=True, nullable=True)
    employee_name = Column(String(255), index=True, nullable=False)
    department = Column(String(255), index=True, nullable=False)
    submission_score = Column(Float, nullable=False, default=0.0)
    quality_score = Column(Float, nullable=False, default=0.0)
    attendance_score = Column(Float, nullable=False, default=0.0)
    productivity_score = Column(Float, index=True, nullable=False, default=0.0)
    rank = Column(Integer, nullable=True)
    category = Column(String(50), index=True, nullable=False)  # Top Performer, Consistent, Needs Attention
    attendance_status = Column(String(50), nullable=True)
    report_status = Column(String(50), nullable=True)
    late_status = Column(String(50), nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_prod_date_empid", "date", "employee_id"),
        Index("ix_prod_date_dept", "date", "department"),
        Index("ix_prod_date_score", "date", "productivity_score"),
    )
