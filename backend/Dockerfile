# -------------------------
# Base Image
# -------------------------
FROM python:3.10-slim

# Prevent Python buffering
ENV PYTHONUNBUFFERED=1

# Working directory
WORKDIR /app

# -------------------------
# System Dependencies
# -------------------------
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# Install Python Dependencies
# -------------------------
COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

# -------------------------
# Copy Application
# -------------------------
COPY . .

# -------------------------
# Expose FastAPI Port
# -------------------------
EXPOSE 8000

# -------------------------
# Health Check
# -------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
CMD curl -f http://localhost:8000/docs || exit 1

# -------------------------
# Start FastAPI
# -------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]