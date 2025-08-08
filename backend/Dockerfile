FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libwebp7 \
    libwebpdemux2 \
    libwebpmux3 \
    webp \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app /app/app

# Initialize database and run migrations
RUN python -c "from app.init_db import initialize_database; initialize_database()"

# Copy initialization scripts
COPY app/init_dirs.py ./init_dirs.py
COPY app/init_db.py ./init_db.py

# Create startup script
RUN echo '#!/bin/bash\n\
python /app/init_dirs.py\n\
python /app/init_db.py\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1' > /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use startup script
CMD ["/app/start.sh"]