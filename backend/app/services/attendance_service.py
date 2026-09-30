from datetime import time
from typing import List, Dict, Any, Tuple
from app.services.excel_parser import parse_time_value

# Time thresholds
THRESHOLD_930 = time(9, 30, 0)
THRESHOLD_945 = time(9, 45, 0)

def classify_punch_in(punch_in_str: str, raw_status: str = None) -> Tuple[str, str, str]:
    """
    Classifies punch in time into:
    1. attendance_status: 'Present' or 'Absent' or 'Leave' or 'Not Punched In'
    2. late_status: 'On Time', 'Grace (9:30-9:45)', 'Late', 'Not Punched In', 'Absent'
    3. time_category: 'Before 9:30 AM', '9:30 AM–9:45 AM', 'After 9:45 AM', 'Not Punched In', 'Absent'
    """
    if raw_status:
        st = raw_status.strip().lower()
        if st in ["absent", "leave", "holiday"]:
            status_name = raw_status.strip().title()
            return (status_name, "Absent", "Absent")

    t = parse_time_value(punch_in_str)
    if not t:
        if raw_status and raw_status.strip().lower() in ["present"]:
            # Present marked but no punch in time recorded
            return ("Present", "On Time", "Before 9:30 AM")
        return ("Absent", "Absent", "Absent")

    # Has a valid punch-in time => Present
    if t < THRESHOLD_930:
        return ("Present", "On Time", "Before 9:30 AM")
    elif THRESHOLD_930 <= t <= THRESHOLD_945:
        return ("Present", "Grace (9:30-9:45)", "9:30 AM–9:45 AM")
    else:
        return ("Present", "Late", "After 9:45 AM")

def calculate_attendance_summaries(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates Summary 1 and Summary 2 per department and overall company.
    Verifies mathematical reconciliation.
    """
    # Group by department
    dept_map = {}
    for r in records:
        dept = r.get("department", "General") or "General"
        if dept not in dept_map:
            dept_map[dept] = {
                "total": 0,
                "before_930": 0,
                "between_930_945": 0,
                "after_945": 0,
                "not_punched_or_absent": 0,
                "present": 0,
                "late": 0,
                "not_punched_in": 0
            }

        dm = dept_map[dept]
        dm["total"] += 1

        time_cat = r.get("time_category")
        att_status = r.get("attendance_status")
        late_status = r.get("late_status")

        if time_cat == "Before 9:30 AM":
            dm["before_930"] += 1
            dm["present"] += 1
        elif time_cat == "9:30 AM–9:45 AM":
            dm["between_930_945"] += 1
            dm["present"] += 1
        elif time_cat == "After 9:45 AM":
            dm["after_945"] += 1
            dm["present"] += 1
            dm["late"] += 1
        else:
            # Absent / Not Punched In
            dm["not_punched_or_absent"] += 1
            dm["not_punched_in"] += 1

    summary_1_rows = []
    summary_2_rows = []
    reconciliation_errors = []

    tot_1 = {"department": "Total", "total_individuals": 0, "before_930": 0, "between_930_945": 0, "after_945": 0, "not_punched_or_absent": 0, "reconciled": True}
    tot_2 = {"department": "Total", "total_individuals": 0, "not_punched_in": 0, "present": 0, "late_punch_in": 0, "reconciled": True}

    for dept, data in sorted(dept_map.items()):
        # Verification 1: Before 9:30 + 9:30-9:45 + After 9:45 + Not Punched/Absent == Total Individuals
        calc_total_1 = data["before_930"] + data["between_930_945"] + data["after_945"] + data["not_punched_or_absent"]
        reconciled_1 = (calc_total_1 == data["total"])
        if not reconciled_1:
            reconciliation_errors.append(f"Dept '{dept}' Summary 1 mismatch: sum {calc_total_1} != total {data['total']}")

        summary_1_rows.append({
            "department": dept,
            "total_individuals": data["total"],
            "before_930": data["before_930"],
            "between_930_945": data["between_930_945"],
            "after_945": data["after_945"],
            "not_punched_or_absent": data["not_punched_or_absent"],
            "reconciled": reconciled_1
        })

        # Verification 2: Present + Not Punched In == Total Individuals
        calc_total_2 = data["present"] + data["not_punched_in"]
        # And Before + Grace + Late == Present
        sum_present = data["before_930"] + data["between_930_945"] + data["after_945"]
        reconciled_2 = (calc_total_2 == data["total"]) and (sum_present == data["present"])
        if not reconciled_2:
            reconciliation_errors.append(f"Dept '{dept}' Summary 2 mismatch: present {data['present']} + not punched {data['not_punched_in']} != total {data['total']}")

        summary_2_rows.append({
            "department": dept,
            "total_individuals": data["total"],
            "not_punched_in": data["not_punched_in"],
            "present": data["present"],
            "late_punch_in": data["late"],
            "reconciled": reconciled_2
        })

        # Sum into totals
        tot_1["total_individuals"] += data["total"]
        tot_1["before_930"] += data["before_930"]
        tot_1["between_930_945"] += data["between_930_945"]
        tot_1["after_945"] += data["after_945"]
        tot_1["not_punched_or_absent"] += data["not_punched_or_absent"]

        tot_2["total_individuals"] += data["total"]
        tot_2["not_punched_in"] += data["not_punched_in"]
        tot_2["present"] += data["present"]
        tot_2["late_punch_in"] += data["late"]

    # Verify Totals
    tot_1_calc = tot_1["before_930"] + tot_1["between_930_945"] + tot_1["after_945"] + tot_1["not_punched_or_absent"]
    tot_1["reconciled"] = (tot_1_calc == tot_1["total_individuals"])
    if not tot_1["reconciled"]:
        reconciliation_errors.append(f"Total Summary 1 mismatch: sum {tot_1_calc} != total {tot_1['total_individuals']}")

    tot_2_calc = tot_2["present"] + tot_2["not_punched_in"]
    tot_2["reconciled"] = (tot_2_calc == tot_2["total_individuals"]) and (tot_1["before_930"] + tot_1["between_930_945"] + tot_1["after_945"] == tot_2["present"])
    if not tot_2["reconciled"]:
        reconciliation_errors.append(f"Total Summary 2 mismatch: present {tot_2['present']} + not punched {tot_2['not_punched_in']} != total {tot_2['total_individuals']}")

    return {
        "summary_1": summary_1_rows,
        "summary_1_total": tot_1,
        "summary_2": summary_2_rows,
        "summary_2_total": tot_2,
        "reconciliation_valid": len(reconciliation_errors) == 0,
        "reconciliation_errors": reconciliation_errors
    }
