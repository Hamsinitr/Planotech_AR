from typing import Optional, List
from pydantic import BaseModel

class DailyReportOut(BaseModel):
    id: int
    date: str
    employee_id: Optional[str] = None
    employee_name: str
    department: str
    attendance_status: str
    report_status: str
    quality_rating: Optional[str] = None
    quality_score: Optional[float] = None
    accidental_submission: bool = False
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DeptReportSummaryRow(BaseModel):
    department: str
    total_individuals: int
    reports_submitted: int
    reports_not_submitted: int
    absent: int
    reconciled: bool

class DeptQualitySummaryRow(BaseModel):
    department: str
    total_reports: int
    excellent: int
    good: int
    average: int
    poor: int
    avg_quality_score: float

class ReportSummaryResponse(BaseModel):
    date: str
    total_employees: int
    reports_submitted: int
    reports_not_submitted: int
    absent: int
    submission_rate: float
    avg_quality_score: float
    summary: List[DeptReportSummaryRow]
    summary_total: DeptReportSummaryRow
    quality_summary: List[DeptQualitySummaryRow]
    quality_total: DeptQualitySummaryRow
    reconciliation_valid: bool
    reconciliation_errors: List[str]
