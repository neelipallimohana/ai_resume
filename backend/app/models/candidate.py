from datetime import datetime, date
from bson import ObjectId
from app.db import mongo, to_object_id

class Candidate:
    @staticmethod
    def generate_uid():
        count = mongo.candidates.count_documents({})
        # Find highest CAND-XXXXXX if exists
        last = mongo.candidates.find_one({}, sort=[("candidate_uid", -1)])
        if last and "candidate_uid" in last and last["candidate_uid"].startswith("CAND-"):
            try:
                num = int(last["candidate_uid"].split("-")[1])
                return f"CAND-{num + 1:06d}"
            except Exception:
                pass
        return f"CAND-{count + 1:06d}"

    @staticmethod
    def create(data, created_by_id=None, shared_by="System"):
        now = datetime.utcnow()
        uid = data.get("candidate_uid") or Candidate.generate_uid()
        
        # Parse entry date
        entry_date = data.get("entry_date")
        if isinstance(entry_date, str):
            try:
                entry_date = datetime.strptime(entry_date, "%Y-%m-%d")
            except ValueError:
                entry_date = now
        elif not isinstance(entry_date, (datetime, date)):
            entry_date = now

        doc = {
            "candidate_uid": uid,
            "entry_date": entry_date,
            "name": data.get("name"),
            "mobile_no": str(data.get("mobile_no")) if data.get("mobile_no") is not None else None,
            "email_id": data.get("email_id"),
            "gender": data.get("gender"),
            "qualification": data.get("qualification"),
            "year_of_passout": data.get("year_of_passout"),
            "department": data.get("department"),
            "industry": data.get("industry"),
            "function_unit": data.get("function_unit"),
            "dosage_form_area": data.get("dosage_form_area"),
            "experience": data.get("experience"),
            "present_company": data.get("present_company"),
            "designation": data.get("designation"),
            "regulatory_exposure": data.get("regulatory_exposure"),
            "audit_experience": data.get("audit_experience"),
            "current_ctc": data.get("current_ctc"),
            "expected_ctc": data.get("expected_ctc"),
            "notice_period": data.get("notice_period"),
            "current_location": data.get("current_location"),
            "preferred_location": data.get("preferred_location"),
            "shared_by": data.get("shared_by") or shared_by,
            "call_remarks": data.get("call_remarks"),
            # Document & Processing metadata
            "original_filename": data.get("original_filename"),
            "stored_filename": data.get("stored_filename"),
            "storage_folder": data.get("storage_folder"),
            "file_mime_type": data.get("file_mime_type"),
            "file_size_bytes": data.get("file_size_bytes"),
            "extraction_status": data.get("extraction_status", "Uploaded"),
            "extraction_error": data.get("extraction_error"),
            "extracted_text": data.get("extracted_text"),
            "ai_raw_response": data.get("ai_raw_response"),
            "created_by_id": str(created_by_id) if created_by_id else None,
            "created_at": now,
            "updated_at": now
        }
        res = mongo.candidates.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    @staticmethod
    def get_by_id(candidate_id):
        oid = to_object_id(candidate_id)
        doc = mongo.candidates.find_one({"_id": oid})
        if not doc and isinstance(candidate_id, str):
            doc = mongo.candidates.find_one({"candidate_uid": candidate_id})
        return doc

    @staticmethod
    def update(candidate_id, update_data):
        oid = to_object_id(candidate_id)
        update_data["updated_at"] = datetime.utcnow()
        mongo.candidates.update_one({"_id": oid}, {"$set": update_data})
        return mongo.candidates.find_one({"_id": oid})

    @staticmethod
    def delete(candidate_id):
        oid = to_object_id(candidate_id)
        return mongo.candidates.delete_one({"_id": oid})

    @staticmethod
    def to_dict(doc, s_no=None):
        if not doc:
            return None
        
        entry_date = doc.get("entry_date")
        date_str = ""
        if isinstance(entry_date, (datetime, date)):
            date_str = entry_date.strftime("%d-%m-%Y")
        elif isinstance(entry_date, str):
            date_str = entry_date

        created = doc.get("created_at")
        updated = doc.get("updated_at")

        return {
            "id": str(doc["_id"]),
            "candidate_uid": doc.get("candidate_uid"),
            "s_no": s_no,
            "date": date_str,
            "name": doc.get("name") or "",
            "mobile_no": str(doc.get("mobile_no")) if doc.get("mobile_no") is not None else "",
            "email_id": doc.get("email_id") or "",
            "gender": doc.get("gender") or "",
            "qualification": doc.get("qualification") or "",
            "year_of_passout": doc.get("year_of_passout") or "",
            "department": doc.get("department") or "",
            "industry": doc.get("industry") or "",
            "function_unit": doc.get("function_unit") or "",
            "dosage_form_area": doc.get("dosage_form_area") or "",
            "experience": doc.get("experience") or "",
            "present_company": doc.get("present_company") or "",
            "designation": doc.get("designation") or "",
            "regulatory_exposure": doc.get("regulatory_exposure") or "",
            "audit_experience": doc.get("audit_experience") or "",
            "current_ctc": doc.get("current_ctc") or "",
            "expected_ctc": doc.get("expected_ctc") or "",
            "notice_period": doc.get("notice_period") or "",
            "current_location": doc.get("current_location") or "",
            "preferred_location": doc.get("preferred_location") or "",
            "shared_by": doc.get("shared_by") or "",
            "call_remarks": doc.get("call_remarks") or "",
            # Metadata
            "original_filename": doc.get("original_filename"),
            "stored_filename": doc.get("stored_filename"),
            "storage_folder": doc.get("storage_folder"),
            "file_mime_type": doc.get("file_mime_type"),
            "file_size_bytes": doc.get("file_size_bytes"),
            "extraction_status": doc.get("extraction_status", "Uploaded"),
            "extraction_error": doc.get("extraction_error"),
            "created_by_id": doc.get("created_by_id"),
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created) if created else None,
            "updated_at": updated.isoformat() if isinstance(updated, datetime) else str(updated) if updated else None,
        }
