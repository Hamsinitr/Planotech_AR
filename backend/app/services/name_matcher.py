import re
from typing import Optional, Tuple
from rapidfuzz import fuzz

def normalize_string(val: Optional[str]) -> str:
    """Normalize string by trimming, removing extra spaces, dots, and converting to uppercase."""
    if not val:
        return ""
    s = str(val).strip()
    # Remove dots and hyphens often in initials like 'Hamsini T.R.' -> 'Hamsini T R'
    s = re.sub(r'[.\-_,]', ' ', s)
    # Collapse multiple whitespaces into a single space
    s = re.sub(r'\s+', ' ', s)
    return s.strip().upper()

def normalize_department(dept: Optional[str]) -> str:
    """Normalize department name preserving readable title case."""
    if not dept:
        return "General"
    d = str(dept).strip()
    if not d or d.lower() in ["nan", "none", "null", ""]:
        return "General"
    # Common department abbreviation expansions (check uppercase for matching)
    d_upper = re.sub(r'[^a-zA-Z0-9]', ' ', d).strip().upper()
    mapping = {
        "IT": "Information Technology",
        "INFO TECH": "Information Technology",
        "DEV": "Development",
        "ENG": "Engineering",
        "HR": "Human Resources",
        "HRM": "Human Resources",
        "MKTG": "Marketing",
        "OPS": "Operations",
        "MGMT": "Management",
        "FIN": "Finance",
        "ADMIN": "Administration",
    }
    if d_upper in mapping:
        return mapping[d_upper]
    # Title-case the original department name for consistent display
    return d.strip().title()


def match_employee_record(
    emp_id: Optional[str],
    emp_name: str,
    known_employees: list[dict]
) -> Tuple[Optional[dict], float, bool]:
    """
    Match an incoming employee record against known master records.
    Returns: (matched_dict, confidence_score_0_to_100, is_exact_match)
    """
    norm_id = normalize_string(emp_id) if emp_id else ""
    norm_name = normalize_string(emp_name)

    # 1. Exact Employee ID match
    if norm_id:
        for emp in known_employees:
            if normalize_string(emp.get("employee_id")) == norm_id:
                return (emp, 100.0, True)

    # 2. Exact Normalized Name match
    for emp in known_employees:
        if normalize_string(emp.get("name")) == norm_name:
            return (emp, 100.0, True)

    # 3. Fuzzy Name match
    best_match = None
    best_score = 0.0
    for emp in known_employees:
        target_name = normalize_string(emp.get("name"))
        score = fuzz.token_sort_ratio(norm_name, target_name)
        if score > best_score:
            best_score = score
            best_match = emp

    if best_score >= 88.0:
        return (best_match, best_score, False)

    return (None, 0.0, False)
