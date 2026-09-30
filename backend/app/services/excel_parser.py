import io
import re
from datetime import datetime, date, time
from typing import Optional, Dict, Any, List
import pandas as pd

COLUMN_SYNONYMS = {
    "date": ["date", "attendance date", "report date", "punch date", "work date", "log date", "entry date"],
    "employee_id": ["employee id", "empid", "emp id", "employee code", "emp code", "staff id", "id", "emp_no", "badge"],
    "employee_name": ["employee name", "name", "emp name", "staff name", "employee", "full name", "worker name"],
    "department": ["department", "dept", "department name", "division", "team", "dept.", "employee department"],
    "punch_in_time": ["punch in", "in time", "punch in time", "check in", "check-in", "signin", "login time", "in", "punch_in"],
    "punch_out_time": ["punch out", "out time", "punch out time", "check out", "check-out", "signout", "logout time", "out", "punch_out"],
    "attendance_status": ["attendance status", "status", "attendance", "present status", "att status", "att_status"],
    # report_submitted is checked FIRST (higher priority) — maps 'Report Submitted' Yes/No column
    "report_submitted": ["report submitted", "report_submitted", "is submitted", "submission status"],
    "report_status": ["report status", "work status"],
    "quality_rating": ["report quality", "quality", "rating", "grade", "quality score", "review", "evaluation"],
    "notes": ["task summary", "tasks", "notes", "description", "remarks", "work done", "summary", "report details", "report"]
}

def detect_column_mapping(columns: List[str]) -> Dict[str, Optional[str]]:
    """Intelligently maps raw Excel column names to standard fields."""
    mapping = {}
    normalized_cols = {col: re.sub(r'[^a-z0-9]', ' ', str(col).lower()).strip() for col in columns}

    for standard_key, synonyms in COLUMN_SYNONYMS.items():
        matched_col = None
        # Try exact match with synonyms
        for raw_col, norm_col in normalized_cols.items():
            if norm_col in synonyms:
                matched_col = raw_col
                break
        # Try substring if not found
        if not matched_col:
            for raw_col, norm_col in normalized_cols.items():
                for syn in synonyms:
                    if syn in norm_col or norm_col in syn:
                        matched_col = raw_col
                        break
                if matched_col:
                    break
        mapping[standard_key] = matched_col

    return mapping

def parse_time_value(val: Any) -> Optional[time]:
    """Parse multiple time formats into datetime.time object."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, time):
        return val
    if isinstance(val, datetime):
        return val.time()

    val_str = str(val).strip()
    if not val_str or val_str.lower() in ["none", "nan", "null", "-", "na", "n/a", ""]:
        return None

    # Try common time formats
    time_formats = [
        "%H:%M:%S",
        "%H:%M",
        "%I:%M:%S %p",
        "%I:%M %p",
        "%I:%M%p",
        "%H.%M",
        "%H.%M.%S"
    ]
    # Clean up string
    val_str = re.sub(r'\s+', ' ', val_str)
    for fmt in time_formats:
        try:
            return datetime.strptime(val_str, fmt).time()
        except ValueError:
            continue

    return None

def parse_date_value(val: Any) -> Optional[str]:
    """Parse multiple date formats into standard YYYY-MM-DD string."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (datetime, date, pd.Timestamp)):
        return val.strftime("%Y-%m-%d")

    val_str = str(val).strip()
    if not val_str or val_str.lower() in ["none", "nan", "null", "-", "na", "n/a", ""]:
        return None

    for fmt in [
        "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y",
        "%d-%b-%Y", "%d-%B-%Y", "%d.%m.%Y", "%Y.%m.%d"
    ]:
        try:
            return datetime.strptime(val_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    try:
        dt = pd.to_datetime(val_str, dayfirst=True)
        if not pd.isna(dt):
            return dt.strftime("%Y-%m-%d")
    except Exception:
        pass
    return None

def time_to_str(t: Optional[time]) -> Optional[str]:
    """Convert time object to HH:MM:SS string."""
    if not t:
        return None
    return t.strftime("%H:%M:%S")

def parse_excel_file(file_contents: bytes, custom_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """Parse an Excel file buffer into a list of standardized row dicts across sheets."""
    excel_file = io.BytesIO(file_contents)
    xl = pd.ExcelFile(excel_file)
    
    df = None
    mapping = None

    # Try sheets until one with employee_name is found
    for sheet_name in xl.sheet_names:
        temp_df = xl.parse(sheet_name)
        temp_df.columns = [str(c).strip() for c in temp_df.columns]
        temp_mapping = detect_column_mapping(list(temp_df.columns))
        if custom_mapping:
            for k, v in custom_mapping.items():
                if v and v in temp_df.columns:
                    temp_mapping[k] = v
        if temp_mapping.get("employee_name"):
            df = temp_df
            mapping = temp_mapping
            break

    if df is None or not mapping or not mapping.get("employee_name"):
        # Fallback to first sheet
        df = xl.parse(0)
        df.columns = [str(c).strip() for c in df.columns]
        mapping = detect_column_mapping(list(df.columns))
        if custom_mapping:
            for k, v in custom_mapping.items():
                if v and v in df.columns:
                    mapping[k] = v
        if not mapping.get("employee_name"):
            raise ValueError("Required employee name column could not be detected. Please provide a column mapping.")


    results = []
    for _, row in df.iterrows():
        emp_name = str(row[mapping["employee_name"]]).strip() if mapping.get("employee_name") and not pd.isna(row[mapping["employee_name"]]) else None
        if not emp_name or emp_name.lower() in ["total", "nan", "none", ""]:
            continue

        emp_id = str(row[mapping["employee_id"]]).strip() if mapping.get("employee_id") and not pd.isna(row[mapping["employee_id"]]) else None
        dept = str(row[mapping["department"]]).strip() if mapping.get("department") and not pd.isna(row[mapping["department"]]) else "General"

        punch_in = parse_time_value(row[mapping["punch_in_time"]]) if mapping.get("punch_in_time") else None
        punch_out = parse_time_value(row[mapping["punch_out_time"]]) if mapping.get("punch_out_time") else None

        att_status = str(row[mapping["attendance_status"]]).strip() if mapping.get("attendance_status") and not pd.isna(row[mapping["attendance_status"]]) else None
        rep_submitted_raw = None
        if mapping.get("report_submitted"):
            val = row[mapping["report_submitted"]]
            rep_submitted_raw = str(val).strip().lower() if val is not None and not pd.isna(val) else None

        rep_status = str(row[mapping["report_status"]]).strip() if mapping.get("report_status") and not pd.isna(row[mapping["report_status"]]) else None
        quality = str(row[mapping["quality_rating"]]).strip() if mapping.get("quality_rating") and not pd.isna(row[mapping["quality_rating"]]) else None
        notes = str(row[mapping["notes"]]).strip() if mapping.get("notes") and not pd.isna(row[mapping["notes"]]) else None
        rec_date = parse_date_value(row[mapping["date"]]) if mapping.get("date") else None

        results.append({
            "record_date": rec_date,
            "employee_id": emp_id,
            "employee_name": emp_name,
            "department": dept,
            "punch_in_time": time_to_str(punch_in),
            "punch_out_time": time_to_str(punch_out),
            "attendance_status": att_status,
            "report_status": rep_status,
            "report_submitted": rep_submitted_raw,  # raw 'yes'/'no' from dedicated column if present
            "quality_rating": quality,
            "notes": notes
        })

    return results
