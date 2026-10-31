import os
from datetime import datetime
from app.db import mongo

DEFAULT_SETTINGS = {
    "organization_name": "Antigravity Talent Solutions",
    "app_title": "AI Resume & OFC Visitor System",
    "timezone": "Asia/Kolkata",
    "date_format": "DD-MM-YYYY",
    "ai_provider": "openrouter",
    "openrouter_model": "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter_api_key": "",
    "max_file_size_mb": 16,
    "departments": [
        "Human Resources", "Quality Assurance", "Production", "R&D", 
        "Regulatory Affairs", "Supply Chain", "Sales & Marketing", "IT & Engineering", "Finance"
    ],
    "industries": [
        "Pharmaceuticals", "Biotechnology", "Healthcare", "Information Technology", 
        "Manufacturing", "Chemicals", "Medical Devices"
    ],
    "functions": [
        "Analytical QA", "Formulation R&D", "Clinical Research", "Packaging", 
        "Synthesis", "Regulatory Documentation", "Talent Acquisition", "Operations"
    ],
    "dosage_forms": [
        "Oral Solids (Tablets/Capsules)", "Injectables", "Topicals / Ointments", 
        "Ophthalmics", "Inhalers", "API / Bulk Drugs", "Biologicals"
    ]
}

class ApplicationSetting:
    @staticmethod
    def get_value(key, default=None):
        doc = mongo.settings.find_one({"setting_key": key})
        if doc and "setting_value" in doc:
            return doc["setting_value"]
        # Fallback to env or defaults
        if key == "openrouter_api_key":
            return os.environ.get("OPENROUTER_API_KEY", "") or DEFAULT_SETTINGS.get(key)
        if key == "openrouter_model":
            return os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free") or DEFAULT_SETTINGS.get(key)
        return default if default is not None else DEFAULT_SETTINGS.get(key)

    @staticmethod
    def set_value(key, value):
        mongo.settings.update_one(
            {"setting_key": key},
            {"$set": {
                "setting_key": key,
                "setting_value": value,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )

    @staticmethod
    def get_all():
        result = DEFAULT_SETTINGS.copy()
        # Overlay env vars if present
        if os.environ.get("OPENROUTER_API_KEY"):
            result["openrouter_api_key"] = os.environ.get("OPENROUTER_API_KEY")
        if os.environ.get("OPENROUTER_MODEL"):
            result["openrouter_model"] = os.environ.get("OPENROUTER_MODEL")

        docs = mongo.settings.find({})
        for d in docs:
            result[d["setting_key"]] = d["setting_value"]
        return result
