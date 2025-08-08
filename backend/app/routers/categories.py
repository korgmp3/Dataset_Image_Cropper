from fastapi import APIRouter, HTTPException
from typing import List
from app.services.category_manager import category_manager
from app.models.schemas import CategoryRequest, FolderRequest

router = APIRouter()

@router.get("/", response_model=List[str])
def get_categories():
    return category_manager.get_categories()

@router.post("/extract-from-folder", response_model=List[str])
def extract_categories_from_folder(request: FolderRequest):
    try:
        categories = category_manager.extract_categories_from_folder(request.folder_path)
        return categories
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/update")
def update_categories(request: CategoryRequest):
    category_manager.update_categories(request.categories)
    return {"message": "Categories updated successfully"}

@router.post("/add/{category}")
def add_category(category: str):
    if category_manager.add_category(category):
        return {"message": f"Category '{category}' added successfully"}
    return {"message": f"Category '{category}' already exists"}

@router.delete("/remove/{category}")
def remove_category(category: str):
    if category_manager.remove_category(category):
        return {"message": f"Category '{category}' removed successfully"}
    raise HTTPException(status_code=404, detail=f"Category '{category}' not found")