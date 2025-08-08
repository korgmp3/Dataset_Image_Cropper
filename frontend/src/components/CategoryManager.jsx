import React, { useState, useEffect } from 'react';
import { getCategories, updateCategories, extractCategoriesFromFolder } from '../services/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [folderPath, setFolderPath] = useState('/data/input');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      updateCategories(updatedCategories);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    updateCategories(updatedCategories);
  };

  const handleExtractFromFolder = async () => {
    try {
      const extracted = await extractCategoriesFromFolder(folderPath);
      setCategories(extracted);
      alert(`Extracted ${extracted.length} categories from folder structure`);
    } catch (error) {
      alert('Error extracting categories: ' + error.message);
    }
  };

  return (
    <div className="category-manager">
      <h3>Category Management</h3>
      
      <div className="extract-section">
        <input 
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Folder path to extract categories from"
        />
        <button onClick={handleExtractFromFolder}>
          Extract from Folder
        </button>
      </div>

      <div className="add-category">
        <input 
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <button onClick={handleAddCategory}>Add Category</button>
      </div>

      <div className="categories-list">
        <h4>Current Categories:</h4>
        {categories.map(category => (
          <div key={category} className="category-item">
            <span>{category}</span>
            <button onClick={() => handleRemoveCategory(category)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}