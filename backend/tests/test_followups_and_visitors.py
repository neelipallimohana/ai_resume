from datetime import date
from app.models.candidate import Candidate
from app.models.follow_up import FollowUp
from app.models.visitor import Visitor
from app.services.backup_service import BackupService

def test_followup_lifecycle(client, admin_user):
    client.post("/api/auth/login", json={"username_or_email": "admin", "password": "AdminPass123!"})
    
    # Create candidate
    c_resp = client.post("/api/candidates", json={"name": "Tom Davis", "mobile_no": "9998887776"})
    cand_id = c_resp.get_json()["candidate"]["id"]

    # Schedule follow-up
    f_resp = client.post("/api/followups", json={
        "candidate_id": cand_id,
        "follow_up_date": date.today().strftime("%Y-%m-%d"),
        "follow_up_time": "15:00",
        "follow_up_type": "Interview",
        "notes": "Technical round 1 discussion"
    })
    assert f_resp.status_code == 201
    f_id = f_resp.get_json()["followup"]["id"]

    # Mark as completed
    up_resp = client.put(f"/api/followups/{f_id}", json={"status": "Completed"})
    assert up_resp.status_code == 200
    assert up_resp.get_json()["followup"]["status"] == "Completed"

def test_ofc_visitor_management(client, admin_user):
    client.post("/api/auth/login", json={"username_or_email": "admin", "password": "AdminPass123!"})

    # Register visitor
    v_resp = client.post("/api/visitors", json={
        "name": "Alex Johnson",
        "organization": "Acme Corp",
        "purpose_of_visit": "Vendor Meeting",
        "person_to_meet": "Operations Manager",
        "entry_time": "11:30"
    })
    assert v_resp.status_code == 201
    vis_id = v_resp.get_json()["visitor"]["id"]
    assert v_resp.get_json()["visitor"]["status"] == "Present"

    # Mark Exit
    exit_resp = client.post(f"/api/visitors/{vis_id}/mark-exit", json={"exit_time": "12:45"})
    assert exit_resp.status_code == 200
    assert exit_resp.get_json()["visitor"]["status"] == "Exited"
    assert exit_resp.get_json()["visitor"]["exit_time"] == "12:45"

def test_backup_creation_and_listing(app):
    with app.app_context():
        backup = BackupService.create_backup()
        assert backup["success"] is True
        assert backup["filename"].endswith(".zip")
        assert backup["file_size"] > 0

        backups = BackupService.list_backups()
        assert len(backups) >= 1
        assert backups[0]["filename"] == backup["filename"]
