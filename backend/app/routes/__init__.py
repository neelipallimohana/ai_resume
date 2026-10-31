from app.routes.auth_routes import auth_bp
from app.routes.candidate_routes import candidate_bp
from app.routes.followup_routes import followup_bp
from app.routes.visitor_routes import visitor_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.employee_routes import employee_bp
from app.routes.setting_routes import setting_bp

__all__ = [
    "auth_bp",
    "candidate_bp",
    "followup_bp",
    "visitor_bp",
    "dashboard_bp",
    "employee_bp",
    "setting_bp"
]
