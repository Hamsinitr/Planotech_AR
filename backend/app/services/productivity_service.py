from typing import List, Dict, Any, Optional

DEFAULT_WEIGHTS = {
    "report_submission_weight": 0.50,
    "report_quality_weight": 0.30,
    "attendance_weight": 0.20,
    "excellent_score": 100.0,
    "good_score": 75.0,
    "average_score": 50.0,
    "poor_score": 25.0,
    "before_930_score": 100.0,
    "grace_score": 80.0,
    "after_945_score": 40.0
}

def calculate_employee_productivity(
    attendance_status: str,
    time_category: str,
    late_status: str,
    report_status: str,
    quality_rating: Optional[str],
    weights: Dict[str, float] = None
) -> Dict[str, float]:
    """
    Computes submission_score, quality_score, attendance_score, and weighted productivity_score.
    Crucial rule: Absent employees are NOT penalized.
    """
    w = DEFAULT_WEIGHTS.copy()
    if weights:
        w.update(weights)

    is_absent = (attendance_status.lower() in ["absent", "leave", "holiday"])

    # 1. Submission Score
    if is_absent:
        # Neutral score (85.0 baseline so absent days do not pull down overall averages unfairly)
        sub_score = 85.0
    elif report_status == "Submitted":
        sub_score = 100.0
    else:  # Not Submitted
        sub_score = 0.0

    # 2. Quality Score
    if is_absent or report_status != "Submitted":
        qual_score = 85.0 if is_absent else 0.0
    else:
        q = (quality_rating or "Average").lower()
        if "excel" in q:
            qual_score = w["excellent_score"]
        elif "good" in q:
            qual_score = w["good_score"]
        elif "poor" in q:
            qual_score = w["poor_score"]
        else:
            qual_score = w["average_score"]

    # 3. Attendance Score
    if is_absent:
        att_score = 85.0
    elif time_category == "Before 9:30 AM":
        att_score = w["before_930_score"]
    elif time_category == "9:30 AM–9:45 AM":
        att_score = w["grace_score"]
    elif time_category == "After 9:45 AM":
        att_score = w["after_945_score"]
    else:
        att_score = 0.0

    # Total weighted score normalized to 0-100
    prod_score = (
        sub_score * w["report_submission_weight"] +
        qual_score * w["report_quality_weight"] +
        att_score * w["attendance_weight"]
    )
    prod_score = round(max(0.0, min(100.0, prod_score)), 1)

    return {
        "submission_score": sub_score,
        "quality_score": qual_score,
        "attendance_score": att_score,
        "productivity_score": prod_score
    }

def process_productivity_records(
    combined_records: List[Dict[str, Any]],
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Ranks employees and partitions into Top Performers, Consistent, and Needs Attention.
    Computes department-level productivity.
    """
    processed = []
    for r in combined_records:
        scores = calculate_employee_productivity(
            attendance_status=r.get("attendance_status", "Absent"),
            time_category=r.get("time_category", "Absent"),
            late_status=r.get("late_status", "Absent"),
            report_status=r.get("report_status", "Absent"),
            quality_rating=r.get("quality_rating"),
            weights=weights
        )
        item = dict(r)
        item.update(scores)
        processed.append(item)

    # Sort descending by productivity_score
    processed.sort(key=lambda x: x["productivity_score"], reverse=True)

    # Assign ranks and category
    for idx, item in enumerate(processed, 1):
        item["rank"] = idx
        score = item["productivity_score"]
        is_absent = (item.get("attendance_status", "").lower() in ["absent", "leave", "holiday"])
        
        if score >= 85.0:
            item["category"] = "Top Performer"
        elif score >= 70.0:
            item["category"] = "Consistent"
        else:
            # If absent, not marked "Needs Attention" unless repeated
            if is_absent:
                item["category"] = "Absent / Excused"
            else:
                item["category"] = "Needs Attention"

    # Department summary
    dept_map = {}
    total_score_sum = 0.0
    for r in processed:
        dept = r.get("department", "General") or "General"
        if dept not in dept_map:
            dept_map[dept] = {
                "employees": 0,
                "present": 0,
                "submitted": 0,
                "not_submitted": 0,
                "quality_sum": 0.0,
                "quality_count": 0,
                "prod_score_sum": 0.0
            }
        dm = dept_map[dept]
        dm["employees"] += 1
        if r.get("attendance_status") == "Present":
            dm["present"] += 1
        if r.get("report_status") == "Submitted":
            dm["submitted"] += 1
            dm["quality_sum"] += r.get("quality_score", 0.0)
            dm["quality_count"] += 1
        elif r.get("report_status") == "Not Submitted":
            dm["not_submitted"] += 1
        
        dm["prod_score_sum"] += r["productivity_score"]
        total_score_sum += r["productivity_score"]

    dept_summary = []
    for dept, data in sorted(dept_map.items()):
        avg_q = round(data["quality_sum"] / data["quality_count"], 1) if data["quality_count"] > 0 else 0.0
        avg_p = round(data["prod_score_sum"] / data["employees"], 1) if data["employees"] > 0 else 0.0
        dept_summary.append({
            "department": dept,
            "employees": data["employees"],
            "present": data["present"],
            "reports_submitted": data["submitted"],
            "reports_not_submitted": data["not_submitted"],
            "avg_quality": avg_q,
            "productivity_score": avg_p
        })

    avg_productivity = round(total_score_sum / len(processed), 1) if processed else 0.0
    top_performers = [r for r in processed if r["category"] == "Top Performer"]
    needs_attention = [r for r in processed if r["category"] == "Needs Attention"]

    return {
        "all_rankings": processed,
        "average_productivity": avg_productivity,
        "top_performers": top_performers[:10],
        "needs_attention": needs_attention,
        "department_summary": dept_summary
    }
