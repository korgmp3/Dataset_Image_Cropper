from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: Optional[float] = 1.0  # Make confidence optional with default
    category: Optional[str] = None
    class_name: Optional[str] = None

class DetectionRequest(BaseModel):
    image_path: str
    confidence: float = 0.25

class CropRequest(BaseModel):
    image_path: str
    boxes: List[BoundingBox]
    categories: List[str]

class CategoryRequest(BaseModel):
    categories: List[str]

class FolderRequest(BaseModel):
    folder_path: str

class ProcessingStatus(BaseModel):
    total_images: int
    processed_images: int
    current_image: Optional[str]
    progress_percentage: float