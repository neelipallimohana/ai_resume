import pytest
import os
import tempfile
from app import create_app
from app.config import Config
from app.db import mongo
from app.models.user import User

class TestConfig(Config):
    TESTING = True
    MONGO_DB_NAME = "resume_management_test"
    MONGO_URI = "mongodb://localhost:27017/resume_management_test"
    WTF_CSRF_ENABLED = False
    STORAGE_PATH = tempfile.mkdtemp()
    CANDIDATES_STORAGE = os.path.join(STORAGE_PATH, "candidates")
    BACKUPS_STORAGE = os.path.join(STORAGE_PATH, "backups")
    TEMP_STORAGE = os.path.join(STORAGE_PATH, "temp")
    SESSION_COOKIE_SECURE = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        # Clear test collections
        for col in ["users", "candidates", "follow_ups", "visitors", "activity_logs", "application_settings"]:
            mongo.db[col].delete_many({})
        yield app
        for col in ["users", "candidates", "follow_ups", "visitors", "activity_logs", "application_settings"]:
            mongo.db[col].delete_many({})

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_user(app):
    user = User.create(
        username="admin",
        email="admin@example.com",
        full_name="System Administrator",
        password="AdminPass123!",
        role="admin"
    )
    return user

@pytest.fixture
def employee_user(app):
    user = User.create(
        username="john_doe",
        email="john@example.com",
        full_name="John Doe",
        password="Employee123!",
        role="employee",
        permissions={
            "can_upload": True,
            "can_view": True,
            "can_edit": False,
            "can_download": True,
            "can_export": True,
            "can_followup": True,
            "can_visitors": True
        }
    )
    return user
