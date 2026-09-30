from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(255), index=True, nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    department = Column(String(255), index=True, nullable=False)
    designation = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    joining_date = Column(String(50), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_emp_normname_dept", "normalized_name", "department"),
    )
