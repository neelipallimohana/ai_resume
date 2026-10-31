# Multi-stage Dockerfile: React Frontend Builder + Python Backend Runtime

# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim AS backend-runtime
WORKDIR /app

# Install system dependencies for document processing and OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and config
COPY backend/ ./backend/
COPY run.py .

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create storage directory
RUN mkdir -p storage/resumes storage/temp storage/candidates

# Expose server port
EXPOSE 5000

ENV PRODUCTION=1
ENV PORT=5000

# Start production server
CMD ["python", "run.py", "--prod"]
