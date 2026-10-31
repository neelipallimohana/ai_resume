import json

def test_first_admin_setup(client):
    # Check status before init
    resp = client.get("/api/auth/status")
    data = resp.get_json()
    assert data["system_initialized"] is False
    assert data["authenticated"] is False

    # Setup first admin
    resp = client.post("/api/auth/setup-admin", json={
        "username": "superadmin",
        "email": "super@company.com",
        "full_name": "Chief Administrator",
        "password": "StrongPassword123!"
    })
    assert resp.status_code == 201
    assert resp.get_json()["user"]["username"] == "superadmin"

    # Secondary attempt should be rejected
    resp2 = client.post("/api/auth/setup-admin", json={
        "username": "hacker",
        "email": "hacker@evil.com",
        "full_name": "Fake Admin",
        "password": "Password123!"
    })
    assert resp2.status_code == 400

def test_login_success_and_logout(client, admin_user):
    # Login with valid credentials
    resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPass123!"
    })
    assert resp.status_code == 200
    assert resp.get_json()["user"]["role"] == "admin"

    # Check /api/auth/me
    resp_me = client.get("/api/auth/me")
    assert resp_me.status_code == 200
    assert resp_me.get_json()["user"]["username"] == "admin"

    # Logout
    resp_logout = client.post("/api/auth/logout")
    assert resp_logout.status_code == 200

    # Verify protected route is now rejected
    resp_me2 = client.get("/api/auth/me")
    assert resp_me2.status_code == 401

def test_login_failed_password(client, admin_user):
    resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401

def test_employee_permission_enforcement(client, employee_user):
    # Log in as employee who has can_edit=False
    resp = client.post("/api/auth/login", json={
        "username_or_email": "john_doe",
        "password": "Employee123!"
    })
    assert resp.status_code == 200

    # Attempting to manually create candidate (requires can_edit) must return 403
    create_resp = client.post("/api/candidates", json={
        "name": "Jane Candidate",
        "email_id": "jane@example.com"
    })
    assert create_resp.status_code == 403
    assert "Permission denied" in create_resp.get_json()["error"]
