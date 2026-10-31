from datetime import datetime, date
from bson import ObjectId
from app.db import mongo, to_object_id

class Visitor:
    @staticmethod
    def generate_uid():
        count = mongo.visitors.count_documents({})
        last = mongo.visitors.find_one({}, sort=[("visitor_uid", -1)])
        if last and "visitor_uid" in last and last["visitor_uid"].startswith("VIS-"):
            try:
                num = int(last["visitor_uid"].split("-")[1])
                return f"VIS-{num + 1:06d}"
            except Exception:
                pass
        return f"VIS-{count + 1:06d}"

    @staticmethod
    def create(name, purpose_of_visit, person_to_meet, mobile_no=None, organization=None, visit_date=None, entry_time=None, notes="", created_by_id=None):
        now = datetime.utcnow()
        uid = Visitor.generate_uid()

        if isinstance(visit_date, str):
            try:
                visit_date = datetime.strptime(visit_date, "%Y-%m-%d").date()
            except ValueError:
                visit_date = now.date()
        elif not isinstance(visit_date, (datetime, date)):
            visit_date = now.date()

        if not entry_time:
            entry_time = now.strftime("%H:%M")

        doc = {
            "visitor_uid": uid,
            "name": name.strip(),
            "mobile_no": str(mobile_no) if mobile_no is not None else None,
            "organization": organization or "Individual",
            "purpose_of_visit": purpose_of_visit.strip(),
            "person_to_meet": person_to_meet.strip(),
            "visit_date": visit_date.isoformat() if hasattr(visit_date, "isoformat") else str(visit_date),
            "entry_time": entry_time,
            "exit_time": None,
            "status": "Present",
            "notes": notes or "",
            "created_by_id": str(created_by_id) if created_by_id else None,
            "created_at": now,
            "updated_at": now
        }
        res = mongo.visitors.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    @staticmethod
    def get_by_id(visitor_id):
        oid = to_object_id(visitor_id)
        return mongo.visitors.find_one({"_id": oid})

    @staticmethod
    def mark_exit(visitor_id, exit_time=None):
        oid = to_object_id(visitor_id)
        if not exit_time:
            exit_time = datetime.now().strftime("%H:%M")
        mongo.visitors.update_one(
            {"_id": oid},
            {"$set": {
                "exit_time": exit_time,
                "status": "Exited",
                "updated_at": datetime.utcnow()
            }}
        )
        return mongo.visitors.find_one({"_id": oid})

    @staticmethod
    def update(visitor_id, update_data):
        oid = to_object_id(visitor_id)
        update_data["updated_at"] = datetime.utcnow()
        mongo.visitors.update_one({"_id": oid}, {"$set": update_data})
        return mongo.visitors.find_one({"_id": oid})

    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        created = doc.get("created_at")
        updated = doc.get("updated_at")

        # Creator lookup
        creator_name = "System"
        cid = doc.get("created_by_id")
        if cid:
            u = mongo.users.find_one({"_id": to_object_id(cid)})
            if u:
                creator_name = u.get("full_name") or u.get("username")

        return {
            "id": str(doc["_id"]),
            "visitor_uid": doc.get("visitor_uid"),
            "name": doc.get("name"),
            "mobile_no": str(doc.get("mobile_no")) if doc.get("mobile_no") is not None else "",
            "organization": doc.get("organization") or "",
            "purpose_of_visit": doc.get("purpose_of_visit"),
            "person_to_meet": doc.get("person_to_meet"),
            "visit_date": doc.get("visit_date"),
            "entry_time": doc.get("entry_time"),
            "exit_time": doc.get("exit_time") or "",
            "status": doc.get("status", "Present"),
            "notes": doc.get("notes") or "",
            "created_by_id": cid,
            "created_by_name": creator_name,
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created) if created else None,
            "updated_at": updated.isoformat() if isinstance(updated, datetime) else str(updated) if updated else None,
        }
