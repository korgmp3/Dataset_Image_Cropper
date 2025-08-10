FROM python:3.9-slim

# Install system dependencies for OpenCV, WebP support, and CUDA (if available)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libwebp7 \
    libwebpdemux2 \
    libwebpmux3 \
    webp \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.ml.txt .
RUN pip install --no-cache-dir -r requirements.ml.txt

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/data /app/logs /data/input /data/output && \
    chmod -R 755 /app/data /app/logs /data

# Initialize directories and database (using the same approach as regular Dockerfile)
RUN python -c "from app.init_dirs import ensure_directories, ensure_output_structure; ensure_directories(); ensure_output_structure()" && \
    python -c "from app.init_db import initialize_database; initialize_database()"

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
