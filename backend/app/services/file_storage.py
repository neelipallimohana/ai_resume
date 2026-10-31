import os
import io
import re
import json
import uuid
import shutil
import zipfile
import tempfile
from datetime import datetime, date
from flask import current_app

class FileStorageService:
    @staticmethod
    def get_candidate_dir(candidate_uid, entry_date=None):
        storage_base = current_app.config["CANDIDATES_STORAGE"]
        safe_uid = "".join(c for c in candidate_uid if c.isalnum() or c in ("-", "_"))
        
        # 1. Check if it already exists directly in root
        legacy_dir = os.path.join(storage_base, safe_uid)
        if os.path.exists(legacy_dir):
            return legacy_dir
            
        # 2. Check if it already exists under any date folder
        if os.path.exists(storage_base):
            for d in os.listdir(storage_base):
                possible_path = os.path.join(storage_base, d, safe_uid)
                if os.path.isdir(possible_path):
                    return possible_path

        # 3. If new, organize by entry_date or today's date (YYYY-MM-DD)
        if isinstance(entry_date, (datetime, date)):
            d_str = entry_date.strftime("%Y-%m-%d")
        elif isinstance(entry_date, str) and len(entry_date) >= 10:
            d_str = entry_date[:10]
        else:
            d_str = datetime.utcnow().strftime("%Y-%m-%d")

        target_dir = os.path.join(storage_base, d_str, safe_uid)
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    @staticmethod
    def save_candidate_file(candidate_uid, uploaded_file, original_filename, entry_date=None):
        candidate_dir = FileStorageService.get_candidate_dir(candidate_uid, entry_date=entry_date)
        ext = original_filename.rsplit(".", 1)[1].lower() if "." in original_filename else "bin"
        stored_name = f"original_resume.{ext}"
        target_path = os.path.join(candidate_dir, stored_name)

        uploaded_file.seek(0)
        uploaded_file.save(target_path)
        file_size = os.path.getsize(target_path)

        # Write or update metadata.json in the candidate folder
        meta_path = os.path.join(candidate_dir, "metadata.json")
        metadata = {
            "candidate_uid": candidate_uid,
            "original_filename": original_filename,
            "stored_filename": stored_name,
            "file_size_bytes": file_size,
            "extension": ext,
            "saved_at": datetime.utcnow().isoformat()
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        base_dir = current_app.config.get("BASE_DIR", os.getcwd())
        rel_folder = os.path.relpath(candidate_dir, base_dir)
        return stored_name, rel_folder, file_size, target_path

    @staticmethod
    def get_candidate_file_path(candidate_uid, stored_filename):
        candidate_dir = FileStorageService.get_candidate_dir(candidate_uid)
        file_path = os.path.join(candidate_dir, stored_filename)
        abs_target = os.path.abspath(file_path)
        abs_base = os.path.abspath(current_app.config["STORAGE_PATH"])
        if not abs_target.startswith(abs_base):
            raise PermissionError("Access to path outside storage is forbidden.")
        if not os.path.exists(abs_target):
            raise FileNotFoundError(f"File not found: {stored_filename}")
        return abs_target

    @staticmethod
    def create_candidate_zip(candidate_uid):
        candidate_dir = FileStorageService.get_candidate_dir(candidate_uid)
        temp_dir = current_app.config["TEMP_STORAGE"]
        os.makedirs(temp_dir, exist_ok=True)
        
        zip_path = os.path.abspath(os.path.join(temp_dir, f"{candidate_uid}_package.zip"))
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(candidate_dir):
                for file in files:
                    file_p = os.path.join(root, file)
                    arcname = os.path.relpath(file_p, candidate_dir)
                    zipf.write(file_p, arcname=arcname)
        return zip_path

    @staticmethod
    def create_bulk_candidates_zip_by_name(candidates, period_label="export", include_excel=True):
        """
        Creates a ZIP archive containing individual folders named after each candidate.
        Inside each folder is the candidate's resume and a summary file.
        At the root, includes the 24-column Excel workbook of all candidates.
        """
        from app.services.excel_service import ExcelService

        temp_dir = current_app.config["TEMP_STORAGE"]
        os.makedirs(temp_dir, exist_ok=True)
        
        zip_filename = f"resumes_{period_label}_{uuid.uuid4().hex[:8]}.zip"
        zip_path = os.path.abspath(os.path.join(temp_dir, zip_filename))
        
        used_folder_names = {}

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for cand in candidates:
                raw_name = cand.get("name") or cand.get("candidate_uid") or "Unnamed_Candidate"
                # Sanitize folder name
                clean_folder = re.sub(r'[\\/*?:"<>|]', "", str(raw_name)).strip().replace(" ", "_")
                if not clean_folder:
                    clean_folder = cand.get("candidate_uid", "Candidate")

                # If duplicate name in batch, disambiguate with UID
                if clean_folder in used_folder_names:
                    clean_folder = f"{clean_folder}_{cand.get('candidate_uid')}"
                used_folder_names[clean_folder] = True

                uid = cand.get("candidate_uid")
                candidate_dir = FileStorageService.get_candidate_dir(uid)
                stored_name = cand.get("stored_filename")
                orig_name = cand.get("original_filename") or f"{clean_folder}_resume.pdf"

                # 1. Add original resume to candidate's named folder
                if stored_name:
                    src_file = os.path.join(candidate_dir, stored_name)
                    if os.path.exists(src_file):
                        arcname = os.path.join(clean_folder, orig_name)
                        zipf.write(src_file, arcname=arcname)

                # 2. Add Candidate Details text summary to their folder
                entry_date_val = cand.get("entry_date")
                date_display = entry_date_val.strftime("%d-%m-%Y") if isinstance(entry_date_val, (datetime, date)) else str(entry_date_val or "-")
                
                details_text = f"""========================================
CANDIDATE INFORMATION
========================================
Full Name:             {cand.get('name') or '-'}
Candidate UID:         {cand.get('candidate_uid') or '-'}
Registration Date:     {date_display}
Mobile Number:         {cand.get('mobile_no') or '-'}
Email ID:              {cand.get('email_id') or '-'}
Gender:                {cand.get('gender') or '-'}

PROFESSIONAL QUALIFICATIONS
----------------------------------------
Highest Qualification: {cand.get('qualification') or '-'}
Year of Passout:       {cand.get('year_of_passout') or '-'}
Department:            {cand.get('department') or '-'}
Industry:              {cand.get('industry') or '-'}
Function / Unit:       {cand.get('function_unit') or '-'}
Dosage Form / Area:    {cand.get('dosage_form_area') or '-'}
Total Experience:      {cand.get('experience') or '-'}

EMPLOYMENT DETAILS
----------------------------------------
Present Company:       {cand.get('present_company') or '-'}
Designation:           {cand.get('designation') or '-'}
Notice Period:         {cand.get('notice_period') or '-'}
Current CTC:           {cand.get('current_ctc') or '-'}
Expected CTC:          {cand.get('expected_ctc') or '-'}
Current Location:      {cand.get('current_location') or '-'}
Preferred Location:    {cand.get('preferred_location') or '-'}

COMPLIANCE & AUDIT
----------------------------------------
Regulatory Exposure:   {cand.get('regulatory_exposure') or '-'}
Audit Experience:      {cand.get('audit_experience') or '-'}

RECRUITER REMARKS
----------------------------------------
Shared By:             {cand.get('shared_by') or '-'}
Call Remarks:          {cand.get('call_remarks') or '-'}
========================================
"""
                zipf.writestr(os.path.join(clean_folder, "candidate_details.txt"), details_text)

            # 3. Add root-level 24-Column Excel file containing all candidates in this batch
            if include_excel and candidates:
                wb = ExcelService.generate_candidate_workbook(candidates)
                excel_io = io.BytesIO()
                wb.save(excel_io)
                excel_io.seek(0)
                zipf.writestr(f"Candidates_24_Column_Summary_{period_label}.xlsx", excel_io.getvalue())

        return zip_path

    @staticmethod
    def create_bulk_candidates_zip(candidate_uids):
        # Legacy fallback method
        from app.db import mongo
        candidates = list(mongo.candidates.find({"candidate_uid": {"$in": candidate_uids}}))
        if candidates:
            return FileStorageService.create_bulk_candidates_zip_by_name(candidates, "selected")
        
        temp_dir = current_app.config["TEMP_STORAGE"]
        os.makedirs(temp_dir, exist_ok=True)
        zip_path = os.path.abspath(os.path.join(temp_dir, f"candidates_export_{uuid.uuid4().hex[:8]}.zip"))
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for uid in candidate_uids:
                candidate_dir = FileStorageService.get_candidate_dir(uid)
                if os.path.exists(candidate_dir):
                    for root, _, files in os.walk(candidate_dir):
                        for file in files:
                            file_p = os.path.join(root, file)
                            arcname = os.path.join(uid, os.path.relpath(file_p, candidate_dir))
                            zipf.write(file_p, arcname=arcname)
        return zip_path

