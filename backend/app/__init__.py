import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.db import mongo

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize MongoDB
    mongo.init_app(app)

    # Configure CORS for local development with Vite
    CORS(app, supports_credentials=True, origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ])

    # Ensure required storage directories exist
    os.makedirs(app.config["CANDIDATES_STORAGE"], exist_ok=True)
    os.makedirs(app.config["BACKUPS_STORAGE"], exist_ok=True)
    os.makedirs(app.config["TEMP_STORAGE"], exist_ok=True)

    # Register Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.candidate_routes import candidate_bp
    from app.routes.followup_routes import followup_bp
    from app.routes.visitor_routes import visitor_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.employee_routes import employee_bp
    from app.routes.setting_routes import setting_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(candidate_bp)
    app.register_blueprint(followup_bp)
    app.register_blueprint(visitor_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(setting_bp)

    # Generic, safe error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "details": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "File exceeds the allowed size limit (16MB maximum)."}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "An internal server error occurred. Please contact the administrator."}), 500

    @app.route("/api/health", methods=["GET"])
    def health_check():
        mongo_ok = mongo.ping() is not None
        return jsonify({
            "status": "healthy" if mongo_ok else "database_unreachable",
            "app": app.config.get("APP_NAME", "AI Resume System"),
            "database": "MongoDB",
            "mongo_connected": mongo_ok,
            "version": "2.0.0"
        })

    # Serve production frontend build if frontend/dist exists
    dist_dir = os.path.abspath(os.path.join(app.config.get("PROJECT_ROOT", os.getcwd()), "frontend", "dist"))
    if os.path.exists(dist_dir):
        from flask import send_from_directory

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            # Don't intercept API routes
            if path.startswith("api/"):
                return jsonify({"error": "API route not found"}), 404
            file_path = os.path.join(dist_dir, path)
            if path and os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(dist_dir, path)
            return send_from_directory(dist_dir, "index.html")

    return app
