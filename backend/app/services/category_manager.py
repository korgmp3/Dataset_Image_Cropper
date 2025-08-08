from pathlib import Path
from typing import List, Set
import os

class CategoryManager:
    def __init__(self):
        self.categories: Set[str] = set()
    
    def extract_categories_from_folder(self, folder_path: str) -> List[str]:
        """Extract category names from subfolder structure"""
        folder = Path(folder_path)
        categories = []
        
        if folder.exists() and folder.is_dir():
            for item in folder.iterdir():
                if item.is_dir():
                    categories.append(item.name)
        
        self.categories.update(categories)
        return sorted(list(self.categories))
    
    def add_category(self, category: str) -> bool:
        if category and category not in self.categories:
            self.categories.add(category)
            return True
        return False
    
    def remove_category(self, category: str) -> bool:
        if category in self.categories:
            self.categories.remove(category)
            return True
        return False
    
    def get_categories(self) -> List[str]:
        return sorted(list(self.categories))
    
    def update_categories(self, categories: List[str]):
        self.categories = set(categories)

category_manager = CategoryManager()