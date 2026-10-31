from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from app.db import mongo, to_object_id

DEFAULT_PERMISSIONS = {
    "can_upload": True,
    "can_view": True,
    "can_edit": True,
    "can_download": True,
    "can_export": True,
    "can_followup": True,
    "can_visitors": True,
}

class User:
    @staticmethod
    def create(username, email, full_name, password, role="employee", permissions=None, is_active=True):
        now = datetime.utcnow()
        doc = {
            "username": username.strip(),
            "email": email.strip().lower(),
            "full_name": full_name.strip(),
            "password_hash": generate_password_hash(password),
            "role": role,
            "is_active": is_active,
            "permissions": permissions or DEFAULT_PERMISSIONS.copy(),
            "created_at": now,
            "updated_at": now
        }
        res = mongo.users.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    @staticmethod
    def get_by_id(user_id):
        oid = to_object_id(user_id)
        return mongo.users.find_one({"_id": oid})

    @staticmethod
    def get_by_username_or_email(identifier):
        clean = identifier.strip()
        return mongo.users.find_one({
            "$or": [
                {"username": clean},
                {"email": clean.lower()}
            ]
        })

    @staticmethod
    def check_password(user_doc, password):
        return check_password_hash(user_doc.get("password_hash", ""), password)

    @staticmethod
    def set_password(user_id, new_password):
        oid = to_object_id(user_id)
        mongo.users.update_one(
            {"_id": oid},
            {"$set": {
                "password_hash": generate_password_hash(new_password),
                "updated_at": datetime.utcnow()
            }}
        )

    @staticmethod
    def has_permission(user_doc, permission_name):
        if not user_doc or not user_doc.get("is_active", True):
            return False
        if user_doc.get("role") == "admin":
            return True
        perms = user_doc.get("permissions") or DEFAULT_PERMISSIONS
        return bool(perms.get(permission_name, False))

    @staticmethod
    def to_dict(user_doc):
        if not user_doc:
            return None
        created = user_doc.get("created_at")
        updated = user_doc.get("updated_at")
        role = user_doc.get("role", "employee")
        
        perms = user_doc.get("permissions") or DEFAULT_PERMISSIONS.copy()
        if role == "admin":
            perms = {
                "can_upload": True, "can_view": True, "can_edit": True,
                "can_download": True, "can_export": True, "can_followup": True,
                "can_visitors": True, "can_manage_users": True,
                "can_manage_settings": True, "can_manage_backups": True,
                "can_delete": True
            }

        return {
            "id": str(user_doc["_id"]),
            "username": user_doc.get("username"),
            "email": user_doc.get("email"),
            "full_name": user_doc.get("full_name"),
            "role": role,
            "is_active": user_doc.get("is_active", True),
            "permissions": perms,
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created) if created else None,
            "updated_at": updated.isoformat() if isinstance(updated, datetime) else str(updated) if updated else None,
        }
