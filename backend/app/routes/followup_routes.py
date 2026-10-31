from datetime import datetime, date
from flask import Blueprint, request, jsonify
from app.models.follow_up import FollowUp
from app.models.candidate import Candidate
from app.db import mongo, to_object_id
from app.utils.auth_helpers import get_current_user, login_required, permission_required, log_activity

followup_bp = Blueprint("followups", __name__, url_prefix="/api/followups")

@followup_bp.route("", methods=["GET"])
@login_required
@permission_required("can_followup")
def list_followups():
    status = request.args.get("status")
    filter_type = request.args.get("filter")
    candidate_id = request.args.get("candidate_id")

    today_str = date.today().isoformat()
    query = {}

    if candidate_id:
        query["candidate_id"] = str(candidate_id)

    if filter_type == "today":
        query["follow_up_date"] = today_str
        query["status"] = {"$ne": "Completed"}
    elif filter_type == "upcoming":
        query["follow_up_date"] = {"$gt": today_str}
        query["status"] = {"$ne": "Completed"}
    elif filter_type == "overdue":
        query["follow_up_date"] = {"$lt": today_str}
        query["status"] = {"$ne": "Completed"}
    elif filter_type == "completed":
        query["status"] = "Completed"
    elif status:
        query["status"] = status

    cursor = mongo.follow_ups.find(query).sort("follow_up_date", 1)
    followups_data = [FollowUp.to_dict(f) for f in cursor]
    return jsonify({"followups": followups_data})

@followup_bp.route("", methods=["POST"])
@login_required
@permission_required("can_followup")
def create_followup():
    user = get_current_user()
    data = request.get_json() or {}

    cand_id = data.get("candidate_id")
    f_date_str = data.get("follow_up_date")
    if not cand_id or not f_date_str:
        return jsonify({"error": "Candidate ID and Follow-up date are required."}), 400

    cand = Candidate.get_by_id(cand_id)
    if not cand:
        return jsonify({"error": "Candidate not found."}), 404

    assigned_to = data.get("assigned_to_id") or user["_id"]

    followup = FollowUp.create(
        candidate_id=cand["_id"],
        follow_up_date=f_date_str,
        follow_up_time=data.get("follow_up_time"),
        follow_up_type=data.get("follow_up_type", "Call"),
        notes=data.get("notes"),
        assigned_to_id=assigned_to,
        created_by_id=user["_id"]
    )

    log_activity("CREATE_FOLLOWUP", f"Created follow-up for candidate {cand['candidate_uid']}.", user=user)
    return jsonify({"message": "Follow-up scheduled successfully.", "followup": FollowUp.to_dict(followup)}), 201

@followup_bp.route("/<id>", methods=["PUT"])
@login_required
@permission_required("can_followup")
def update_followup(id):
    user = get_current_user()
    followup = FollowUp.get_by_id(id)
    if not followup:
        return jsonify({"error": "Follow-up not found."}), 404

    data = request.get_json() or {}
    update_data = {}

    for key in ["follow_up_date", "follow_up_time", "follow_up_type", "notes", "status", "assigned_to_id"]:
        if key in data:
            update_data[key] = data[key]

    updated = FollowUp.update(followup["_id"], update_data)
    log_activity("UPDATE_FOLLOWUP", f"Updated follow-up #{id}.", user=user)
    return jsonify({"message": "Follow-up updated successfully.", "followup": FollowUp.to_dict(updated)})

@followup_bp.route("/<id>", methods=["DELETE"])
@login_required
@permission_required("can_followup")
def delete_followup(id):
    user = get_current_user()
    res = FollowUp.delete(id)
    if res.deleted_count == 0:
        return jsonify({"error": "Follow-up not found."}), 404
    log_activity("DELETE_FOLLOWUP", f"Deleted follow-up #{id}.", user=user)
    return jsonify({"message": "Follow-up deleted successfully."})
