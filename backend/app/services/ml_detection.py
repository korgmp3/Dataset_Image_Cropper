import os
import torch
from typing import List, Optional
import logging
from PIL import Image
import numpy as np
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OwlViTDetector:
    """OwlViT-based object detection service with CUDA auto-detection"""
    
    def __init__(self, model_name="google/owlvit-base-patch32", confidence_threshold=0.1):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.device = None
        self.processor = None
        self.model = None
        self.ml_enabled = os.getenv('ML_ENABLED', 'false').lower() == 'true'
        
        # Don't initialize model in constructor - let lifespan handle it
        if self.ml_enabled:
            logger.info("ML detection enabled - model will be initialized during startup")
        else:
            logger.info("ML detection disabled - skipping model initialization")
    
    def _initialize_model(self):
        """Initialize the OwlViT model with automatic device detection and retry logic"""
        if self.model is not None:
            logger.info("Model already initialized")
            return
        
        try:
            # Auto-detect device (CUDA, MPS, or CPU)
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
                logger.info(f"Using CUDA device: {torch.cuda.get_device_name()}")
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                self.device = torch.device("mps")
                logger.info("Using Apple MPS device")
            else:
                self.device = torch.device("cpu")
                logger.info("Using CPU device")
            
            # Import ML dependencies only when needed
            from transformers import OwlViTProcessor, OwlViTForObjectDetection
            
            # Load processor and model with retry logic
            logger.info(f"Loading OwlViT model: {self.model_name}")
            
            # Try to load with retries
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.info(f"Downloading model from Hugging Face (attempt {attempt + 1}/{max_retries})")
                    self.processor = OwlViTProcessor.from_pretrained(self.model_name)
                    self.model = OwlViTForObjectDetection.from_pretrained(self.model_name)
                    
                    # Move model to device
                    self.model.to(self.device)
                    self.model.eval()
                    
                    logger.info("OwlViT model loaded successfully")
                    break
                    
                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 30  # Exponential backoff
                        logger.info(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        logger.error(f"Failed to load model after {max_retries} attempts: {e}")
                        raise e
            
        except ImportError as e:
            logger.error(f"ML dependencies not available: {e}")
            self.ml_enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize OwlViT model: {e}")
            self.ml_enabled = False
    
    def is_available(self) -> bool:
        """Check if ML detection is available"""
        return self.ml_enabled and self.model is not None
    
    def get_device_info(self) -> dict:
        """Get information about the current device"""
        if not self.ml_enabled:
            return {"ml_enabled": False, "device": "none"}
        
        device_info = {
            "ml_enabled": True,
            "device": str(self.device) if self.device else "none",
            "device_type": self.device.type if self.device else "none"
        }
        
        if self.device and self.device.type == "cuda":
            device_info.update({
                "cuda_available": torch.cuda.is_available(),
                "cuda_device_count": torch.cuda.device_count(),
                "cuda_device_name": torch.cuda.get_device_name() if torch.cuda.is_available() else None,
                "cuda_memory_allocated": torch.cuda.memory_allocated() if torch.cuda.is_available() else 0,
                "cuda_memory_reserved": torch.cuda.memory_reserved() if torch.cuda.is_available() else 0
            })
        
        return device_info
    
    def detect_objects(self, image_path: str, text_queries: List[str]) -> List[dict]:
        """
        Detect objects in image using OwlViT with text queries
        
        Args:
            image_path: Path to the image file
            text_queries: List of text descriptions to detect (e.g., ["a cat", "a dog"])
            
        Returns:
            List of detection dictionaries with bbox coordinates, confidence, and class
        """
        if not self.is_available():
            logger.warning("ML detection not available - returning empty results")
            return []
        
        if not text_queries:
            logger.warning("No text queries provided")
            return []
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert("RGB")
            original_size = image.size  # (width, height)
            
            # Process inputs
            inputs = self.processor(text=text_queries, images=image, return_tensors="pt")
            
            # Move inputs to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Get target image sizes for post-processing
            target_sizes = torch.Tensor([original_size[::-1]]).to(self.device)  # (height, width)
            
            # Convert outputs to COCO API format and rescale bounding boxes
            results = self.processor.post_process_object_detection(
                outputs=outputs, 
                target_sizes=target_sizes, 
                threshold=self.confidence_threshold
            )
            
            # Process results
            detections = []
            result = results[0]  # First (and only) image
            
            for box, score, label_idx in zip(result["boxes"], result["scores"], result["labels"]):
                # Convert tensor to numpy
                box = box.cpu().numpy()
                score = score.cpu().item()
                label_idx = label_idx.cpu().item()
                
                # Get the text query that matched
                class_name = text_queries[label_idx] if label_idx < len(text_queries) else f"object_{label_idx}"
                
                # Convert from COCO format [x_min, y_min, x_max, y_max] to our format
                x_min, y_min, x_max, y_max = box
                width = x_max - x_min
                height = y_max - y_min
                
                detection = {
                    "x": float(x_min + width / 2),  # Center X
                    "y": float(y_min + height / 2),  # Center Y
                    "width": float(width),
                    "height": float(height),
                    "confidence": float(score),
                    "class_name": class_name,
                    "category": self._map_class_to_category(class_name)
                }
                
                detections.append(detection)
            
            logger.info(f"Detected {len(detections)} objects in {image_path}")
            return detections
            
        except Exception as e:
            logger.error(f"Error during object detection: {e}")
            return []
    
    def _map_class_to_category(self, class_name: str) -> Optional[str]:
        """
        Map detected class name to a category
        This can be customized based on your category system
        """
        # Simple mapping - you can make this more sophisticated
        class_name_lower = class_name.lower().strip()
        
        # Remove common prefixes
        if class_name_lower.startswith("a "):
            class_name_lower = class_name_lower[2:]
        elif class_name_lower.startswith("an "):
            class_name_lower = class_name_lower[3:]
        
        return class_name_lower
    
    def batch_detect(self, image_paths: List[str], text_queries: List[str]) -> dict:
        """
        Detect objects in multiple images (for future batch processing)
        
        Args:
            image_paths: List of image file paths
            text_queries: List of text descriptions to detect
            
        Returns:
            Dictionary mapping image paths to detection results
        """
        results = {}
        for image_path in image_paths:
            results[image_path] = self.detect_objects(image_path, text_queries)
        return results


# Global detector instance (will be initialized in lifespan)
ml_detector = None

def get_ml_detector() -> Optional[OwlViTDetector]:
    """Get the global ML detector instance"""
    return ml_detector

def set_ml_detector(detector: OwlViTDetector):
    """Set the global ML detector instance"""
    global ml_detector
    ml_detector = detector
