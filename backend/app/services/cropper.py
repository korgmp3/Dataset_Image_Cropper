from PIL import Image
import os
from pathlib import Path
from typing import List
from app.models.schemas import BoundingBox
from app.models.database import ProcessingLog
from sqlalchemy.orm import Session
from datetime import datetime
import json

class ImageCropper:
    def __init__(self, output_base_path: str):
        self.output_base_path = Path(output_base_path)
        self._ensure_output_directory()
    
    def _ensure_output_directory(self):
        """Ensure output directory exists and is writable"""
        try:
            # Create main output directory
            self.output_base_path.mkdir(parents=True, exist_ok=True)
            
            # Ensure it's writable
            if not os.access(self.output_base_path, os.W_OK):
                os.chmod(self.output_base_path, 0o755)
                
            print(f"✓ Output directory ready: {self.output_base_path}")
        except Exception as e:
            print(f"✗ Error creating output directory: {e}")
            raise
    
    def _ensure_category_directory(self, category: str):
        """Ensure category subdirectory exists"""
        category_folder = self.output_base_path / category
        try:
            category_folder.mkdir(parents=True, exist_ok=True)
            
            # Ensure it's writable
            if not os.access(category_folder, os.W_OK):
                os.chmod(category_folder, 0o755)
                
            return category_folder
        except Exception as e:
            print(f"✗ Error creating category directory {category}: {e}")
            raise
    
    def crop_and_save(self, image_path: str, boxes: List[BoundingBox], db: Session) -> List[str]:
        saved_paths = []
        image = Image.open(image_path)
        image_name = Path(image_path).stem
        
        if not boxes:
            # Log no objects found
            log_entry = ProcessingLog(
                source_image_path=image_path,
                source_image_name=Path(image_path).name,
                processing_status="no_objects"
            )
            db.add(log_entry)
            db.commit()
            return []
        
        for i, box in enumerate(boxes):
            if box.category:
                try:
                    # Ensure category folder exists
                    category_folder = self._ensure_category_directory(box.category)
                    
                    # Calculate crop coordinates
                    left = max(0, box.x - box.width / 2)
                    top = max(0, box.y - box.height / 2)
                    right = min(image.width, box.x + box.width / 2)
                    bottom = min(image.height, box.y + box.height / 2)
                    
                    # Crop image
                    cropped = image.crop((left, top, right, bottom))
                    
                    # Save cropped image
                    output_filename = f"{image_name}_crop_{i}.jpg"
                    output_path = category_folder / output_filename
                    cropped.save(output_path)
                    saved_paths.append(str(output_path))
                    
                    print(f"✓ Saved crop: {output_path}")
                    
                    # Log the operation with correct field names
                    log_entry = ProcessingLog(
                        source_image_path=image_path,
                        source_image_name=Path(image_path).name,
                        cropped_image_path=str(output_path),
                        category=box.category,
                        processing_status="processed",
                        timestamp=datetime.now()
                    )
                    
                    # Store bounding box data as JSON
                    box_data = {
                        'x': box.x,
                        'y': box.y,
                        'width': box.width,
                        'height': box.height,
                        'confidence': getattr(box, 'confidence', 1.0)
                    }
                    log_entry.set_bounding_box_data(box_data)
                    
                    # Add debug logging
                    print(f"DEBUG: Storing box data for crop {i}: {box_data}")
                    print(f"DEBUG: Stored box data: {log_entry.bounding_box_data}")
                    
                    db.add(log_entry)
                    
                except Exception as e:
                    print(f"✗ Error processing crop {i} for category {box.category}: {e}")
                    continue
        
        db.commit()
        return saved_paths