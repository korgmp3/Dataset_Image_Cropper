from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import os
from datetime import datetime
import logging

from app.models.database import get_db
from app.routers import images, version, categories, settings

# Configure logging
logger = logging.getLogger(__name__)

# Global variables for ML detection
ml_detector = None
detection = None

# Conditionally import ML detection if enabled
ML_ENABLED = os.getenv('ML_ENABLED', 'false').lower() == 'true'

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    global ml_detector, detection
    
    # Startup
    logger.info("Starting up application...")
    
    if ML_ENABLED:
        logger.info("ML detection enabled - initializing OwlViT model...")
        try:
            from app.services.ml_detection import OwlViTDetector, set_ml_detector
            ml_detector = OwlViTDetector()
            ml_detector._initialize_model()  # Initialize the model
            set_ml_detector(ml_detector)  # Set the global instance
            
            if ml_detector.is_available():
                logger.info("✅ ML detection initialized successfully")
            else:
                logger.warning("⚠️ ML detection enabled but model not available")
        except Exception as e:
            logger.error(f"❌ Failed to initialize ML detection: {e}")
            ml_detector = None
    else:
        logger.info("ML detection disabled - initializing manual detection...")
        try:
            from app.models.detection import ObjectDetector
            detection = ObjectDetector()
        except Exception as e:
            logger.error(f"Failed to initialize manual detection: {e}")
            detection = None
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    if ml_detector:
        logger.info("Cleaning up ML detector...")
        # Clean up ML resources if needed
        ml_detector = None

# Create FastAPI app with lifespan
app = FastAPI(
    title="Image Cropping & Dataset Creator",
    lifespan=lifespan
)

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

# Include ML detection router if enabled
if ML_ENABLED:
    from app.routers import ml_detection
    app.include_router(ml_detection.router, prefix="/ml", tags=["ml-detection"])

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
    
    # Check ML status
    ml_status = "disabled"
    if ML_ENABLED and ml_detector and ml_detector.is_available():
        ml_status = "ML-enabled"
    elif ML_ENABLED:
        ml_status = "ML-enabled but not available"
    else:
        ml_status = "disabled - manual bounding boxes only"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if init_db else "not connected",
        "object_detection": ml_status,
        "ml_enabled": ML_ENABLED,
        "directories": dir_status
    }

@app.get("/")
async def root():
    return {"message": "Image Cropping & Dataset Creator API"}