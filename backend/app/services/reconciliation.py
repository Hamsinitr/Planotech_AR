from typing import List, Dict, Any, Tuple

def validate_reconciliation(
    att_summary: Dict[str, Any],
    rep_summary: Dict[str, Any]
) -> Tuple[bool, List[str]]:
    """
    Centralized Mathematical Reconciliation Validator.
    Runs all 4 mandatory business validations and returns (is_valid, list_of_errors).
    """
    errors = []

    # 1. Check Attendance Summary 1 & Summary 2 consistency from att_summary
    if not att_summary.get("reconciliation_valid", True):
        errors.extend(att_summary.get("reconciliation_errors", []))

    # 2. Check Report Summary consistency from rep_summary
    if not rep_summary.get("reconciliation_valid", True):
        errors.extend(rep_summary.get("reconciliation_errors", []))

    # 3. Cross-reconcile Attendance with Reports:
    # Total individuals in Attendance MUST equal Total individuals in Reports
    att_tot = att_summary.get("summary_1_total", {}).get("total_individuals", 0)
    rep_tot = rep_summary.get("summary_total", {}).get("total_individuals", 0)
    if att_tot != rep_tot:
        errors.append(f"Cross-Validation Error: Attendance Total Employees ({att_tot}) != Report Total Employees ({rep_tot})")

    # 4. Absent counts must match
    att_absent = att_summary.get("summary_1_total", {}).get("not_punched_or_absent", 0)
    rep_absent = rep_summary.get("summary_total", {}).get("absent", 0)
    if att_absent != rep_absent:
        errors.append(f"Cross-Validation Error: Attendance Absent/Not Punched In ({att_absent}) != Report Absent ({rep_absent})")

    return (len(errors) == 0, errors)
