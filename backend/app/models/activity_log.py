from datetime import datetime
from bson import ObjectId
from app.db import mongo

class ActivityLog:
    @staticmethod
    def create(action, details=None, user_id=None, username="Anonymous", ip_address=None):
        doc = {
            "user_id": str(user_id) if user_id else None,
            "username": username or "Anonymous",
            "action": action,
            "details": details or "",
            "ip_address": ip_address or "127.0.0.1",
            "created_at": datetime.utcnow()
        }
        res = mongo.activity_logs.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        created = doc.get("created_at")
        return {
            "id": str(doc["_id"]),
            "user_id": doc.get("user_id"),
            "username": doc.get("username", "Anonymous"),
            "action": doc.get("action"),
            "details": doc.get("details", ""),
            "ip_address": doc.get("ip_address", ""),
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created) if created else None,
        }
