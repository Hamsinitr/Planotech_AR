from typing import Optional, List
from pydantic import BaseModel

class ProductivityRecordOut(BaseModel):
    id: int
    date: str
    employee_id: Optional[str] = None
    employee_name: str
    department: str
    submission_score: float
    quality_score: float
    attendance_score: float
    productivity_score: float
    rank: Optional[int] = None
    category: str
    attendance_status: Optional[str] = None
    report_status: Optional[str] = None
    late_status: Optional[str] = None

    class Config:
        from_attributes = True

class DeptProductivitySummaryRow(BaseModel):
    department: str
    employees: int
    present: int
    reports_submitted: int
    reports_not_submitted: int
    avg_quality: float
    productivity_score: float

class ProductivityLeaderboardResponse(BaseModel):
    date: str
    average_productivity: float
    top_performers: List[ProductivityRecordOut]
    needs_attention: List[ProductivityRecordOut]
    department_summary: List[DeptProductivitySummaryRow]
    all_rankings: List[ProductivityRecordOut]
