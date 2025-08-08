from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import os
from datetime import datetime

from app.models.database import get_db
from app.models.detection import ObjectDetector
from app.routers import images, version, categories, settings

# Initialize detection model
detection = ObjectDetector()

# Create FastAPI app
app = FastAPI(title="Image Cropping & Dataset Creator")

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(images.router, prefix="/images", tags=["images"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(version.router, prefix="", tags=["version"])

@app.get("/health")
async def health_check():
    """Health check endpoint that also verifies directory permissions"""
    init_db = False
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        init_db = True
    except:
        pass
    
    # Check directory permissions
    dir_status = {}
    required_dirs = ["/data/input", "/data/output", "/app/logs"]
    
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists():
            if os.access(path, os.W_OK):
                dir_status[dir_path] = "writable"
            else:
                dir_status[dir_path] = "exists_but_not_writable"
        else:
            dir_status[dir_path] = "missing"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if init_db else "not connected",
        "object_detection": "disabled - manual bounding boxes only",
        "directories": dir_status
    }

@app.get("/")
async def root():
    return {"message": "Image Cropping & Dataset Creator API"}