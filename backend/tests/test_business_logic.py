import pytest
from app.services.attendance_service import classify_punch_in, calculate_attendance_summaries
from app.services.report_service import determine_report_status, calculate_report_summaries
from app.services.name_matcher import normalize_string, match_employee_record
from app.services.productivity_service import calculate_employee_productivity
from app.services.reconciliation import validate_reconciliation

def test_case_1_present_plus_report_submitted():
    """Case 1: Present + Report Submitted -> Submitted"""
    att_status, late_status, time_cat = classify_punch_in("09:15:00")
    assert att_status == "Present"
    assert time_cat == "Before 9:30 AM"

    rep_status, accidental = determine_report_status(attendance_status=att_status, has_report_uploaded=True)
    assert rep_status == "Submitted"
    assert accidental is False

def test_case_2_present_plus_no_report():
    """Case 2: Present + No Report -> Not Submitted"""
    att_status, late_status, time_cat = classify_punch_in("09:20:00")
    assert att_status == "Present"

    rep_status, accidental = determine_report_status(attendance_status=att_status, has_report_uploaded=False)
    assert rep_status == "Not Submitted"
    assert accidental is False

def test_case_3_absent_plus_no_report():
    """Case 3: Absent + No Report -> Absent (MUST NOT be 'Report Not Submitted')"""
    att_status, late_status, time_cat = classify_punch_in("", raw_status="Absent")
    assert att_status == "Absent"

    rep_status, accidental = determine_report_status(attendance_status=att_status, has_report_uploaded=False)
    assert rep_status == "Absent"
    assert rep_status != "Not Submitted"
    assert accidental is False

def test_case_4_absent_plus_accidental_report():
    """Case 4: Absent + Report accidentally uploaded -> Absent / flag for review"""
    att_status, late_status, time_cat = classify_punch_in("", raw_status="Absent")
    assert att_status == "Absent"

    rep_status, accidental = determine_report_status(attendance_status=att_status, has_report_uploaded=True)
    assert rep_status == "Absent"
    assert accidental is True

def test_case_5_late_plus_report_submitted():
    """Case 5: Late + Report Submitted -> Late + Submitted"""
    att_status, late_status, time_cat = classify_punch_in("09:55:00")
    assert att_status == "Present"
    assert late_status == "Late"
    assert time_cat == "After 9:45 AM"

    rep_status, accidental = determine_report_status(attendance_status=att_status, has_report_uploaded=True)
    assert rep_status == "Submitted"

def test_case_6_employee_name_normalization_and_matching():
    """Case 6: Employee appears with slightly different name formats -> Correct match"""
    name_att = "Hamsini T R"
    name_rep = "HAMSINI T.R"
    
    assert normalize_string(name_att) == normalize_string(name_rep)
    
    known = [{"employee_id": "EMP001", "name": "Hamsini T R"}]
    matched, score, is_exact = match_employee_record(emp_id=None, emp_name=name_rep, known_employees=known)
    assert matched is not None
    assert matched["name"] == "Hamsini T R"
    assert score == 100.0

def test_grace_period_classification():
    """Verify 9:30 AM - 9:45 AM bracket"""
    att_status, late_status, time_cat = classify_punch_in("09:35:00")
    assert att_status == "Present"
    assert late_status == "Grace (9:30-9:45)"
    assert time_cat == "9:30 AM–9:45 AM"

def test_mathematical_reconciliation():
    """Department and Total reconciliation checks must hold exactly"""
    att_records = [
        {"department": "IT", "time_category": "Before 9:30 AM", "attendance_status": "Present", "late_status": "On Time"},
        {"department": "IT", "time_category": "9:30 AM–9:45 AM", "attendance_status": "Present", "late_status": "Grace (9:30-9:45)"},
        {"department": "IT", "time_category": "After 9:45 AM", "attendance_status": "Present", "late_status": "Late"},
        {"department": "IT", "time_category": "Absent", "attendance_status": "Absent", "late_status": "Absent"},
    ]
    rep_records = [
        {"department": "IT", "report_status": "Submitted", "quality_rating": "Excellent", "quality_score": 100.0},
        {"department": "IT", "report_status": "Submitted", "quality_rating": "Good", "quality_score": 75.0},
        {"department": "IT", "report_status": "Not Submitted", "quality_rating": None, "quality_score": 0.0},
        {"department": "IT", "report_status": "Absent", "quality_rating": "N/A", "quality_score": 0.0},
    ]

    att_summary = calculate_attendance_summaries(att_records)
    rep_summary = calculate_report_summaries(rep_records)

    assert att_summary["reconciliation_valid"] is True
    assert rep_summary["reconciliation_valid"] is True

    valid, errors = validate_reconciliation(att_summary, rep_summary)
    assert valid is True
    assert len(errors) == 0

def test_productivity_scoring_fairness_for_absent():
    """Verify that absent employees are not unfairly penalized with a negative or zero score"""
    scores_present_sub = calculate_employee_productivity(
        attendance_status="Present",
        time_category="Before 9:30 AM",
        late_status="On Time",
        report_status="Submitted",
        quality_rating="Excellent"
    )
    assert scores_present_sub["productivity_score"] == 100.0

    scores_absent = calculate_employee_productivity(
        attendance_status="Absent",
        time_category="Absent",
        late_status="Absent",
        report_status="Absent",
        quality_rating=None
    )
    # Neutral score, not 0
    assert scores_absent["productivity_score"] >= 80.0
