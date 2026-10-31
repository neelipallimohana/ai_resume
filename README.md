# AI-Powered Resume Management & OFC Visitor System

A functional, secure recruitment management system powered by **MongoDB** and **OpenRouter API**, featuring an independent OFC (Office) Visitor Management module and the fixed 24-column Excel recruitment format.

---

## Architecture Overview

```
React Frontend (Vite + Tailwind CSS + Lucide + Recharts)
                       |
                 HTTP (Port 5173 -> Port 5000)
                       v
Flask Backend (REST API + PyMongo + Werkzeug Session Security)
        |
        +---> MongoDB Database (mongodb://localhost:27017/resume_management)
        |
        +---> OpenRouter AI API (https://openrouter.ai/api/v1/chat/completions)
        |     (Models: meta-llama/llama-3.3-70b-instruct:free, google/gemini-2.0-flash-exp:free, deepseek, etc.)
        |
        +---> Resume Storage (storage/candidates/CAND-XXXXXX/original_resume.*)
        |
        +---> 24-Column Excel Generator (openpyxl)
        |
        +---> Independent OFC Visitor Desk & Visitor Excel Export
        |
        +---> Atomic MongoDB Backups (.zip archives)
```

---

## Key Features

1. **MongoDB Database Architecture**: Native high-performance document database using `pymongo`. All candidate records, follow-ups, visitors, settings, and audit logs are securely persisted in MongoDB. Supports local MongoDB or MongoDB Atlas.
2. **OpenRouter AI Extraction**: Integrates with OpenRouter API for structured JSON extraction. You can choose any top-tier model (e.g. `meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`, `deepseek/deepseek-chat`). If an API key is not yet configured, the system uses deterministic pattern extraction so operations are never blocked.
3. **Strict 24-Column Excel Registry**: Generates candidate workbooks with exactly columns A through X in the mandatory order (`S.No`, `Date`, `Name`, `Mobile.no`, `Email ID`, `Gender`, `Qualification`, `Year of passout`, `Department`, `Industry`, `Function/Unit`, `Dosage form / area`, `Experience`, `Present company`, `Designation`, `Regulatory exposure`, `Audit experience`, `Current CTC`, `Expected CTC`, `Notice Period`, `Current location`, `Preferred location`, `Shared By`, `Call remarks`).
4. **Interactive AI Review Form**: Inspect, edit, accept, or clear extracted fields before saving to candidate records. Never invents missing data.
5. **Candidate Folder & File Security**: Stores files in isolated folders (`storage/candidates/CAND-000001/`) with `metadata.json`. Download original resumes or download complete candidate folders as ZIP files.
6. **Duplicate Candidate Detection**: Automatically checks normalized email, phone number, and name/company in MongoDB, providing duplicate warnings with an interactive decision modal.
7. **Candidate Follow-up Management**: Schedule interview rounds, screening calls, and feedback reminders with Today, Upcoming, and Overdue tracking.
8. **Independent OFC Visitor Management**: Separate front-desk module for visitor registration, tracking present guests, 1-click exit time stamps, and separate visitor Excel workbooks.
9. **Role-Based Access Control**: Secure administrator setup on first launch (no hardcoded passwords). Granular permission controls for employees (`can_upload`, `can_view`, `can_edit`, `can_download`, `can_export`, `can_followup`, `can_visitors`).
10. **Atomic Backup & Restore**: One-click administrator backup of MongoDB collections and candidate resume folders into validated ZIP packages.

---

## Windows Installation & Execution Guide

### 1. Prerequisites

- **Python**: 3.11, 3.12, 3.13, or 3.14 (Ensure *"Add python.exe to PATH"* is checked)
- **Node.js**: v18 or higher (LTS recommended)
- **MongoDB**: MongoDB Community Server installed and running as a Windows service (port 27017) or a MongoDB Atlas connection string.
- **OpenRouter API Key**: Obtain a key from [openrouter.ai/keys](https://openrouter.ai/keys) (both free and paid models are supported).

### 2. Environment Configuration

Copy the example environment file:
```powershell
copy .env.example .env
```

Open `.env` in any text editor and configure:
```env
MONGO_URI=mongodb://localhost:27017/resume_management
MONGO_DB_NAME=resume_management
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```
*(You can also configure or update your OpenRouter API key and model directly in the web UI under **Settings**).*

### 3. Setting Up the Backend

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd c:\Projects\MernStack\excel\backend
   ```
2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the automated test suite to verify MongoDB connectivity and API endpoints:
   ```powershell
   python -m pytest
   ```
4. Start the Flask backend server:
   ```powershell
   python run.py
   ```
   *The backend starts on `http://127.0.0.1:5000`.*

### 4. Setting Up the Frontend

1. Open a **second** PowerShell window and navigate to the frontend directory:
   ```powershell
   cd c:\Projects\MernStack\excel\frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend starts on `http://localhost:5173`.*

### 5. Accessing the Application

1. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
2. On first launch, the application checks MongoDB and detects that no administrator exists, directing you to `/setup-admin`.
3. Create your master administrator account.
4. Once logged in, navigate to **Settings** (`/settings`) to test your OpenRouter API key and review your MongoDB connection.

---

## Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"MongoDB connection refused"** | MongoDB service is stopped. | Run `Start-Service -Name "MongoDB"` in an elevated PowerShell prompt or check your Atlas URI. |
| **"OpenRouter authentication failed (401)"** | Invalid or missing API key. | Check your API key at [openrouter.ai/keys](https://openrouter.ai/keys) and update it in `/settings`. |
| **AI falls back to baseline extraction** | OpenRouter key not set or rate limit reached. | The system automatically extracts phone, email, and education via regex so you can continue working without disruption. |
| **Backend port 5000 in use** | Another process is using port 5000. | Start backend on a custom port: `$env:PORT=5001; python run.py` and update proxy in `vite.config.js`. |
