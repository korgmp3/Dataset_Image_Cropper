from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import os
import logging
from pydantic import BaseModel

from ..services.ml_detection import get_ml_detector

logger = logging.getLogger(__name__)
router = APIRouter()

class DetectionRequest(BaseModel):
    image_path: str
    text_queries: List[str]
    confidence_threshold: Optional[float] = 0.1

class DetectionResponse(BaseModel):
    success: bool
    detections: List[dict]
    message: Optional[str] = None
    device_info: Optional[dict] = None

class MLStatusResponse(BaseModel):
    ml_enabled: bool
    ml_available: bool
    device_info: dict
    model_name: Optional[str] = None

@router.get("/status", response_model=MLStatusResponse)
async def get_ml_status():
    """Get ML detection status and device information"""
    detector = get_ml_detector()
    
    return MLStatusResponse(
        ml_enabled=detector.ml_enabled,
        ml_available=detector.is_available(),
        device_info=detector.get_device_info(),
        model_name=detector.model_name if detector.is_available() else None
    )

@router.post("/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    """
    Detect objects in an image using OwlViT with text queries
    
    Args:
        request: Detection request with image path and text queries
        
    Returns:
        Detection results with bounding boxes and confidence scores
    """
    detector = get_ml_detector()
    
    if not detector.is_available():
        raise HTTPException(
            status_code=503, 
            detail="ML object detection is not available. Please use the ML-enabled version."
        )
    
    if not request.text_queries:
        raise HTTPException(
            status_code=400,
            detail="At least one text query must be provided"
        )
    
    # Validate image path
    if not os.path.exists(request.image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image file not found: {request.image_path}"
        )
    
    try:
        # Update confidence threshold if provided
        if request.confidence_threshold is not None:
            detector.confidence_threshold = request.confidence_threshold
        
        # Perform detection
        detections = detector.detect_objects(
            image_path=request.image_path,
            text_queries=request.text_queries
        )
        
        return DetectionResponse(
            success=True,
            detections=detections,
            message=f"Detected {len(detections)} objects",
            device_info=detector.get_device_info()
        )
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Object detection failed: {str(e)}"
        )

@router.post("/batch-detect")
async def batch_detect_objects(image_paths: List[str], text_queries: List[str]):
    """
    Detect objects in multiple images (for future batch processing)
    """
    detector = get_ml_detector()
    
    if not detector.is_available():
        raise HTTPException(
            status_code=503,
            detail="ML object detection is not available"
        )
    
    if not text_queries:
        raise HTTPException(
            status_code=400,
            detail="At least one text query must be provided"
        )
    
    try:
        results = detector.batch_detect(image_paths, text_queries)
        return {
            "success": True,
            "results": results,
            "device_info": detector.get_device_info()
        }
    except Exception as e:
        logger.error(f"Batch detection error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch detection failed: {str(e)}"
        )

@router.get("/device-info")
async def get_device_info():
    """Get detailed device information for ML detection"""
    detector = get_ml_detector()
    return detector.get_device_info()
