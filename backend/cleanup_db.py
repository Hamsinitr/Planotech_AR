"""
cleanup_db.py – Removes junk employees (ADMIN, HR, TESTACCOUNT) and fixes
department name inconsistencies across all tables.
Run from backend/ directory: python cleanup_db.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.daily_report import DailyReportRecord
from app.models.productivity import ProductivityRecord

JUNK_NAMES = {'ADMIN', 'HR', 'TESTACCOUNT', 'GRAND TOTAL', 'SUB TOTAL', 'TOTAL', 'HAMSINI T R'}

DEPT_FIX = {
    'Sales And Marketing': 'Sales & Marketing',
    'Operations-Support':  'Operations Support',
    'Testaccount':         None,   # will be deleted with employee
}

db = SessionLocal()
try:
    # 1. Remove junk employees + their records
    junk = db.query(Employee).filter(Employee.normalized_name.in_(JUNK_NAMES)).all()
    junk_ids = [e.id for e in junk]
    print(f"Removing {len(junk)} junk employees: {[e.normalized_name for e in junk]}")

    db.query(ProductivityRecord).filter(ProductivityRecord.employee_id.in_(junk_ids)).delete(synchronize_session=False)
    db.query(DailyReportRecord).filter(DailyReportRecord.employee_id.in_(junk_ids)).delete(synchronize_session=False)
    db.query(AttendanceRecord).filter(AttendanceRecord.employee_id.in_(junk_ids)).delete(synchronize_session=False)
    db.query(Employee).filter(Employee.id.in_(junk_ids)).delete(synchronize_session=False)

    # 2. Fix department names on Employee table
    for old_dept, new_dept in DEPT_FIX.items():
        if new_dept:
            updated = db.query(Employee).filter(Employee.department == old_dept).all()
            for e in updated:
                e.department = new_dept
                print(f"  Fixed dept: [{e.id}] {e.normalized_name}: '{old_dept}' → '{new_dept}'")

    # 3. Fix department names on AttendanceRecord table
    for old_dept, new_dept in DEPT_FIX.items():
        if new_dept:
            rows = db.query(AttendanceRecord).filter(AttendanceRecord.department == old_dept).all()
            for r in rows:
                r.department = new_dept
            if rows:
                print(f"  Fixed {len(rows)} attendance records: '{old_dept}' → '{new_dept}'")

    # 4. Fix department names on DailyReportRecord table
    for old_dept, new_dept in DEPT_FIX.items():
        if new_dept:
            rows = db.query(DailyReportRecord).filter(DailyReportRecord.department == old_dept).all()
            for r in rows:
                r.department = new_dept
            if rows:
                print(f"  Fixed {len(rows)} report records: '{old_dept}' → '{new_dept}'")

    db.commit()
    print("\n✅ Cleanup complete")

    # Show final employee list
    remaining = db.query(Employee).order_by(Employee.normalized_name).all()
    print(f"\nFinal employee list ({len(remaining)}):")
    for e in remaining:
        print(f"  [{e.id:3}] {e.normalized_name:<35} {e.department}")
finally:
    db.close()
