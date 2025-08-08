# import torch  # Commented out - not using object detection
from pathlib import Path
from typing import List
import cv2
import numpy as np
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True  # Handle truncated images

class ObjectDetector:
    def __init__(self, model_name="yolov5s", confidence=0.25):
        self.confidence = confidence
        self.model = None
        print(f"Object detection disabled - manual bounding boxes only")

    def detect(self, image_path: str) -> List[dict]:
        # Return empty list - no automatic detection
        print(f"Automatic object detection disabled")
        return []
    
    # def _enhanced_detection(self, image_path: str) -> List[dict]:
    #     """Enhanced detection using multiple OpenCV techniques - DISABLED"""
    #     # This method is commented out to avoid CUDA dependencies
    #     return []
    
    # def _create_simple_templates(self):
    #     """Create simple geometric templates - DISABLED"""
    #     return {}
    
    # def _remove_overlaps(self, detections):
    #     """Remove overlapping detections using NMS-like approach - DISABLED"""
    #     return detections

# Global detector instance
detector = ObjectDetector()