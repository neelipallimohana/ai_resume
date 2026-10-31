import re
import os
import uuid
from werkzeug.utils import secure_filename
from app.db import mongo, to_object_id
from app.models.candidate import Candidate

def clean_email(email):
    if not email:
        return None
    cleaned = str(email).strip().lower().rstrip(".,;:|")
    # If truncated like @gmail or @gmail.
    if "@" in cleaned:
        user_part, domain_part = cleaned.split("@", 1)
        domain_part = domain_part.strip().rstrip(".,;:|")
        if domain_part in ("gmail", "gmail.", "googlemail"):
            cleaned = f"{user_part}@gmail.com"
        elif domain_part in ("yahoo", "yahoo.", "ymail"):
            cleaned = f"{user_part}@yahoo.com"
        elif domain_part in ("outlook", "outlook.", "hotmail"):
            cleaned = f"{user_part}@outlook.com"
        elif "." not in domain_part and domain_part:
            cleaned = f"{user_part}@{domain_part}.com"
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cleaned)
    return match.group(0) if match else cleaned

def clean_phone(phone):
    if not phone:
        return None
    raw = str(phone).strip()
    cleaned = re.sub(r"[^\d+]", "", raw)
    return cleaned if cleaned else raw

def generate_candidate_uid():
    return Candidate.generate_uid()

def generate_visitor_uid():
    from app.models.visitor import Visitor
    return Visitor.generate_uid()

def allowed_file(filename, allowed_extensions=None):
    if not allowed_extensions:
        allowed_extensions = {"pdf", "docx"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

def make_safe_filename(original_filename):
    ext = original_filename.rsplit(".", 1)[1].lower() if "." in original_filename else "bin"
    safe_base = secure_filename(original_filename.rsplit(".", 1)[0]) or "resume"
    unique_suffix = uuid.uuid4().hex[:8]
    return f"{safe_base}_{unique_suffix}.{ext}"

def check_duplicate_candidate(email=None, mobile=None, name=None, present_company=None, exclude_id=None):
    """
    Checks for potential duplicate candidate by normalized email, phone, or name+company in MongoDB.
    Returns: (is_duplicate: bool, warning_message: str, existing_candidate: dict or None)
    """
    warnings = []
    existing = None

    exclude_oid = to_object_id(exclude_id) if exclude_id else None

    cleaned_e = clean_email(email)
    if cleaned_e:
        query = {"email_id": {"$regex": f"^{re.escape(cleaned_e)}$", "$options": "i"}}
        if exclude_oid:
            query["_id"] = {"$ne": exclude_oid}
        found = mongo.candidates.find_one(query)
        if found:
            warnings.append(f"A candidate with email '{cleaned_e}' already exists ({found.get('candidate_uid')} - {found.get('name') or 'Unnamed'}).")
            existing = found

    cleaned_p = clean_phone(mobile)
    if cleaned_p and len(cleaned_p) >= 7:
        core_digits = cleaned_p[-10:] if len(cleaned_p) >= 10 else cleaned_p
        query = {"mobile_no": {"$regex": re.escape(core_digits)}}
        if exclude_oid:
            query["_id"] = {"$ne": exclude_oid}
        found = mongo.candidates.find_one(query)
        if found and (not existing or found["_id"] != existing["_id"]):
            warnings.append(f"A candidate with phone '{cleaned_p}' already exists ({found.get('candidate_uid')} - {found.get('name') or 'Unnamed'}).")
            if not existing:
                existing = found

    if not existing and name and present_company:
        name_clean = name.strip()
        company_clean = present_company.strip()
        if len(name_clean) >= 3 and len(company_clean) >= 3:
            query = {
                "name": {"$regex": re.escape(name_clean), "$options": "i"},
                "present_company": {"$regex": re.escape(company_clean), "$options": "i"}
            }
            if exclude_oid:
                query["_id"] = {"$ne": exclude_oid}
            found = mongo.candidates.find_one(query)
            if found:
                warnings.append(f"A candidate with matching name '{name}' and company '{present_company}' already exists ({found.get('candidate_uid')}).")
                existing = found

    if warnings:
        return True, " ".join(warnings), Candidate.to_dict(existing) if existing else None
    return False, None, None
