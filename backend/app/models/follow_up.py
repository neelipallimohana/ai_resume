from datetime import datetime, date
from bson import ObjectId
from app.db import mongo, to_object_id

class FollowUp:
    @staticmethod
    def create(candidate_id, follow_up_date, follow_up_time="11:00", follow_up_type="Call", notes="", assigned_to_id=None, created_by_id=None):
        now = datetime.utcnow()
        if isinstance(follow_up_date, str):
            try:
                follow_up_date = datetime.strptime(follow_up_date, "%Y-%m-%d").date()
            except ValueError:
                follow_up_date = now.date()
        elif isinstance(follow_up_date, datetime):
            follow_up_date = follow_up_date.date()

        doc = {
            "candidate_id": str(candidate_id),
            "follow_up_date": follow_up_date.isoformat(),
            "follow_up_time": follow_up_time or "",
            "follow_up_type": follow_up_type or "Call",
            "notes": notes or "",
            "assigned_to_id": str(assigned_to_id) if assigned_to_id else None,
            "created_by_id": str(created_by_id) if created_by_id else None,
            "status": "Pending",
            "created_at": now,
            "updated_at": now
        }
        res = mongo.follow_ups.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    @staticmethod
    def get_by_id(followup_id):
        oid = to_object_id(followup_id)
        return mongo.follow_ups.find_one({"_id": oid})

    @staticmethod
    def update(followup_id, update_data):
        oid = to_object_id(followup_id)
        update_data["updated_at"] = datetime.utcnow()
        mongo.follow_ups.update_one({"_id": oid}, {"$set": update_data})
        return mongo.follow_ups.find_one({"_id": oid})

    @staticmethod
    def delete(followup_id):
        oid = to_object_id(followup_id)
        return mongo.follow_ups.delete_one({"_id": oid})

    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        
        # Candidate info lookup
        cand_id = doc.get("candidate_id")
        candidate_name = None
        candidate_uid = None
        if cand_id:
            cand = mongo.candidates.find_one({"_id": to_object_id(cand_id)})
            if cand:
                candidate_name = cand.get("name")
                candidate_uid = cand.get("candidate_uid")

        # Assigned user lookup
        assigned_name = "Unassigned"
        ass_id = doc.get("assigned_to_id")
        if ass_id:
            u = mongo.users.find_one({"_id": to_object_id(ass_id)})
            if u:
                assigned_name = u.get("full_name") or u.get("username")

        created = doc.get("created_at")
        updated = doc.get("updated_at")

        return {
            "id": str(doc["_id"]),
            "candidate_id": cand_id,
            "candidate_name": candidate_name,
            "candidate_uid": candidate_uid,
            "follow_up_date": doc.get("follow_up_date"),
            "follow_up_time": doc.get("follow_up_time", ""),
            "follow_up_type": doc.get("follow_up_type", "Call"),
            "notes": doc.get("notes", ""),
            "assigned_to_id": ass_id,
            "assigned_to_name": assigned_name,
            "created_by_id": doc.get("created_by_id"),
            "status": doc.get("status", "Pending"),
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created) if created else None,
            "updated_at": updated.isoformat() if isinstance(updated, datetime) else str(updated) if updated else None,
        }
