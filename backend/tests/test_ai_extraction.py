from app.services.ai_extraction import AIExtractionService, EXTRACTION_SCHEMA

def test_heuristic_pattern_extraction():
    sample_text = """
    Johnathan Smith
    Email: johnathan.smith@company.org
    Contact: +91 9876543210
    Summary: Experienced QA manager with 4 years of experience in pharmaceutical injectables.
    Education: B.Pharm (2018 batch)
    """
    extracted = AIExtractionService.extract_with_heuristic_fallback(sample_text)
    assert extracted["email_id"] == "johnathan.smith@company.org"
    assert extracted["mobile_no"] == "+919876543210"
    assert extracted["year_of_passout"] == "2018"
    assert "4 years" in extracted["experience"]
    # Unmentioned fields must remain None
    assert extracted["current_ctc"] is None
    assert extracted["gender"] is None
    assert extracted["notice_period"] is None

def test_normalization_does_not_invent_missing_fields():
    raw_ai_output = {
        "name": "Jane Doe",
        "mobile_no": "09812345678",
        "email_id": "JANE@EXAMPLE.COM",
        "gender": "null",
        "qualification": "N/A",
        "current_ctc": "Unknown",
        "experience": "3 years"
    }
    normalized = AIExtractionService.normalize_extracted_fields(raw_ai_output)
    assert normalized["name"] == "Jane Doe"
    assert normalized["mobile_no"] == "09812345678"
    assert normalized["email_id"] == "jane@example.com"
    # "null", "N/A", "Unknown" must be converted to None
    assert normalized["gender"] is None
    assert normalized["qualification"] is None
    assert normalized["current_ctc"] is None
    assert normalized["expected_ctc"] is None
    assert normalized["experience"] == "3 years"

def test_empty_or_corrupt_text_handled_gracefully(app):
    with app.app_context():
        res = AIExtractionService.extract_candidate_data("")
        assert res["success"] is False
        assert "empty" in res["error"]
