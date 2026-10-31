import os
from datetime import timedelta
try:
    from dotenv import load_dotenv
    # Load .env from project root or backend
    root_env = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
    backend_env = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
    if os.path.exists(root_env):
        load_dotenv(root_env)
    elif os.path.exists(backend_env):
        load_dotenv(backend_env)
    else:
        load_dotenv()
except ImportError:
    pass

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.dirname(BASE_DIR))

class Config:
    BASE_DIR = BASE_DIR
    PROJECT_ROOT = PROJECT_ROOT
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-insecure-secret-key-change-in-production-123456")
    
    # MongoDB Database configuration
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/resume_management")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "resume_management")

    # File Storage
    STORAGE_PATH = os.environ.get("STORAGE_PATH", os.path.join(BASE_DIR, "storage"))
    CANDIDATES_STORAGE = os.path.join(STORAGE_PATH, "candidates")
    BACKUPS_STORAGE = os.path.join(STORAGE_PATH, "backups")
    TEMP_STORAGE = os.path.join(STORAGE_PATH, "temp")
    
    # 16 MB max upload size
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
    ALLOWED_EXTENSIONS = {"pdf", "docx"}
    
    # OpenRouter AI API configuration
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    OPENROUTER_TIMEOUT = int(os.environ.get("OPENROUTER_TIMEOUT", 45))

    # Session & Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "False").lower() in ("true", "1")
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # App Info
    APP_NAME = "AI Resume & Visitor Management System (MongoDB & OpenRouter)"
    TIMEZONE = os.environ.get("APPLICATION_TIMEZONE", "Asia/Kolkata")
