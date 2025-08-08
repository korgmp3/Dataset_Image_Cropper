from fastapi import APIRouter
from app.models.detection import ObjectDetector

router = APIRouter()

# Create a global detector instance
detector = ObjectDetector()

@router.get("/")
def get_settings():
    return {
        "confidence_threshold": detector.confidence,
        "model_name": "disabled - manual only",
        "supported_formats": [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]
    }

@router.post("/confidence/{confidence}")
def set_confidence(confidence: float):
    if 0.0 <= confidence <= 1.0:
        detector.confidence = confidence
        return {"message": f"Confidence threshold set to {confidence}"}
    return {"error": "Confidence must be between 0.0 and 1.0"}