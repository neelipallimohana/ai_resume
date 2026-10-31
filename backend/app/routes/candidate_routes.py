import os
import io
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from bson import ObjectId
from app.db import mongo, to_object_id
from app.models.candidate import Candidate
from app.models.user import User
from app.utils.auth_helpers import (
    get_current_user, login_required, permission_required, admin_required, log_activity
)
from app.utils.validators import (
    clean_email, clean_phone, generate_candidate_uid, 
    allowed_file, check_duplicate_candidate
)
from app.services.file_storage import FileStorageService
from app.services.document_extraction import DocumentExtractionService
from app.services.ai_extraction import AIExtractionService
from app.services.excel_service import ExcelService
from app.utils.date_helpers import get_period_dates

candidate_bp = Blueprint("candidates", __name__, url_prefix="/api/candidates")

def build_candidates_filter(params):
    """
    Builds a MongoDB filter query and period label based on parameters or JSON body.
    Supports: candidate_ids, period ('today', 'this_week', 'this_month', 'all'),
    date (YYYY-MM-DD), start_date, end_date, search, department, qualification, etc.
    """
    ids = params.get("candidate_ids") or []
    if ids:
        oids = [to_object_id(i) for i in ids]
        return {"_id": {"$in": oids}}, f"selected_{len(ids)}"

    query = {}
    search = params.get("search", "").strip() if isinstance(params.get("search"), str) else ""
    department = params.get("department", "").strip() if isinstance(params.get("department"), str) else ""
    qualification = params.get("qualification", "").strip() if isinstance(params.get("qualification"), str) else ""
    industry = params.get("industry", "").strip() if isinstance(params.get("industry"), str) else ""
    function_unit = params.get("function_unit", "").strip() if isinstance(params.get("function_unit"), str) else ""
    dosage_form = params.get("dosage_form_area", "").strip() if isinstance(params.get("dosage_form_area"), str) else ""
    location = params.get("location", "").strip() if isinstance(params.get("location"), str) else ""
    status = params.get("status", "").strip() if isinstance(params.get("status"), str) else ""
    shared_by = params.get("shared_by", "").strip() if isinstance(params.get("shared_by"), str) else ""

    period = params.get("period", "").strip() if isinstance(params.get("period"), str) else ""
    date_val = params.get("date", "").strip() if isinstance(params.get("date"), str) else ""
    start_date = params.get("start_date", "").strip() if isinstance(params.get("start_date"), str) else ""
    end_date = params.get("end_date", "").strip() if isinstance(params.get("end_date"), str) else ""

    if search:
        search_rgx = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [
            {"name": search_rgx},
            {"mobile_no": search_rgx},
            {"email_id": search_rgx},
            {"present_company": search_rgx},
            {"designation": search_rgx},
            {"qualification": search_rgx},
            {"department": search_rgx},
            {"current_location": search_rgx}
        ]

    if department:
        query["department"] = department
    if qualification:
        query["qualification"] = {"$regex": re.escape(qualification), "$options": "i"}
    if industry:
        query["industry"] = industry
    if function_unit:
        query["function_unit"] = function_unit
    if dosage_form:
        query["dosage_form_area"] = dosage_form
    if location:
        loc_rgx = {"$regex": re.escape(location), "$options": "i"}
        query["$or"] = query.get("$or", []) + [{"current_location": loc_rgx}, {"preferred_location": loc_rgx}]
    if status:
        query["extraction_status"] = status
    if shared_by:
        query["shared_by"] = shared_by

    s_dt, e_dt, period_label = get_period_dates(
        period=period, date_str=date_val, start_date=start_date, end_date=end_date
    )
    if s_dt and e_dt:
        date_q = {"$gte": s_dt, "$lte": e_dt}
        date_conditions = [{"created_at": date_q}, {"entry_date": date_q}]
        if "$or" in query:
            query["$and"] = query.get("$and", []) + [{"$or": date_conditions}]
        else:
            query["$or"] = date_conditions

    return query, period_label

@candidate_bp.route("/period-summary", methods=["GET"])
@login_required
def get_period_summary():
    """
    Returns candidate counts for: today, this week, this month, and total.
    """
    now = datetime.utcnow()
    # Today
    s_today, e_today, _ = get_period_dates("today")
    today_q = {"$or": [{"created_at": {"$gte": s_today, "$lte": e_today}}, {"entry_date": {"$gte": s_today, "$lte": e_today}}]}
    today_count = mongo.candidates.count_documents(today_q)

    # Week
    s_week, e_week, _ = get_period_dates("this_week")
    week_q = {"$or": [{"created_at": {"$gte": s_week, "$lte": e_week}}, {"entry_date": {"$gte": s_week, "$lte": e_week}}]}
    week_count = mongo.candidates.count_documents(week_q)

    # Month
    s_month, e_month, _ = get_period_dates("this_month")
    month_q = {"$or": [{"created_at": {"$gte": s_month, "$lte": e_month}}, {"entry_date": {"$gte": s_month, "$lte": e_month}}]}
    month_count = mongo.candidates.count_documents(month_q)

    total_count = mongo.candidates.count_documents({})

    return jsonify({
        "today_count": today_count,
        "week_count": week_count,
        "month_count": month_count,
        "total_count": total_count,
        "today_date": now.strftime("%Y-%m-%d")
    })

@candidate_bp.route("", methods=["GET"])
@login_required
@permission_required("can_view")
def list_candidates():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 15, type=int)
    
    query, period_label = build_candidates_filter(request.args.to_dict())

    total = mongo.candidates.count_documents(query)
    pages = max(1, (total + per_page - 1) // per_page)
    skip = (page - 1) * per_page

    cursor = mongo.candidates.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    candidates_list = list(cursor)

    candidates_data = [
        Candidate.to_dict(cand, s_no=skip + idx + 1)
        for idx, cand in enumerate(candidates_list)
    ]

    return jsonify({
        "candidates": candidates_data,
        "total": total,
        "pages": pages,
        "current_page": page,
        "per_page": per_page,
        "period_label": period_label
    })

@candidate_bp.route("/<id>", methods=["GET"])
@login_required
@permission_required("can_view")
def get_candidate(id):
    candidate = Candidate.get_by_id(id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify({"candidate": Candidate.to_dict(candidate)})

@candidate_bp.route("/check-duplicate", methods=["POST"])
@login_required
def check_duplicate():
    data = request.get_json() or {}
    email = data.get("email_id")
    mobile = data.get("mobile_no")
    name = data.get("name")
    company = data.get("present_company")
    exclude_id = data.get("exclude_id")

    is_dup, warning_msg, existing = check_duplicate_candidate(
        email=email, mobile=mobile, name=name, present_company=company, exclude_id=exclude_id
    )

    return jsonify({
        "is_duplicate": is_dup,
        "warning": warning_msg,
        "existing_candidate": existing
    })

@candidate_bp.route("", methods=["POST"])
@login_required
@permission_required("can_edit")
def create_candidate_manual():
    user = get_current_user()
    data = request.get_json() or {}

    is_dup, warning, existing = check_duplicate_candidate(
        email=data.get("email_id"),
        mobile=data.get("mobile_no"),
        name=data.get("name"),
        present_company=data.get("present_company")
    )
    if is_dup and not data.get("force_save"):
        return jsonify({
            "is_duplicate": True,
            "warning": warning,
            "existing_candidate": existing
        }), 409

    data["extraction_status"] = "Manual"
    cand_doc = Candidate.create(
        data=data,
        created_by_id=user["_id"],
        shared_by=data.get("shared_by") or user.get("full_name") or user.get("username")
    )

    # Initialize candidate directory
    FileStorageService.get_candidate_dir(cand_doc["candidate_uid"])

    log_activity("CREATE_CANDIDATE", f"Created candidate '{cand_doc.get('name') or cand_doc['candidate_uid']}'.", user=user)
    return jsonify({"message": "Candidate created successfully.", "candidate": Candidate.to_dict(cand_doc)}), 201

@candidate_bp.route("/<id>", methods=["PUT"])
@login_required
@permission_required("can_edit")
def update_candidate(id):
    user = get_current_user()
    cand = Candidate.get_by_id(id)
    if not cand:
        return jsonify({"error": "Candidate not found"}), 404

    data = request.get_json() or {}

    is_dup, warning, existing = check_duplicate_candidate(
        email=data.get("email_id"),
        mobile=data.get("mobile_no"),
        name=data.get("name"),
        present_company=data.get("present_company"),
        exclude_id=cand["_id"]
    )
    if is_dup and not data.get("force_save"):
        return jsonify({
            "is_duplicate": True,
            "warning": warning,
            "existing_candidate": existing
        }), 409

    fields = [
        "name", "mobile_no", "email_id", "gender", "qualification", "year_of_passout",
        "department", "industry", "function_unit", "dosage_form_area", "experience",
        "present_company", "designation", "regulatory_exposure", "audit_experience",
        "current_ctc", "expected_ctc", "notice_period", "current_location", "preferred_location",
        "call_remarks", "extraction_status"
    ]
    if user.get("role") == "admin":
        fields.append("shared_by")

    update_payload = {}
    for f in fields:
        if f in data:
            if f == "mobile_no":
                update_payload[f] = clean_phone(data[f])
            elif f == "email_id":
                update_payload[f] = clean_email(data[f])
            else:
                update_payload[f] = data[f]

    updated = Candidate.update(cand["_id"], update_payload)
    log_activity("UPDATE_CANDIDATE", f"Updated candidate {cand['candidate_uid']}.", user=user)
    return jsonify({"message": "Candidate updated successfully.", "candidate": Candidate.to_dict(updated)})

@candidate_bp.route("/<id>", methods=["DELETE"])
@login_required
def delete_candidate(id):
    user = get_current_user()
    if user.get("role") != "admin" and not User.has_permission(user, "can_delete"):
        return jsonify({"error": "Admin privilege required to delete candidate records."}), 403

    cand = Candidate.get_by_id(id)
    if not cand:
        return jsonify({"error": "Candidate not found"}), 404

    cand_uid = cand["candidate_uid"]
    cand_name = cand.get("name")

    Candidate.delete(cand["_id"])

    # Safely remove candidate folder
    try:
        cand_dir = FileStorageService.get_candidate_dir(cand_uid)
        if os.path.exists(cand_dir):
            import shutil
            shutil.rmtree(cand_dir, ignore_errors=True)
    except Exception:
        pass

    log_activity("DELETE_CANDIDATE", f"Deleted candidate {cand_uid} ({cand_name}).", user=user)
    return jsonify({"message": f"Candidate {cand_uid} deleted successfully."})

@candidate_bp.route("/upload", methods=["POST"])
@login_required
@permission_required("can_upload")
def upload_resumes():
    user = get_current_user()
    if "files" not in request.files:
        return jsonify({"error": "No files provided in upload request."}), 400

    uploaded_files = request.files.getlist("files")
    if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ""):
        return jsonify({"error": "No file selected."}), 400

    results = []
    
    for file in uploaded_files:
        if not file or not file.filename:
            continue
        
        orig_name = file.filename
        if not allowed_file(orig_name, current_app.config["ALLOWED_EXTENSIONS"]):
            results.append({
                "filename": orig_name,
                "status": "Failed",
                "error": "Unsupported file format. Please upload PDF or DOCX files only."
            })
            continue

        try:
            now = datetime.utcnow()
            cand_uid = generate_candidate_uid()
            stored_name, rel_folder, fsize, abs_path = FileStorageService.save_candidate_file(
                cand_uid, file, orig_name, entry_date=now
            )

            # Extract readable text
            extracted_text, is_scanned = DocumentExtractionService.extract_text(abs_path)

            # Extract via OpenRouter AI
            ai_result = AIExtractionService.extract_candidate_data(extracted_text)
            extracted_data = ai_result.get("data", {})
            extraction_err = ai_result.get("error")

            extraction_status = "Needs Review"
            if not extracted_text or (len(extracted_text.strip()) < 10 and is_scanned):
                extraction_status = "Failed"
                extraction_err = "Scanned document text could not be extracted via OCR. Please enter details manually."

            # Check potential duplicate
            is_dup, dup_warning, existing = check_duplicate_candidate(
                email=extracted_data.get("email_id"),
                mobile=extracted_data.get("mobile_no"),
                name=extracted_data.get("name")
            )

            cand_payload = {
                "candidate_uid": cand_uid,
                "entry_date": now,
                "name": extracted_data.get("name"),
                "mobile_no": extracted_data.get("mobile_no"),
                "email_id": extracted_data.get("email_id"),
                "gender": extracted_data.get("gender"),
                "qualification": extracted_data.get("qualification"),
                "year_of_passout": extracted_data.get("year_of_passout"),
                "department": extracted_data.get("department"),
                "industry": extracted_data.get("industry"),
                "function_unit": extracted_data.get("function_unit"),
                "dosage_form_area": extracted_data.get("dosage_form_area"),
                "experience": extracted_data.get("experience"),
                "present_company": extracted_data.get("present_company"),
                "designation": extracted_data.get("designation"),
                "regulatory_exposure": extracted_data.get("regulatory_exposure"),
                "audit_experience": extracted_data.get("audit_experience"),
                "current_ctc": extracted_data.get("current_ctc"),
                "expected_ctc": extracted_data.get("expected_ctc"),
                "notice_period": extracted_data.get("notice_period"),
                "current_location": extracted_data.get("current_location"),
                "preferred_location": extracted_data.get("preferred_location"),
                "shared_by": user.get("full_name") or user.get("username"),
                "original_filename": orig_name,
                "stored_filename": stored_name,
                "storage_folder": rel_folder,
                "file_mime_type": file.mimetype,
                "file_size_bytes": fsize,
                "extraction_status": extraction_status,
                "extraction_error": extraction_err,
                "extracted_text": extracted_text,
                "ai_raw_response": ai_result.get("raw_response"),
            }

            candidate_doc = Candidate.create(cand_payload, created_by_id=user["_id"])

            results.append({
                "candidate_id": str(candidate_doc["_id"]),
                "candidate_uid": cand_uid,
                "filename": orig_name,
                "status": extraction_status,
                "error": extraction_err,
                "is_duplicate": is_dup,
                "duplicate_warning": dup_warning,
                "candidate": Candidate.to_dict(candidate_doc)
            })

            log_activity("UPLOAD_RESUME", f"Uploaded resume '{orig_name}' as {cand_uid}.", user=user)

        except Exception as e:
            results.append({
                "filename": orig_name,
                "status": "Failed",
                "error": f"Processing error: {str(e)}"
            })

    return jsonify({"results": results}), 200

@candidate_bp.route("/<id>/retry-extraction", methods=["POST"])
@login_required
@permission_required("can_edit")
def retry_extraction(id):
    user = get_current_user()
    cand = Candidate.get_by_id(id)
    if not cand:
        return jsonify({"error": "Candidate not found"}), 404

    if not cand.get("stored_filename"):
        return jsonify({"error": "No resume file attached to this candidate."}), 400

    try:
        abs_path = FileStorageService.get_candidate_file_path(cand["candidate_uid"], cand["stored_filename"])
        extracted_text = cand.get("extracted_text")
        if not extracted_text or len(extracted_text.strip()) < 50:
            extracted_text, is_scanned = DocumentExtractionService.extract_text(abs_path)

        ai_result = AIExtractionService.extract_candidate_data(extracted_text)
        
        update_dict = {
            "ai_raw_response": ai_result.get("raw_response"),
            "extraction_error": ai_result.get("error"),
            "extracted_text": extracted_text
        }

        if ai_result.get("success"):
            data = ai_result.get("data", {})
            for field in [
                "name", "mobile_no", "email_id", "gender", "qualification", "year_of_passout",
                "department", "industry", "function_unit", "dosage_form_area", "experience",
                "present_company", "designation", "regulatory_exposure", "audit_experience",
                "current_ctc", "expected_ctc", "notice_period", "current_location", "preferred_location"
            ]:
                curr_val = cand.get(field)
                if (not curr_val or curr_val in ("Unnamed", "None", "null", "-")) and data.get(field):
                    update_dict[field] = data.get(field)

            update_dict["extraction_status"] = "Needs Review"
        else:
            update_dict["extraction_status"] = "Failed"

        updated = Candidate.update(cand["_id"], update_dict)
        log_activity("RETRY_EXTRACTION", f"Retried OpenRouter AI extraction for {cand['candidate_uid']}.", user=user)
        return jsonify({
            "message": "Extraction process completed.",
            "candidate": Candidate.to_dict(updated),
            "ai_result": ai_result
        })
    except Exception as e:
        return jsonify({"error": f"Failed to reprocess resume: {str(e)}"}), 500

@candidate_bp.route("/<id>/download-resume", methods=["GET"])
@login_required
@permission_required("can_download")
def download_resume(id):
    cand = Candidate.get_by_id(id)
    if not cand or not cand.get("stored_filename"):
        return jsonify({"error": "No resume file available for this candidate."}), 404

    try:
        file_path = FileStorageService.get_candidate_file_path(cand["candidate_uid"], cand["stored_filename"])
        download_name = cand.get("original_filename") or f"{cand['candidate_uid']}_resume.pdf"
        return send_file(
            file_path,
            as_attachment=True,
            download_name=download_name,
            mimetype=cand.get("file_mime_type") or "application/octet-stream"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@candidate_bp.route("/<id>/download-zip", methods=["GET"])
@login_required
@permission_required("can_download")
def download_candidate_zip(id):
    cand = Candidate.get_by_id(id)
    if not cand:
        return jsonify({"error": "Candidate not found"}), 404
    try:
        zip_path = FileStorageService.create_candidate_zip(cand["candidate_uid"])
        return send_file(
            zip_path,
            as_attachment=True,
            download_name=f"{cand['candidate_uid']}_files.zip",
            mimetype="application/zip"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@candidate_bp.route("/bulk-download-zip", methods=["GET", "POST"])
@login_required
@permission_required("can_download")
def bulk_download_zip():
    user = get_current_user()
    data = {}
    if request.method == "POST":
        data = request.get_json() or {}
    else:
        data = request.args.to_dict()

    query, period_label = build_candidates_filter(data)
    candidates = list(mongo.candidates.find(query).sort("created_at", 1))
    if not candidates:
        return jsonify({"error": f"No candidates found for period/selection: {period_label}"}), 404

    try:
        # Create ZIP with candidate folders named after each candidate and 24-col Excel summary
        zip_path = FileStorageService.create_bulk_candidates_zip_by_name(
            candidates, period_label=period_label, include_excel=True
        )
        download_name = f"resumes_{period_label}.zip"
        log_activity("BULK_DOWNLOAD_ZIP", f"Downloaded {len(candidates)} resumes ZIP ({period_label}).", user=user)
        return send_file(
            zip_path,
            as_attachment=True,
            download_name=download_name,
            mimetype="application/zip"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@candidate_bp.route("/export-excel", methods=["GET", "POST"])
@login_required
@permission_required("can_export")
def export_excel():
    user = get_current_user()
    data = {}
    if request.method == "POST":
        data = request.get_json() or {}
    else:
        data = request.args.to_dict()

    query, period_label = build_candidates_filter(data)
    candidates = list(mongo.candidates.find(query).sort("created_at", 1))

    wb = ExcelService.generate_candidate_workbook(candidates)
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"candidates_{period_label}.xlsx"
    log_activity("EXPORT_EXCEL", f"Exported {len(candidates)} candidates ({period_label}) to 24-column Excel.", user=user)

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@candidate_bp.route("/import-excel/preview", methods=["POST"])
@login_required
@permission_required("can_upload")
def preview_excel_import():
    if "file" not in request.files:
        return jsonify({"error": "No Excel file uploaded."}), 400
    
    file = request.files["file"]
    if not file.filename.endswith((".xlsx", ".xlsm")):
        return jsonify({"error": "Please upload a valid .xlsx Excel workbook."}), 400

    try:
        is_valid, msg = ExcelService.validate_candidate_excel_headers(file)
        if not is_valid:
            return jsonify({"error": f"Header validation failed: {msg}"}), 400

        file.seek(0)
        import openpyxl
        wb = openpyxl.load_workbook(file, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))

        preview_rows = []
        for r_idx, row in enumerate(rows[1:], 2):
            if not any(row):
                continue
            preview_rows.append({
                "row_number": r_idx,
                "name": row[2] or "",
                "mobile_no": str(row[3]) if row[3] is not None else "",
                "email_id": row[4] or "",
                "qualification": row[6] or "",
                "experience": row[12] or "",
                "present_company": row[13] or "",
                "designation": row[14] or ""
            })

        return jsonify({
            "message": "Workbook schema verified successfully.",
            "total_rows": len(preview_rows),
            "preview": preview_rows[:10]
        })
    except Exception as e:
        return jsonify({"error": f"Failed to parse Excel file: {str(e)}"}), 400
