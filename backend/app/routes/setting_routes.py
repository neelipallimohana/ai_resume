import os
from flask import Blueprint, request, jsonify, send_file, current_app
from app.models.setting import ApplicationSetting
from app.models.activity_log import ActivityLog
from app.db import mongo
from app.utils.auth_helpers import admin_required, login_required, get_current_user, log_activity
from app.services.ai_extraction import AIExtractionService
from app.services.backup_service import BackupService

setting_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@setting_bp.route("", methods=["GET"])
@login_required
def get_settings():
    settings = ApplicationSetting.get_all()
    # Mask API key if returned to non-admin or for safety
    masked_settings = settings.copy()
    if masked_settings.get("openrouter_api_key"):
        raw_key = masked_settings["openrouter_api_key"]
        if len(raw_key) > 8:
            masked_settings["openrouter_api_key_masked"] = raw_key[:4] + "••••••••" + raw_key[-4:]
        else:
            masked_settings["openrouter_api_key_masked"] = "••••••••"

    ai_info = AIExtractionService.check_openrouter_status()
    return jsonify({
        "settings": masked_settings,
        "ai": ai_info,
        "database": {
            "engine": "MongoDB",
            "connected": mongo.ping() is not None,
            "database_name": current_app.config.get("MONGO_DB_NAME", "resume_management")
        }
    })

@setting_bp.route("", methods=["PUT"])
@admin_required
def update_settings():
    user = get_current_user()
    data = request.get_json() or {}

    allowed_keys = [
        "organization_name", "app_title", "timezone", "date_format",
        "openrouter_model", "openrouter_api_key", "max_file_size_mb",
        "departments", "industries", "functions", "dosage_forms"
    ]

    for key, val in data.items():
        if key in allowed_keys:
            ApplicationSetting.set_value(key, val)

    log_activity("UPDATE_SETTINGS", "Admin updated application settings & AI model config.", user=user)
    return jsonify({
        "message": "Settings updated successfully.",
        "settings": ApplicationSetting.get_all()
    })

@setting_bp.route("/ai-status", methods=["GET"])
@login_required
def check_ai_status():
    status = AIExtractionService.check_openrouter_status()
    return jsonify(status)

# Keep /ollama-status alias for backward compatibility or routing consistency
@setting_bp.route("/ollama-status", methods=["GET"])
@login_required
def check_ai_status_alias():
    return jsonify(AIExtractionService.check_openrouter_status())

@setting_bp.route("/activity-logs", methods=["GET"])
@admin_required
def get_activity_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)

    total = mongo.activity_logs.count_documents({})
    pages = max(1, (total + per_page - 1) // per_page)
    skip = (page - 1) * per_page

    cursor = mongo.activity_logs.find({}).sort("created_at", -1).skip(skip).limit(per_page)
    logs_data = [ActivityLog.to_dict(l) for l in cursor]

    return jsonify({
        "logs": logs_data,
        "total": total,
        "pages": pages,
        "current_page": page
    })

@setting_bp.route("/backups", methods=["GET"])
@admin_required
def list_backups():
    backups = BackupService.list_backups()
    return jsonify({"backups": backups})

@setting_bp.route("/backups", methods=["POST"])
@admin_required
def create_backup():
    user = get_current_user()
    try:
        backup = BackupService.create_backup()
        log_activity("CREATE_BACKUP", f"Created MongoDB backup {backup['filename']}.", user=user)
        return jsonify({"message": "MongoDB & files backup created successfully.", "backup": backup})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@setting_bp.route("/backups/<filename>/download", methods=["GET"])
@admin_required
def download_backup(filename):
    backups_dir = current_app.config["BACKUPS_STORAGE"]
    safe_fn = os.path.basename(filename)
    fp = os.path.join(backups_dir, safe_fn)
    if not os.path.exists(fp):
        return jsonify({"error": "Backup file not found."}), 404
    return send_file(fp, as_attachment=True, download_name=safe_fn, mimetype="application/zip")

@setting_bp.route("/backups/<filename>/restore", methods=["POST"])
@admin_required
def restore_backup(filename):
    user = get_current_user()
    try:
        success, msg = BackupService.restore_backup(os.path.basename(filename))
        log_activity("RESTORE_BACKUP", f"Restored MongoDB backup {filename}.", user=user)
        return jsonify({"message": msg})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
