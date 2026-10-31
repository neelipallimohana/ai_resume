import io
import re
from datetime import datetime, date
from flask import Blueprint, request, jsonify, send_file
from app.models.visitor import Visitor
from app.db import mongo
from app.utils.auth_helpers import get_current_user, login_required, permission_required, log_activity
from app.services.excel_service import ExcelService

visitor_bp = Blueprint("visitors", __name__, url_prefix="/api/visitors")

@visitor_bp.route("", methods=["GET"])
@login_required
@permission_required("can_visitors")
def list_visitors():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    date_filter = request.args.get("date", "").strip()

    query = {}

    if search:
        search_rgx = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [
            {"name": search_rgx},
            {"organization": search_rgx},
            {"mobile_no": search_rgx},
            {"person_to_meet": search_rgx},
            {"purpose_of_visit": search_rgx}
        ]

    if status:
        query["status"] = status

    if date_filter:
        query["visit_date"] = date_filter

    cursor = mongo.visitors.find(query).sort([("visit_date", -1), ("entry_time", -1)])
    visitors_list = list(cursor)

    total = len(visitors_list)
    present_count = sum(1 for v in visitors_list if v.get("status") == "Present")

    return jsonify({
        "visitors": [Visitor.to_dict(v) for v in visitors_list],
        "total": total,
        "present_count": present_count
    })

@visitor_bp.route("", methods=["POST"])
@login_required
@permission_required("can_visitors")
def register_visitor():
    user = get_current_user()
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    purpose = data.get("purpose_of_visit", "").strip()
    person = data.get("person_to_meet", "").strip()

    if not name or not purpose or not person:
        return jsonify({"error": "Visitor name, purpose of visit, and person to meet are required."}), 400

    visitor_doc = Visitor.create(
        name=name,
        purpose_of_visit=purpose,
        person_to_meet=person,
        mobile_no=data.get("mobile_no"),
        organization=data.get("organization"),
        visit_date=data.get("visit_date"),
        entry_time=data.get("entry_time"),
        notes=data.get("notes"),
        created_by_id=user["_id"]
    )

    log_activity("REGISTER_VISITOR", f"Registered visitor {visitor_doc['visitor_uid']} ({name}).", user=user)
    return jsonify({"message": "Visitor registered successfully.", "visitor": Visitor.to_dict(visitor_doc)}), 201

@visitor_bp.route("/<id>/mark-exit", methods=["POST"])
@login_required
@permission_required("can_visitors")
def mark_visitor_exit(id):
    user = get_current_user()
    data = request.get_json() or {}
    exit_time = data.get("exit_time") or datetime.now().strftime("%H:%M")

    visitor = Visitor.mark_exit(id, exit_time)
    if not visitor:
        return jsonify({"error": "Visitor not found."}), 404

    log_activity("VISITOR_EXIT", f"Marked exit for visitor {visitor['visitor_uid']} at {exit_time}.", user=user)
    return jsonify({"message": "Visitor exit recorded.", "visitor": Visitor.to_dict(visitor)})

@visitor_bp.route("/<id>", methods=["PUT"])
@login_required
@permission_required("can_visitors")
def update_visitor(id):
    user = get_current_user()
    data = request.get_json() or {}

    update_payload = {}
    for key in ["name", "mobile_no", "organization", "purpose_of_visit", "person_to_meet", "entry_time", "exit_time", "status", "notes"]:
        if key in data:
            update_payload[key] = data[key]

    visitor = Visitor.update(id, update_payload)
    if not visitor:
        return jsonify({"error": "Visitor not found."}), 404

    log_activity("UPDATE_VISITOR", f"Updated visitor {visitor['visitor_uid']}.", user=user)
    return jsonify({"message": "Visitor updated successfully.", "visitor": Visitor.to_dict(visitor)})

@visitor_bp.route("/export-excel", methods=["GET"])
@login_required
@permission_required("can_visitors")
def export_visitors_excel():
    user = get_current_user()
    status = request.args.get("status")
    date_filter = request.args.get("date")

    query = {}
    if status:
        query["status"] = status
    if date_filter:
        query["visit_date"] = date_filter

    visitors = list(mongo.visitors.find(query).sort([("visit_date", -1), ("entry_time", -1)]))
    visitors_data = [Visitor.to_dict(v) for v in visitors]
    wb = ExcelService.generate_visitor_workbook(visitors_data)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"ofc_visitors_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    log_activity("EXPORT_VISITORS", f"Exported {len(visitors)} OFC visitor records to Excel.", user=user)

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
