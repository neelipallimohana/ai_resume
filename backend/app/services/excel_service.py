import os
from datetime import datetime, date
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from app.utils.constants import EXCEL_COLUMNS, EXCEL_HEADERS, VISITOR_EXCEL_COLUMNS, VISITOR_EXCEL_HEADERS

class ExcelService:
    @staticmethod
    def _apply_header_styling(ws, headers):
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        thin_border = Border(
            left=Side(style="thin", color="CCCCCC"),
            right=Side(style="thin", color="CCCCCC"),
            top=Side(style="thin", color="CCCCCC"),
            bottom=Side(style="thin", color="1E3A8A")
        )

        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_align
            cell.border = thin_border
            ws.row_dimensions[1].height = 28

        ws.freeze_panes = "A2"

    @staticmethod
    def _autofit_columns(ws, min_width=12, max_width=45):
        for col in ws.columns:
            col_letter = get_column_letter(col[0].column)
            max_len = 0
            for cell in col:
                val = cell.value
                if val is not None:
                    line_len = max(len(str(line)) for line in str(val).split("\n"))
                    if line_len > max_len:
                        max_len = line_len
            ws.column_dimensions[col_letter].width = max(min_width, min(max_len + 3, max_width))

    @staticmethod
    def _get_val(obj, key):
        if isinstance(obj, dict):
            return obj.get(key)
        return getattr(obj, key, None)

    @classmethod
    def generate_candidate_workbook(cls, candidates):
        """
        Generates candidate export workbook with EXACTLY the 24 required columns.
        Preserves string types for phone numbers, DD-MM-YYYY dates, blank for missing values.
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Candidates"

        cls._apply_header_styling(ws, EXCEL_HEADERS)

        data_font = Font(name="Calibri", size=10)
        data_border = Border(
            left=Side(style="thin", color="E5E7EB"),
            right=Side(style="thin", color="E5E7EB"),
            top=Side(style="thin", color="E5E7EB"),
            bottom=Side(style="thin", color="E5E7EB")
        )

        for row_idx, cand in enumerate(candidates, 2):
            s_no = row_idx - 1
            entry_date = cls._get_val(cand, "entry_date")
            date_str = ""
            if isinstance(entry_date, (datetime, date)):
                date_str = entry_date.strftime("%d-%m-%Y")
            elif isinstance(entry_date, str):
                date_str = entry_date
            
            row_values = [
                s_no,                                                # A. S.No
                date_str,                                            # B. Date
                cls._get_val(cand, "name") or "",                    # C. Name
                str(cls._get_val(cand, "mobile_no") or ""),          # D. Mobile.no (String)
                cls._get_val(cand, "email_id") or "",                # E. Email ID
                cls._get_val(cand, "gender") or "",                  # F. Gender
                cls._get_val(cand, "qualification") or "",           # G. Qualification
                cls._get_val(cand, "year_of_passout") or "",         # H. Year of passout
                cls._get_val(cand, "department") or "",              # I. Department
                cls._get_val(cand, "industry") or "",                # J. Industry
                cls._get_val(cand, "function_unit") or "",           # K. Function/Unit
                cls._get_val(cand, "dosage_form_area") or "",        # L. Dosage form / area
                cls._get_val(cand, "experience") or "",              # M. Experience
                cls._get_val(cand, "present_company") or "",         # N. Present company
                cls._get_val(cand, "designation") or "",             # O. Designation
                cls._get_val(cand, "regulatory_exposure") or "",     # P. Regulatory exposure
                cls._get_val(cand, "audit_experience") or "",        # Q. Audit experience
                cls._get_val(cand, "current_ctc") or "",             # R. Current CTC
                cls._get_val(cand, "expected_ctc") or "",            # S. Expected CTC
                cls._get_val(cand, "notice_period") or "",           # T. Notice Period
                cls._get_val(cand, "current_location") or "",        # U. Current location
                cls._get_val(cand, "preferred_location") or "",      # V. Preferred location
                cls._get_val(cand, "shared_by") or "",               # W. Shared By
                cls._get_val(cand, "call_remarks") or ""             # X. Call remarks
            ]

            for col_idx, val in enumerate(row_values, 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                if col_idx == 4:
                    cell.number_format = "@"
                    cell.value = str(val) if val else ""
                else:
                    cell.value = val if val != "" else None
                cell.font = data_font
                cell.border = data_border
                cell.alignment = Alignment(vertical="center")

            ws.row_dimensions[row_idx].height = 20

        cls._autofit_columns(ws)
        return wb

    @classmethod
    def generate_visitor_workbook(cls, visitors):
        """
        Generates independent OFC Visitor workbook.
        Never mixes visitor data into candidate export.
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "OFC Visitors"

        cls._apply_header_styling(ws, VISITOR_EXCEL_HEADERS)

        data_font = Font(name="Calibri", size=10)
        data_border = Border(
            left=Side(style="thin", color="E5E7EB"),
            right=Side(style="thin", color="E5E7EB"),
            top=Side(style="thin", color="E5E7EB"),
            bottom=Side(style="thin", color="E5E7EB")
        )

        for row_idx, vis in enumerate(visitors, 2):
            s_no = row_idx - 1
            visit_date = cls._get_val(vis, "visit_date")
            visit_date_str = ""
            if isinstance(visit_date, (datetime, date)):
                visit_date_str = visit_date.strftime("%d-%m-%Y")
            elif isinstance(visit_date, str):
                visit_date_str = visit_date

            reg_by = cls._get_val(vis, "created_by_name") or "System"

            row_values = [
                s_no,                                                # A. S.No
                cls._get_val(vis, "visitor_uid"),                    # B. Visitor ID
                visit_date_str,                                      # C. Visit Date
                cls._get_val(vis, "name"),                           # D. Visitor Name
                str(cls._get_val(vis, "mobile_no") or ""),           # E. Mobile No
                cls._get_val(vis, "organization") or "",             # F. Organization
                cls._get_val(vis, "purpose_of_visit"),               # G. Purpose of Visit
                cls._get_val(vis, "person_to_meet"),                 # H. Person to Meet
                cls._get_val(vis, "entry_time"),                     # I. Entry Time
                cls._get_val(vis, "exit_time") or "",                # J. Exit Time
                cls._get_val(vis, "status"),                         # K. Status
                reg_by,                                              # L. Registered By
                cls._get_val(vis, "notes") or ""                     # M. Notes
            ]

            for col_idx, val in enumerate(row_values, 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                if col_idx == 5:
                    cell.number_format = "@"
                    cell.value = str(val) if val else ""
                else:
                    cell.value = val if val != "" else None
                cell.font = data_font
                cell.border = data_border
                cell.alignment = Alignment(vertical="center")

            ws.row_dimensions[row_idx].height = 20

        cls._autofit_columns(ws)
        return wb

    @classmethod
    def validate_candidate_excel_headers(cls, file_stream_or_path):
        wb = openpyxl.load_workbook(file_stream_or_path, read_only=True)
        ws = wb.active
        first_row = [cell for cell in next(ws.iter_rows(values_only=True))]
        
        if len(first_row) < 24:
            return False, f"Expected 24 columns, but sheet only has {len(first_row)} columns."

        for idx, expected_header in enumerate(EXCEL_HEADERS):
            actual = str(first_row[idx]).strip() if first_row[idx] else ""
            if actual != expected_header:
                return False, f"Column {get_column_letter(idx+1)} mismatch: expected '{expected_header}', found '{actual}'."

        return True, "Valid 24-column header structure."
