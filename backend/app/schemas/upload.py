from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ProcessDailyResponse(BaseModel):
    success: bool
    date: str
    message: str
    total_employees: int
    present_count: int
    absent_count: int
    reports_submitted: int
    reports_not_submitted: int
    late_punch_ins: int
    reconciliation_valid: bool
    reconciliation_errors: List[str]
    processed_excel_filename: Optional[str] = None
    download_url: Optional[str] = None
    warnings: List[str] = []

class UploadHistoryOut(BaseModel):
    id: int
    date: str
    attendance_filename: str
    report_filename: str
    processed_filename: Optional[str] = None
    status: str
    total_employees: int
    present_count: int
    absent_count: int
    reports_submitted: int
    reports_not_submitted: int
    late_punch_ins: int
    reconciliation_valid: bool
    reconciliation_notes: Optional[str] = None
    processed_at: datetime

    class Config:
        from_attributes = True

class ColumnMapping(BaseModel):
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    department: Optional[str] = None
    punch_in_time: Optional[str] = None
    punch_out_time: Optional[str] = None
    attendance_status: Optional[str] = None
    report_status: Optional[str] = None
    quality_rating: Optional[str] = None
    notes: Optional[str] = None
