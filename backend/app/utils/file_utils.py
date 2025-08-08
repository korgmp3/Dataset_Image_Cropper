from pathlib import Path
from typing import List
import os

SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}

def get_image_files(folder_path: str, recursive: bool = True) -> List[str]:
    """Get all image files from folder and subfolders"""
    folder = Path(folder_path)
    image_files = []
    
    if not folder.exists():
        return []
    
    pattern = "**/*" if recursive else "*"
    
    for file_path in folder.glob(pattern):
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_FORMATS:
            image_files.append(str(file_path))
    
    return sorted(image_files)

def validate_folder_path(folder_path: str) -> bool:
    """Validate if folder path exists and is readable"""
    try:
        folder = Path(folder_path)
        return folder.exists() and folder.is_dir() and os.access(folder, os.R_OK)
    except:
        return False