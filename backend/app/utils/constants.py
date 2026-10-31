# STRICT 24-COLUMN EXCEL FORMAT
EXCEL_COLUMNS = [
    ("A", "S.No", "s_no"),
    ("B", "Date", "date"),
    ("C", "Name", "name"),
    ("D", "Mobile.no", "mobile_no"),
    ("E", "Email ID", "email_id"),
    ("F", "Gender", "gender"),
    ("G", "Qualification", "qualification"),
    ("H", "Year of passout", "year_of_passout"),
    ("I", "Department", "department"),
    ("J", "Industry", "industry"),
    ("K", "Function/Unit", "function_unit"),
    ("L", "Dosage form / area", "dosage_form_area"),
    ("M", "Experience", "experience"),
    ("N", "Present company", "present_company"),
    ("O", "Designation", "designation"),
    ("P", "Regulatory exposure", "regulatory_exposure"),
    ("Q", "Audit experience", "audit_experience"),
    ("R", "Current CTC", "current_ctc"),
    ("S", "Expected CTC", "expected_ctc"),
    ("T", "Notice Period", "notice_period"),
    ("U", "Current location", "current_location"),
    ("V", "Preferred location", "preferred_location"),
    ("W", "Shared By", "shared_by"),
    ("X", "Call remarks", "call_remarks"),
]

EXCEL_HEADERS = [col[1] for col in EXCEL_COLUMNS]

# Visitor Excel Headers (Completely independent from candidate export)
VISITOR_EXCEL_COLUMNS = [
    ("A", "S.No", "s_no"),
    ("B", "Visitor ID", "visitor_uid"),
    ("C", "Visit Date", "visit_date"),
    ("D", "Visitor Name", "name"),
    ("E", "Mobile No", "mobile_no"),
    ("F", "Organization", "organization"),
    ("G", "Purpose of Visit", "purpose_of_visit"),
    ("H", "Person to Meet", "person_to_meet"),
    ("I", "Entry Time", "entry_time"),
    ("J", "Exit Time", "exit_time"),
    ("K", "Status", "status"),
    ("L", "Registered By", "created_by_name"),
    ("M", "Notes", "notes"),
]

VISITOR_EXCEL_HEADERS = [col[1] for col in VISITOR_EXCEL_COLUMNS]

EXTRACTION_STATUSES = [
    "Uploaded",
    "Processing",
    "Needs Review",
    "Completed",
    "Failed",
    "Manual",
]
