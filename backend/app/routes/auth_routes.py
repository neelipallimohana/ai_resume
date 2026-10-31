from flask import Blueprint, request, jsonify, session
from app.models.user import User
from app.db import mongo
from app.utils.auth_helpers import get_current_user, login_required, log_activity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/status", methods=["GET"])
def check_status():
    admin_exists = mongo.users.find_one({"role": "admin"}) is not None
    current_user = get_current_user()
    return jsonify({
        "system_initialized": admin_exists,
        "authenticated": current_user is not None,
        "user": User.to_dict(current_user) if current_user else None
    })

@auth_bp.route("/setup-admin", methods=["POST"])
def setup_first_admin():
    admin_exists = mongo.users.find_one({"role": "admin"}) is not None
    if admin_exists:
        return jsonify({"error": "System is already initialized with an administrator."}), 400

    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", "").strip()
    password = data.get("password", "")

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters."}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email address is required."}), 400
    if not full_name:
        return jsonify({"error": "Full name is required."}), 400
    if not password or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    admin = User.create(
        username=username,
        email=email,
        full_name=full_name,
        password=password,
        role="admin"
    )

    session["user_id"] = str(admin["_id"])
    session.permanent = True
    log_activity("SYSTEM_INITIALIZED", f"First admin '{username}' registered.", user=admin)

    return jsonify({
        "message": "First administrator successfully created in MongoDB.",
        "user": User.to_dict(admin)
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("username_or_email", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Please provide username/email and password."}), 400

    user = User.get_by_username_or_email(identifier)

    if not user or not User.check_password(user, password):
        log_activity("LOGIN_FAILED", f"Failed login attempt for '{identifier}'.")
        return jsonify({"error": "Invalid username or password."}), 401

    if not user.get("is_active", True):
        log_activity("LOGIN_BLOCKED", f"Inactive user '{user.get('username')}' attempted login.")
        return jsonify({"error": "Your account has been deactivated. Please contact an administrator."}), 403

    session["user_id"] = str(user["_id"])
    session.permanent = True
    log_activity("LOGIN", f"User '{user.get('username')}' logged in successfully.", user=user)

    return jsonify({
        "message": "Logged in successfully.",
        "user": User.to_dict(user)
    })

@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    user = get_current_user()
    if user:
        log_activity("LOGOUT", f"User '{user.get('username')}' logged out.", user=user)
    session.clear()
    return jsonify({"message": "Logged out successfully."})

@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    user = get_current_user()
    return jsonify({"user": User.to_dict(user)})
