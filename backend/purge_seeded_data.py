"""
purge_seeded_data.py – Removes the fake seeded employees (IDs 1-38) and all
their associated records from the database.
Run from the backend/ directory:  python purge_seeded_data.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord as DailyReport
from app.models.productivity import ProductivityRecord as ProductivityScore

FAKE_IDS = list(range(1, 39))  # IDs 1-38 are generic seeded names, not from real Excel

db = SessionLocal()
try:
    # Delete child records first (FK constraints)
    del_prod = db.query(ProductivityScore).filter(ProductivityScore.employee_id.in_(FAKE_IDS)).delete(synchronize_session=False)
    del_rep  = db.query(DailyReport).filter(DailyReport.employee_id.in_(FAKE_IDS)).delete(synchronize_session=False)
    del_att  = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id.in_(FAKE_IDS)).delete(synchronize_session=False)
    del_emp  = db.query(Employee).filter(Employee.id.in_(FAKE_IDS)).delete(synchronize_session=False)
    db.commit()
    print(f"✅ Removed {del_emp} fake employees")
    print(f"   {del_att} attendance records")
    print(f"   {del_rep} daily report records")
    print(f"   {del_prod} productivity score records")

    # Show remaining employees
    remaining = db.query(Employee).order_by(Employee.id).all()
    print(f"\nRemaining employees ({len(remaining)}):")
    for e in remaining:
        print(f"  [{e.id}] {e.normalized_name} — {e.department}")
finally:
    db.close()
