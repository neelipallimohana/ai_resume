# AI Resume & OFC Visitor Management System — Deployment Guide

This guide covers all deployment options for the AI Resume & OFC Visitor Management System:
- **Option 1: Windows / Office Network Deployment (Recommended for Local Teams / Intranet)**
- **Option 2: Cloud Linux Server (Ubuntu / AWS EC2 / DigitalOcean / Linode)**
- **Option 3: Docker & Docker Compose**
- **Option 4: Cloud Platform Deployment (Render / Railway + MongoDB Atlas)**

---

## Architecture Overview in Production

```
Users / Recruiters (Browser)
          │
          ▼
    Production Server (Port 5000)
    ┌────────────────────────────────────────────────────────┐
    │  Waitress / Gunicorn WSGI Server                       │
    │  ├─ Serves React Single Page Application (HTML/JS/CSS) │
    │  └─ Serves RESTful API Endpoints (/api/*)              │
    └────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
    MongoDB Database        OpenRouter AI API
 (Local or Atlas Cloud)  (Candidate Extraction)
```

In production, the built React frontend (`frontend/dist`) is served directly by the backend web server. This eliminates the need to run Vite or Node.js in production!

---

## Pre-requisites Before Deployment

1. **MongoDB Database**:
   - Local MongoDB Community Server running on `mongodb://localhost:27017/resume_management`
   - OR Free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.
2. **OpenRouter API Key**:
   - Free account at [OpenRouter](https://openrouter.ai/) with your API key and preferred model (e.g. `nvidia/nemotron-3-ultra-550b-a55b:free` or `meta-llama/llama-3.3-70b-instruct:free`).
3. **Environment Configuration (`.env`)**:
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=generate-a-strong-random-key-here-32chars
   MONGO_URI=mongodb://localhost:27017/resume_management
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
   PORT=5000
   PRODUCTION=1
   ```

---

## Option 1: Windows / Office LAN Deployment (Zero-Cost, Local Intranet)

Ideal for internal office recruitment teams to share one centralized server over office Wi-Fi or LAN.

### Step 1: Build the Frontend
Open PowerShell in the project directory:
```powershell
cd frontend
npm install
npm run build
cd ..
```
This builds optimized HTML, CSS, and JS files into `frontend/dist`.

### Step 2: Install Python Production Server
```powershell
pip install -r backend/requirements.txt
```
*(Requirements include `waitress`, `pymongo`, `rapidocr-onnxruntime`, `openpyxl`, `PyMuPDF`).*

### Step 3: Run in Production Mode
Simply run:
```powershell
python run.py --prod
```
Or double-click `start_production.bat`.

### Step 4: Access Across the Office Network
- On the host computer: `http://localhost:5000`
- For other colleagues on the same office Wi-Fi:
  Find your computer's local IP address:
  ```powershell
  ipconfig
  ```
  *(Look for IPv4 Address, e.g. `192.168.1.15`)*
  Colleagues can open: `http://192.168.1.15:5000` in their browsers!

*(Note: If colleagues cannot connect, open Windows Defender Firewall and allow port 5000 for inbound TCP traffic).*

---

## Option 2: Linux Cloud Server Deployment (Ubuntu / AWS EC2 / DigitalOcean)

### Step 1: Provision Server & Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git nginx
```

### Step 2: Install MongoDB Community Server
```bash
sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

### Step 3: Clone Code & Build Frontend
```bash
git clone <your-repo-url> /var/www/resume-system
cd /var/www/resume-system

# Install Node.js & build frontend
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
cd frontend && npm install && npm run build && cd ..

# Setup Python Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

### Step 4: Configure Systemd Service
Create `/etc/systemd/system/resume-system.service`:
```ini
[Unit]
Description=AI Resume Management System WSGI
After=network.target mongod.service

[Service]
User=ubuntu
WorkingDirectory=/var/www/resume-system
Environment="PATH=/var/www/resume-system/venv/bin"
EnvironmentFile=/var/www/resume-system/.env
ExecStart=/var/www/resume-system/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 "run:app"
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now resume-system
```

### Step 5: Configure Nginx Reverse Proxy & SSL
Create `/etc/nginx/sites-available/resume-system`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable site and add free Let's Encrypt SSL:
```bash
sudo ln -s /etc/nginx/sites-available/resume-system /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Option 3: Docker Deployment

### `Dockerfile`:
```dockerfile
# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Python backend
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt waitress
COPY backend ./backend
COPY run.py ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=5000
ENV PRODUCTION=1
EXPOSE 5000
CMD ["python", "run.py", "--prod"]
```

### `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  web:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017/resume_management
      - OPENROUTER_API_KEY=your_key_here
      - OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
      - SECRET_KEY=your_super_secret_key_32_characters
    depends_on:
      - mongodb
    volumes:
      - resume_storage:/app/storage

volumes:
  mongo_data:
  resume_storage:
```
Run with:
```bash
docker compose up -d
```

---

## Option 4: Free/PaaS Deployment (Render / Railway + MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and obtain your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/resume_management?retryWrites=true&w=majority`
2. Push your project to GitHub.
3. On Render or Railway:
   - **Build Command**: `cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt`
   - **Start Command**: `python run.py --prod`
   - **Environment Variables**:
     - `MONGO_URI`: (Your Atlas connection string)
     - `OPENROUTER_API_KEY`: (Your OpenRouter Key)
     - `SECRET_KEY`: (Random string)
