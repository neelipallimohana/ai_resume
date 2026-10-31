import io
import openpyxl
from datetime import datetime, date
from app.models.candidate import Candidate
from app.models.visitor import Visitor
from app.services.excel_service import ExcelService
from app.utils.constants import EXCEL_HEADERS, VISITOR_EXCEL_HEADERS

def test_exact_24_candidate_excel_columns(app):
    with app.app_context():
        # Create test candidate in MongoDB with leading zero phone number and some blank fields
        cand_doc = Candidate.create({
            "candidate_uid": "CAND-000001",
            "entry_date": datetime(2026, 10, 31),
            "name": "Aarav Sharma",
            "mobile_no": "09876543210",
            "email_id": "aarav@pharma.com",
            "qualification": "M.Pharm",
            "experience": "3 years",
            "present_company": "Sun Biotech",
            "shared_by": "Recruiter 1",
            "call_remarks": "Good communication"
        })

        # Create visitor
        Visitor.create(
            name="External Auditor",
            organization="FDA Inspection Team",
            purpose_of_visit="Facility Audit",
            person_to_meet="Head QA",
            entry_time="09:00"
        )

        wb = ExcelService.generate_candidate_workbook([cand_doc])
        ws = wb.active

        # 1. Check header count is EXACTLY 24
        header_row = [cell.value for cell in ws[1]]
        assert len(header_row) == 24, f"Expected exactly 24 headers, got {len(header_row)}"

        expected_headers = [
            "S.No", "Date", "Name", "Mobile.no", "Email ID", "Gender",
            "Qualification", "Year of passout", "Department", "Industry",
            "Function/Unit", "Dosage form / area", "Experience", "Present company",
            "Designation", "Regulatory exposure", "Audit experience", "Current CTC",
            "Expected CTC", "Notice Period", "Current location", "Preferred location",
            "Shared By", "Call remarks"
        ]
        assert header_row == expected_headers

        # 2. Check Data Row (Row 2)
        data_row = [cell.value for cell in ws[2]]
        assert len(data_row) == 24
        assert data_row[0] == 1  # S.No auto generated
        assert data_row[1] == "31-10-2026"  # Date formatted as DD-MM-YYYY
        assert data_row[2] == "Aarav Sharma"
        assert str(data_row[3]) == "09876543210"  # Mobile.no preserved leading zero
        assert data_row[4] == "aarav@pharma.com"
        assert data_row[5] is None  # Gender remains None (blank)
        assert data_row[6] == "M.Pharm"

        for val in data_row:
            if val is not None:
                assert val not in ("N/A", "Unknown", "Not Available")

        cell_values_text = " ".join(str(c) for c in data_row)
        assert "External Auditor" not in cell_values_text
        assert "FDA Inspection Team" not in cell_values_text

def test_independent_visitor_excel_export(app):
    with app.app_context():
        vis_doc = Visitor.create(
            name="Mr. Inspector",
            organization="Health Authority",
            purpose_of_visit="Official Inspection",
            person_to_meet="Director Operations",
            entry_time="10:00"
        )

        wb = ExcelService.generate_visitor_workbook([vis_doc])
        ws = wb.active

        headers = [cell.value for cell in ws[1]]
        assert headers == VISITOR_EXCEL_HEADERS
        assert len(headers) == 13

        data_row = [cell.value for cell in ws[2]]
        assert data_row[0] == 1
        assert data_row[1] == vis_doc["visitor_uid"]
        assert data_row[3] == "Mr. Inspector"
        assert data_row[5] == "Health Authority"
