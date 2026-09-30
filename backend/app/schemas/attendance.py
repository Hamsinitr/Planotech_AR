from typing import Optional, List
from pydantic import BaseModel

class AttendanceRecordOut(BaseModel):
    id: int
    date: str
    employee_id: Optional[str] = None
    employee_name: str
    department: str
    punch_in_time: Optional[str] = None
    punch_out_time: Optional[str] = None
    attendance_status: str
    late_status: str
    time_category: str

    class Config:
        from_attributes = True

class AttendanceDeptSummary1Row(BaseModel):
    department: str
    total_individuals: int
    before_930: int
    between_930_945: int
    after_945: int
    not_punched_or_absent: int
    reconciled: bool

class AttendanceDeptSummary2Row(BaseModel):
    department: str
    total_individuals: int
    not_punched_in: int
    present: int
    late_punch_in: int
    reconciled: bool

class AttendanceSummaryResponse(BaseModel):
    date: str
    total_employees: int
    present_today: int
    absent_today: int
    late_punch_ins: int
    not_punched_in: int
    summary_1: List[AttendanceDeptSummary1Row]
    summary_1_total: AttendanceDeptSummary1Row
    summary_2: List[AttendanceDeptSummary2Row]
    summary_2_total: AttendanceDeptSummary2Row
    reconciliation_valid: bool
    reconciliation_errors: List[str]
