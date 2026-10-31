#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=============================================="
echo " Building AI Resume & Visitor Management System "
echo "=============================================="

# 1. Build React Frontend
echo "[1/2] Installing frontend dependencies and building production bundle..."
cd frontend
npm install
npm run build
cd ..

# 2. Install Python Dependencies
echo "[2/2] Installing Python backend packages..."
pip install --upgrade pip

# Try installing all requirements including RapidOCR (works on Python <= 3.12)
if ! pip install -r requirements.txt; then
    echo "Warning: Some packages (like rapidocr-onnxruntime) are incompatible with Python $(python -V)."
    echo "Installing core web and extraction packages..."
    pip install Flask==3.0.2 Flask-Cors==6.0.5 pymongo==4.19.0 dnspython==2.9.1 openpyxl==3.1.5 python-docx==1.2.0 PyMuPDF==2.0 pypdf==6.21.4 python-dotenv==1.2.4 requests==2.31.0 waitress==3.0.2 gunicorn==21.2.0 Werkzeug==3.1.8
fi

echo "=============================================="
echo " Build Completed Successfully!                "
echo "=============================================="
