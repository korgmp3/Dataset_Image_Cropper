from fastapi import APIRouter, UploadFile, Form, HTTPException
from app.models.detection import detector
import shutil
from pathlib import Path
import tempfile
import os

router = APIRouter()

@router.post("/run")
async def run_detection(file: UploadFile, confidence: float = Form(0.25)):
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        detector.confidence = confidence
        results = detector.detect(temp_path)
        return {"detections": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/models")
def get_available_models():
    return {
        "current_model": "yolov5s",
        "available_models": ["yolov5s", "yolov5m", "yolov5l"],
        "current_confidence": detector.confidence
    }