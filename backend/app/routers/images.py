from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import shutil
import os
import mimetypes

from app.models.database import get_db, ImageProgress, ProcessingLog
from app.models.schemas import CropRequest, FolderRequest, ProcessingStatus
from app.services.cropper import ImageCropper
from app.utils.file_utils import get_image_files, validate_folder_path
from app.models.detection import ObjectDetector
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True  # Handle truncated images
import io

router = APIRouter()

# Global variables to track current session
current_folder = None
current_images = []
current_index = 0
cropper = ImageCropper("/data/output")

@router.post("/set-folder")
def set_image_folder(request: FolderRequest, db: Session = Depends(get_db)):
    global current_folder, current_images, current_index
    
    if not validate_folder_path(request.folder_path):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    current_folder = request.folder_path
    current_images = get_image_files(request.folder_path)
    current_index = 0
    
    # Check which images are already processed
    processed_images = db.query(ImageProgress).filter(
        ImageProgress.image_path.in_(current_images),
        ImageProgress.processed == True
    ).all()
    
    processed_paths = {img.image_path for img in processed_images}
    
    # Find first unprocessed image
    for i, img_path in enumerate(current_images):
        if img_path not in processed_paths:
            current_index = i
            break
    
    return {
        "message": "Folder set successfully",
        "total_images": len(current_images),
        "current_index": current_index
    }

@router.get("/current")
def get_current_image():
    global current_images, current_index
    
    if not current_images or current_index >= len(current_images):
        return {"image_path": None, "index": current_index, "total": len(current_images)}
    
    return {
        "image_path": current_images[current_index],
        "index": current_index,
        "total": len(current_images)
    }

# @router.post("/detect")
# async def detect_objects(file: UploadFile = File(...), confidence: float = 0.25):
#     """Detect objects in uploaded image - DISABLED"""
#     # Object detection is disabled to avoid CUDA dependencies
#     return {"detections": []}

@router.post("/crop-and-save")
def crop_and_save_image(request: CropRequest, db: Session = Depends(get_db)):
    global current_index, current_images
    
    try:
        # Crop and save
        saved_paths = cropper.crop_and_save(request.image_path, request.boxes, db)
        
        # Mark image as processed
        progress_entry = ImageProgress(
            image_path=request.image_path,
            processed=True
        )
        db.add(progress_entry)
        db.commit()
        
        # Move to next image
        current_index += 1
        
        return {
            "message": "Image processed successfully",
            "saved_paths": saved_paths,
            "next_index": current_index
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/skip")
def skip_image(image_path: str, reason: str = "user_skipped", db: Session = Depends(get_db)):
    global current_index
    
    # Log skip
    log_entry = ProcessingLog(
        source_image_path=image_path,
        source_image_name=Path(image_path).name,
        processing_status="skipped",
        skip_reason=reason
    )
    db.add(log_entry)
    
    # Mark as processed
    progress_entry = ImageProgress(
        image_path=image_path,
        processed=True
    )
    db.add(progress_entry)
    db.commit()
    
    current_index += 1
    return {"message": "Image skipped", "next_index": current_index}

@router.get("/progress", response_model=ProcessingStatus)
def get_progress(db: Session = Depends(get_db)):
    global current_images, current_index
    
    total = len(current_images) if current_images else 0
    processed = current_index
    current_img = current_images[current_index] if current_images and current_index < len(current_images) else None
    
    progress = (processed / total * 100) if total > 0 else 0
    
    return ProcessingStatus(
        total_images=total,
        processed_images=processed,
        current_image=current_img,
        progress_percentage=progress
    )

@router.get("/list")
def get_image_list():
    global current_images
    return {"images": current_images}

@router.get("/serve")
async def serve_image(path: str):
    """Serve an image file with WebP conversion support"""
    print(f"=== IMAGE SERVE REQUEST ===")
    print(f"Requested path: {path}")
    print(f"File exists: {os.path.exists(path)}")
    
    if not os.path.exists(path):
        print(f"File not found: {path}")
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        print(f"File extension: {Path(path).suffix.lower()}")
        
        # For WebP files, convert to JPEG to ensure browser compatibility
        if path.lower().endswith('.webp'):
            print("Processing WebP file...")
            with Image.open(path) as img:
                print(f"Original image mode: {img.mode}, size: {img.size}")
                
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                    print("Converted to RGB")
                
                # Convert to JPEG in memory
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG', quality=95)
                img_bytes.seek(0)
                
                print(f"Converted WebP to JPEG, size: {len(img_bytes.getvalue())} bytes")
                
                return Response(
                    content=img_bytes.getvalue(),
                    media_type="image/jpeg"
                )
        else:
            print("Processing non-WebP file...")
            # For other formats, serve directly
            mime_type, _ = mimetypes.guess_type(path)
            if not mime_type or not mime_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="Invalid image file")
            
            print(f"Serving with mime type: {mime_type}")
            return FileResponse(path, media_type=mime_type)
            
    except Exception as e:
        print(f"ERROR serving image {path}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Cannot process image: {str(e)}")

@router.get("/serve-converted")
async def serve_image_converted(path: str):
    """Serve an image file, converting WebP to JPEG if needed"""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # Open image with PIL
        with Image.open(path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # If it's WebP, convert to JPEG in memory
            if path.lower().endswith('.webp'):
                import io
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG', quality=95)
                img_bytes.seek(0)
                
                return Response(
                    content=img_bytes.getvalue(),
                    media_type="image/jpeg"
                )
            else:
                # For other formats, serve directly
                mime_type, _ = mimetypes.guess_type(path)
                return FileResponse(path, media_type=mime_type)
                
    except Exception as e:
        print(f"Error serving/converting image {path}: {e}")
        raise HTTPException(status_code=500, detail=f"Cannot process image: {str(e)}")

@router.get("/test-webp")
async def test_webp_support():
    """Test WebP support in PIL"""
    try:
        from PIL import Image
        # Test WebP support
        features = []
        if hasattr(Image, 'EXTENSION'):
            if '.webp' in Image.EXTENSION:
                features.append("WebP extension registered")
        
        # Try to check WebP decoder
        try:
            from PIL.WebPImagePlugin import WebPImageFile
            features.append("WebP plugin available")
        except ImportError:
            features.append("WebP plugin NOT available")
        
        return {
            "webp_support": True,
            "features": features,
            "pillow_version": Image.__version__ if hasattr(Image, '__version__') else "unknown"
        }
    except Exception as e:
        return {
            "webp_support": False,
            "error": str(e)
        }

@router.get("/serve-as-jpeg")
async def serve_as_jpeg(path: str):
    """Convert any image format to JPEG for maximum compatibility"""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        with Image.open(path) as img:
            # Convert to RGB
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Convert to JPEG in memory
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG', quality=95)
            img_bytes.seek(0)
            
            return Response(
                content=img_bytes.getvalue(),
                media_type="image/jpeg"
            )
            
    except Exception as e:
        print(f"Error converting image {path}: {e}")
        raise HTTPException(status_code=500, detail=f"Cannot convert image: {str(e)}")