from datetime import datetime, date
from flask import Blueprint, jsonify
from app.db import mongo
from app.models.candidate import Candidate
from app.utils.auth_helpers import login_required, permission_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
@login_required
@permission_required("can_view")
def get_dashboard_stats():
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_month = datetime(now.year, now.month, 1)
    today_str = date.today().isoformat()

    # 1. Candidate Counts
    total_candidates = mongo.candidates.count_documents({})
    added_today = mongo.candidates.count_documents({"entry_date": {"$gte": start_of_today}})
    added_this_month = mongo.candidates.count_documents({"entry_date": {"$gte": start_of_month}})
    total_resumes_uploaded = mongo.candidates.count_documents({"original_filename": {"$ne": None}})

    # 2. AI Extraction Metrics
    ai_success = mongo.candidates.count_documents({"extraction_status": {"$in": ["Needs Review", "Completed"]}})
    ai_failed = mongo.candidates.count_documents({"extraction_status": "Failed"})
    pending_reviews = mongo.candidates.count_documents({"extraction_status": "Needs Review"})

    # 3. Follow-up Metrics
    followups_today = mongo.follow_ups.count_documents({
        "follow_up_date": today_str,
        "status": {"$ne": "Completed"}
    })
    followups_overdue = mongo.follow_ups.count_documents({
        "follow_up_date": {"$lt": today_str},
        "status": {"$ne": "Completed"}
    })

    # 4. Visitors Present
    visitors_present = mongo.visitors.count_documents({"status": "Present"})

    # 5. Recent candidates
    recent_added_cur = mongo.candidates.find({}).sort("created_at", -1).limit(5)
    recent_candidates = [Candidate.to_dict(c) for c in recent_added_cur]

    recent_updated_cur = mongo.candidates.find({}).sort("updated_at", -1).limit(5)
    recent_updated = [Candidate.to_dict(c) for c in recent_updated_cur]

    # 6. Aggregations for charts
    def aggregate_field(field_name):
        pipeline = [
            {"$match": {field_name: {"$nin": [None, ""]}}},
            {"$group": {"_id": f"${field_name}", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6}
        ]
        results = list(mongo.candidates.aggregate(pipeline))
        return [{"name": r["_id"], "value": r["count"]} for r in results]

    department_chart = aggregate_field("department")
    qualification_chart = aggregate_field("qualification")
    location_chart = aggregate_field("current_location")
    experience_chart = aggregate_field("experience")

    return jsonify({
        "metrics": {
            "total_candidates": total_candidates,
            "added_today": added_today,
            "added_this_month": added_this_month,
            "total_resumes_uploaded": total_resumes_uploaded,
            "ai_success": ai_success,
            "ai_failed": ai_failed,
            "pending_reviews": pending_reviews,
            "followups_today": followups_today,
            "followups_overdue": followups_overdue,
            "visitors_present": visitors_present
        },
        "recent_candidates": recent_candidates,
        "recent_updated": recent_updated,
        "charts": {
            "department": department_chart,
            "qualification": qualification_chart,
            "location": location_chart,
            "experience": experience_chart
        }
    })
