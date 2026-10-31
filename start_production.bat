@echo off
title AI Resume & OFC Visitor System - Production Server
color 0A
echo ========================================================
echo  AI Resume & OFC Visitor Management System (Production)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Frontend Production Build...
if not exist "frontend\dist\index.html" (
    echo Building frontend for production...
    cd frontend
    call npm run build
    cd ..
) else (
    echo Frontend build found in frontend\dist\
)

echo.
echo [2/3] Checking MongoDB Connection...
REM Attempt python check
python -c "from pymongo import MongoClient; c = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000); c.server_info(); print('MongoDB service is running successfully.')" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Local MongoDB service was not detected on localhost:27017!
    echo Ensure MongoDB service is running (e.g. 'net start MongoDB') or configure MONGO_URI in .env
)

echo.
echo [3/3] Starting Production WSGI Server on port 5000...
echo.
echo The application will be accessible at:
echo   - Local PC:       http://localhost:5000
echo   - Office Network: http://0.0.0.0:5000 (Use this PC's IP address)
echo.
echo Press Ctrl + C to stop the server at any time.
echo ========================================================
echo.

python run.py --prod

pause
