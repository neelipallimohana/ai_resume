import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_prod = "--prod" in sys.argv or os.environ.get("PRODUCTION", "0").lower() in ("1", "true")

    if is_prod:
        from waitress import serve
        print(f"============================================================")
        print(f"Serving Resume & Visitor Management System (PRODUCTION WSGI)")
        print(f"Local Access:   http://127.0.0.1:{port}")
        print(f"Network Access: http://0.0.0.0:{port}")
        print(f"============================================================")
        serve(app, host="0.0.0.0", port=port, threads=8)
    else:
        # On Windows with Python 3.14, watchdog reloader triggers WinError 10038 when scanning site-packages
        use_reloader = os.environ.get("FLASK_RELOAD", "0").lower() in ("1", "true")
        print(f"Starting Resume & OFC Visitor System on http://127.0.0.1:{port}")
        app.run(host="0.0.0.0", port=port, debug=True, use_reloader=use_reloader)
