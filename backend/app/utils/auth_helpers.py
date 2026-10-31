from functools import wraps
from flask import session, jsonify, request
from app.models.user import User
from app.models.activity_log import ActivityLog

def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    user = User.get_by_id(user_id)
    if not user or not user.get("is_active", True):
        session.clear()
        return None
    return user

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required", "code": "UNAUTHORIZED"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required", "code": "UNAUTHORIZED"}), 401
        if user.get("role") != "admin":
            return jsonify({"error": "Administrator privilege required", "code": "FORBIDDEN"}), 403
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission_name):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required", "code": "UNAUTHORIZED"}), 401
            if not User.has_permission(user, permission_name):
                return jsonify({
                    "error": f"Permission denied for '{permission_name}'", 
                    "code": "FORBIDDEN"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_activity(action, details=None, user=None):
    try:
        current_u = user or get_current_user()
        ip = request.headers.get("X-Forwarded-For", request.remote_addr) if request else "127.0.0.1"
        ActivityLog.create(
            action=action,
            details=details,
            user_id=str(current_u["_id"]) if current_u else None,
            username=current_u.get("username", "System") if current_u else "System",
            ip_address=ip
        )
    except Exception as e:
        print(f"[ActivityLog Error] {e}")
