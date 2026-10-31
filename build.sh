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
pip install -r requirements.txt

echo "=============================================="
echo " Build Completed Successfully!                "
echo "=============================================="
