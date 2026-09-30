from typing import List, Dict, Any, Tuple
from app.services.name_matcher import normalize_string

QUALITY_SCORE_MAP = {
    "excellent": 100.0,
    "good": 75.0,
    "average": 50.0,
    "poor": 25.0
}

def determine_report_status(
    attendance_status: str,
    has_report_uploaded: bool
) -> Tuple[str, bool]:
    """
    CRITICAL INVARIANT LOGIC:
    - IF employee is absent:
        Report Status = Absent (even if no report submitted! NEVER 'Report Not Submitted').
    - IF employee is absent AND a report exists:
        Report Status = Absent (flagged with accidental_submission = True).
    - ELSE IF employee is present AND report exists:
        Report Status = Submitted.
    - ELSE IF employee is present AND report does NOT exist:
        Report Status = Not Submitted.
    """
    is_absent = (attendance_status.lower() in ["absent", "leave", "holiday", "not punched in"])

    if is_absent:
        if has_report_uploaded:
            # Absent but accidental report uploaded
            return ("Absent", True)
        return ("Absent", False)
    else:
        # Present
        if has_report_uploaded:
            return ("Submitted", False)
        else:
            return ("Not Submitted", False)

def parse_quality(quality_raw: Any) -> Tuple[str, float]:
    """Normalize quality rating to (Category, Score)."""
    if not quality_raw:
        return ("N/A", 0.0)
    q_str = str(quality_raw).strip().lower()
    if "excel" in q_str:
        return ("Excellent", 100.0)
    elif "good" in q_str:
        return ("Good", 75.0)
    elif "avg" in q_str or "average" in q_str:
        return ("Average", 50.0)
    elif "poor" in q_str:
        return ("Poor", 25.0)
    
    # Check if a numeric score was passed (e.g. 85, 90)
    try:
        score = float(quality_raw)
        if score >= 85:
            return ("Excellent", score)
        elif score >= 70:
            return ("Good", score)
        elif score >= 50:
            return ("Average", score)
        else:
            return ("Poor", score)
    except ValueError:
        pass

    return ("Average", 50.0)

def calculate_report_summaries(report_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes Department Report Submission table and Department Quality table.
    Verifies: Reports Submitted + Reports Not Submitted + Absent = Total Individuals.
    """
    dept_map = {}
    dept_quality = {}

    for r in report_records:
        dept = r.get("department", "General") or "General"
        if dept not in dept_map:
            dept_map[dept] = {
                "total": 0,
                "submitted": 0,
                "not_submitted": 0,
                "absent": 0
            }
            dept_quality[dept] = {
                "total_reports": 0,
                "excellent": 0,
                "good": 0,
                "average": 0,
                "poor": 0,
                "score_sum": 0.0
            }

        dm = dept_map[dept]
        dq = dept_quality[dept]
        dm["total"] += 1

        rep_status = r.get("report_status")
        if rep_status == "Submitted":
            dm["submitted"] += 1
            # Track quality
            q_rating = r.get("quality_rating", "Average")
            q_score = r.get("quality_score", 50.0) or 50.0
            dq["total_reports"] += 1
            dq["score_sum"] += q_score
            if q_rating == "Excellent":
                dq["excellent"] += 1
            elif q_rating == "Good":
                dq["good"] += 1
            elif q_rating == "Poor":
                dq["poor"] += 1
            else:
                dq["average"] += 1
        elif rep_status == "Not Submitted":
            dm["not_submitted"] += 1
        else:
            # Absent
            dm["absent"] += 1

    summary_rows = []
    quality_rows = []
    reconciliation_errors = []

    tot_summary = {"department": "Total", "total_individuals": 0, "reports_submitted": 0, "reports_not_submitted": 0, "absent": 0, "reconciled": True}
    tot_quality = {"department": "Total", "total_reports": 0, "excellent": 0, "good": 0, "average": 0, "poor": 0, "avg_quality_score": 0.0}

    total_quality_score_sum = 0.0

    for dept, data in sorted(dept_map.items()):
        # Invariant Verification: Submitted + Not Submitted + Absent == Total
        calc_total = data["submitted"] + data["not_submitted"] + data["absent"]
        reconciled = (calc_total == data["total"])
        if not reconciled:
            reconciliation_errors.append(
                f"Dept '{dept}' Report mismatch: {data['submitted']} sub + {data['not_submitted']} not sub + {data['absent']} abs != {data['total']} total"
            )

        summary_rows.append({
            "department": dept,
            "total_individuals": data["total"],
            "reports_submitted": data["submitted"],
            "reports_not_submitted": data["not_submitted"],
            "absent": data["absent"],
            "reconciled": reconciled
        })

        tot_summary["total_individuals"] += data["total"]
        tot_summary["reports_submitted"] += data["submitted"]
        tot_summary["reports_not_submitted"] += data["not_submitted"]
        tot_summary["absent"] += data["absent"]

        # Quality table
        qdata = dept_quality[dept]
        avg_score = round(qdata["score_sum"] / qdata["total_reports"], 1) if qdata["total_reports"] > 0 else 0.0
        quality_rows.append({
            "department": dept,
            "total_reports": qdata["total_reports"],
            "excellent": qdata["excellent"],
            "good": qdata["good"],
            "average": qdata["average"],
            "poor": qdata["poor"],
            "avg_quality_score": avg_score
        })

        tot_quality["total_reports"] += qdata["total_reports"]
        tot_quality["excellent"] += qdata["excellent"]
        tot_quality["good"] += qdata["good"]
        tot_quality["average"] += qdata["average"]
        tot_quality["poor"] += qdata["poor"]
        total_quality_score_sum += qdata["score_sum"]

    # Verify Totals
    calc_total_all = tot_summary["reports_submitted"] + tot_summary["reports_not_submitted"] + tot_summary["absent"]
    tot_summary["reconciled"] = (calc_total_all == tot_summary["total_individuals"])
    if not tot_summary["reconciled"]:
        reconciliation_errors.append(
            f"Total Report mismatch: {tot_summary['reports_submitted']} sub + {tot_summary['reports_not_submitted']} not sub + {tot_summary['absent']} abs != {tot_summary['total_individuals']} total"
        )

    tot_quality["avg_quality_score"] = round(total_quality_score_sum / tot_quality["total_reports"], 1) if tot_quality["total_reports"] > 0 else 0.0

    return {
        "summary": summary_rows,
        "summary_total": tot_summary,
        "quality_summary": quality_rows,
        "quality_total": tot_quality,
        "reconciliation_valid": len(reconciliation_errors) == 0,
        "reconciliation_errors": reconciliation_errors
    }
