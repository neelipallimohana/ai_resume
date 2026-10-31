import json

def test_candidate_crud_and_duplicate_warning(client, admin_user):
    # Log in as admin
    client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPass123!"
    })

    # 1. Create candidate
    resp = client.post("/api/candidates", json={
        "name": "Sarah Connor",
        "email_id": "sarah@cyberdyne.com",
        "mobile_no": "+919876543210",
        "department": "Quality Assurance",
        "qualification": "B.Pharm",
        "experience": "4 years",
        "present_company": "Cyberdyne Systems",
        "designation": "QA Analyst"
    })
    assert resp.status_code == 201
    cand_id = resp.get_json()["candidate"]["id"]
    assert resp.get_json()["candidate"]["candidate_uid"].startswith("CAND-")

    # 2. Check duplicate warning with same email
    dup_resp = client.post("/api/candidates/check-duplicate", json={
        "email_id": "sarah@cyberdyne.com",
        "mobile_no": "9999999999"
    })
    assert dup_resp.status_code == 200
    assert dup_resp.get_json()["is_duplicate"] is True

    # 3. Edit candidate
    edit_resp = client.put(f"/api/candidates/{cand_id}", json={
        "name": "Sarah Connor (Updated)",
        "experience": "5 years"
    })
    assert edit_resp.status_code == 200
    assert edit_resp.get_json()["candidate"]["name"] == "Sarah Connor (Updated)"

    # 4. Search candidate
    search_resp = client.get("/api/candidates?search=Connor")
    assert search_resp.status_code == 200
    assert search_resp.get_json()["total"] == 1

    # 5. Filter by department
    filter_resp = client.get("/api/candidates?department=Quality+Assurance")
    assert filter_resp.status_code == 200
    assert filter_resp.get_json()["total"] == 1

    filter_none = client.get("/api/candidates?department=NonExistentDept")
    assert filter_none.status_code == 200
    assert filter_none.get_json()["total"] == 0

    # 6. Delete candidate
    del_resp = client.delete(f"/api/candidates/{cand_id}")
    assert del_resp.status_code == 200

    # Verify candidate is gone
    get_resp = client.get(f"/api/candidates/{cand_id}")
    assert get_resp.status_code == 404


def test_resume_file_upload(client, admin_user):
    import io
    import fitz

    # Log in as admin
    client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPass123!"
    })

    # Create in-memory PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Surya Prakash\nEmail: surya.prakash@example.com\nPhone: +919876543210\nExperience: 4 years\nCompany: Tech Labs")
    pdf_bytes = doc.tobytes()
    doc.close()

    data = {
        "files": (io.BytesIO(pdf_bytes), "Surya_Prakash_Resume.pdf")
    }

    resp = client.post("/api/candidates/upload", data=data, content_type="multipart/form-data")
    assert resp.status_code == 200
    results = resp.get_json()["results"]
    assert len(results) == 1
    assert results[0]["status"] in ("Needs Review", "Completed")
    assert results[0]["error"] is None or "Scanned" not in results[0]["error"]
    assert results[0]["candidate"]["name"] == "Surya Prakash" or results[0]["candidate"]["email_id"] == "surya.prakash@example.com"
