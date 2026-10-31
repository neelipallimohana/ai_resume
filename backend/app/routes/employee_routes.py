from flask import Blueprint, request, jsonify
from app.models.user import User, DEFAULT_PERMISSIONS
from app.db import mongo, to_object_id
from app.utils.auth_helpers import admin_required, get_current_user, log_activity

employee_bp = Blueprint("employees", __name__, url_prefix="/api/employees")

@employee_bp.route("", methods=["GET"])
@admin_required
def list_employees():
    cursor = mongo.users.find({}).sort("role", 1)
    employees = [User.to_dict(u) for u in cursor]
    return jsonify({"employees": employees})

@employee_bp.route("", methods=["POST"])
@admin_required
def create_employee():
    admin = get_current_user()
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", "").strip()
    password = data.get("password", "")
    role = data.get("role", "employee")
    permissions = data.get("permissions", DEFAULT_PERMISSIONS)

    if not username or not email or not password or not full_name:
        return jsonify({"error": "All fields (username, email, full name, password) are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if mongo.users.find_one({"$or": [{"username": username}, {"email": email}]}):
        return jsonify({"error": "Username or email already exists."}), 400

    new_user = User.create(
        username=username,
        email=email,
        full_name=full_name,
        password=password,
        role=role,
        permissions=permissions
    )

    log_activity("CREATE_EMPLOYEE", f"Admin created account for '{username}' ({role}).", user=admin)
    return jsonify({"message": "User account created successfully in MongoDB.", "user": User.to_dict(new_user)}), 201

@employee_bp.route("/<id>", methods=["PUT"])
@admin_required
def update_employee(id):
    admin = get_current_user()
    user = User.get_by_id(id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json() or {}
    update_data = {}

    if "full_name" in data:
        update_data["full_name"] = data["full_name"].strip()
    if "email" in data:
        update_data["email"] = data["email"].strip().lower()
    if "is_active" in data:
        if str(user["_id"]) == str(admin["_id"]) and not data["is_active"]:
            return jsonify({"error": "You cannot deactivate your own administrative account."}), 400
        update_data["is_active"] = bool(data["is_active"])
    if "permissions" in data:
        update_data["permissions"] = data["permissions"]
    if "role" in data:
        if str(user["_id"]) == str(admin["_id"]) and data["role"] != "admin":
            return jsonify({"error": "You cannot demote your own account."}), 400
        update_data["role"] = data["role"]

    mongo.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    updated = User.get_by_id(id)

    log_activity("UPDATE_EMPLOYEE", f"Admin updated account for '{user.get('username')}'.", user=admin)
    return jsonify({"message": "User updated successfully.", "user": User.to_dict(updated)})

@employee_bp.route("/<id>/reset-password", methods=["POST"])
@admin_required
def reset_employee_password(id):
    admin = get_current_user()
    user = User.get_by_id(id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json() or {}
    new_pass = data.get("password")

    if not new_pass or len(new_pass) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400

    User.set_password(user["_id"], new_pass)

    log_activity("RESET_PASSWORD", f"Admin reset password for '{user.get('username')}'.", user=admin)
    return jsonify({"message": f"Password for {user.get('username')} has been reset."})
