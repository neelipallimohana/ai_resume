import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # On Windows with Python 3.14, watchdog reloader triggers WinError 10038 when scanning site-packages
    use_reloader = os.environ.get("FLASK_RELOAD", "0").lower() in ("1", "true")
    print(f"Starting Resume & OFC Visitor System on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=use_reloader)
