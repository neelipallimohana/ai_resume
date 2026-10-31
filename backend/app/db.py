from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        uri = app.config.get("MONGO_URI", "mongodb://localhost:27017/resume_management")
        db_name = app.config.get("MONGO_DB_NAME", "resume_management")
        
        self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self.db = self.client[db_name]

        # Collections
        self.users = self.db["users"]
        self.candidates = self.db["candidates"]
        self.follow_ups = self.db["follow_ups"]
        self.visitors = self.db["visitors"]
        self.activity_logs = self.db["activity_logs"]
        self.settings = self.db["application_settings"]

        # Ensure Indexes
        try:
            self.users.create_index([("username", ASCENDING)], unique=True)
            self.users.create_index([("email", ASCENDING)], unique=True)
            self.candidates.create_index([("candidate_uid", ASCENDING)], unique=True)
            self.candidates.create_index([("email_id", ASCENDING)])
            self.candidates.create_index([("mobile_no", ASCENDING)])
            self.visitors.create_index([("visitor_uid", ASCENDING)], unique=True)
            self.settings.create_index([("setting_key", ASCENDING)], unique=True)
            self.follow_ups.create_index([("candidate_id", ASCENDING)])
            self.follow_ups.create_index([("follow_up_date", ASCENDING)])
            self.activity_logs.create_index([("created_at", DESCENDING)])
        except Exception as e:
            print(f"[MongoDB Index Warning] {e}")

    def ping(self):
        try:
            return self.client.admin.command("ping")
        except Exception as e:
            return None

mongo = MongoDB()

def to_object_id(id_val):
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str) and ObjectId.is_valid(id_val):
        return ObjectId(id_val)
    return id_val
