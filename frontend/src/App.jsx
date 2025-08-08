import React, { useState, useEffect } from 'react';
import BoundingBoxEditor from './components/BoundingBoxEditor';
import { 
  getCurrentImage, 
  cropAndSave, 
  skipImage, 
  getCategories,
  updateCategories,
  extractCategoriesFromFolder,
  setImageFolder,
  getProgress
} from './services/api';
import { APP_VERSION } from './config/version';

export default function App() {
  // Image processing state
  const [currentImage, setCurrentImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0.25);
  
  // Folder and progress state
  const [folderPath, setFolderPath] = useState('/data/input');
  const [progress, setProgress] = useState(null);
  
  // Category management state
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // Add directory status state
  const [directoryStatus, setDirectoryStatus] = useState({});

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Toast notification functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const showErrorToast = (message) => {
    showToast(message, 'error');
  };

  useEffect(() => {
    loadCurrentImage();
    loadCategories();
    loadProgress();
    checkDirectoryStatus();
    
    // Auto-refresh progress every 5 seconds
    const interval = setInterval(loadProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  // Extract default category from input folder path
  const getDefaultCategory = () => {
    if (!currentImage?.image_path) return null;
    
    const pathParts = currentImage.image_path.split('/');
    const inputFolderIndex = pathParts.indexOf('input');
    
    if (inputFolderIndex >= 0 && inputFolderIndex < pathParts.length - 2) {
      const folderName = pathParts[inputFolderIndex + 1];
      if (categories.includes(folderName)) {
        return folderName;
      }
    }
    
    return null;
  };

  // Image processing functions
  const loadCurrentImage = async () => {
    setLoading(true);
    try {
      const image = await getCurrentImage();
      console.log('LoadCurrentImage response:', image);
      
      if (image && image.image_path) {
        setCurrentImage(image);
      } else {
        // No more images to process
        setCurrentImage(null);
        setDetections([]);
        console.log('No more images to process');
      }
    } catch (error) {
      console.error('Error loading current image:', error);
      // On error, reset state
      setCurrentImage(null);
      setDetections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!currentImage?.image_path) {
      showErrorToast('No image loaded');
      return;
    }

    if (detections.length === 0) {
      // Instead of confirm dialog, just skip automatically
      await handleSkipImage('no_objects');
      return;
    }

    const detectionsWithoutCategory = detections.filter(detection => !detection.category || detection.category.trim() === '');
    
    if (detectionsWithoutCategory.length > 0) {
      showErrorToast(`${detectionsWithoutCategory.length} box(es) missing categories. Please assign categories to all bounding boxes.`);
      return;
    }

    const validDetections = detections.filter(detection => detection.category && detection.category.trim() !== '');
    
    if (validDetections.length === 0) {
      showErrorToast('Please assign at least one valid category before saving.');
      return;
    }

    try {
      console.log('DEBUG: Starting crop and save...');
      const result = await cropAndSave({
        image_path: currentImage.image_path,
        boxes: validDetections,
        categories: categories
      });
      
      console.log('DEBUG: Crop and save result:', result);
      showToast(`✅ Saved ${validDetections.length} cropped image(s)`);
      
      // Clear current detections and load next image
      console.log('DEBUG: Clearing detections and loading next image...');
      setDetections([]);
      await loadCurrentImage();
      
      // Update progress after processing
      loadProgress();
    } catch (error) {
      console.error('DEBUG: Error in handleSaveImage:', error);
      showErrorToast('Error saving image: ' + error.message);
    }
  };

  const handleSkipImage = async (reason = 'user_skipped') => {
    if (!currentImage?.image_path) return;

    try {
      console.log('DEBUG: Starting skip image...');
      const result = await skipImage(currentImage.image_path, reason);
      
      console.log('DEBUG: Skip image result:', result);
      
      showToast('⏭️ Image skipped');
      
      // Clear current detections and load next image
      console.log('DEBUG: Clearing detections and loading next image...');
      setDetections([]);
      await loadCurrentImage();
      
      // Update progress after skipping
      loadProgress();
    } catch (error) {
      console.error('DEBUG: Error in handleSkipImage:', error);
      showErrorToast('Error skipping image: ' + error.message);
    }
  };

  const updateDetections = (newDetections) => {
    setDetections(newDetections);
  };

  // Folder management functions
  const handleSetFolder = async () => {
    setLoading(true);
    try {
      const result = await setImageFolder(folderPath);
      showToast('📁 Folder set successfully');
      
      // Automatically extract categories from the folder structure
      try {
        const extracted = await extractCategoriesFromFolder(folderPath);
        setCategories(extracted);
        showToast(`📂 Extracted ${extracted.length} categories from folder structure`);
      } catch (categoryError) {
        console.error('Error extracting categories:', categoryError);
        // Don't show error toast for category extraction - it's optional
      }
      
      // Reset state and reload everything
      setDetections([]);
      setCurrentImage(null);
      await loadProgress();
      await loadCurrentImage();
    } catch (error) {
      showErrorToast('Error setting folder: ' + error.message);
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    try {
      const progressData = await getProgress();
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  // Category management functions
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
      showToast(`🏷️ Category "${newCategory.trim()}" added`);
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    updateCategories(updatedCategories);
    showToast(`🗑️ Category "${categoryToRemove}" removed`);
  };

  // Add function to check directory status
  const checkDirectoryStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const healthData = await response.json();
      setDirectoryStatus(healthData.directories || {});
    } catch (error) {
      console.error('Error checking directory status:', error);
    }
  };

  return (
    <div className="app">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}
      
      <div className="app-header">
        <h1>Image Cropping & Dataset Creator</h1>
        <div className="version-info">
          <span className="version-badge">v{APP_VERSION.version}</span>
          <span className="version-date">{APP_VERSION.buildDate}</span>
        </div>
      </div>
      
      <div className="main-layout">
        {/* Left side - Image */}
        <div className="image-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading next image...</p>
            </div>
          ) : !currentImage?.image_path ? (
            <div className="no-image">
              <h3>No Image Selected</h3>
              <p>Set an input folder to start processing images</p>
              {progress && progress.total_images === progress.processed_images && (
                <p style={{ color: '#27ae60', fontWeight: 'bold', marginTop: '10px' }}>
                  ✅ All images processed!
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="image-info">
                <h3>Current Image</h3>
                <p>Image {currentImage.index + 1} of {currentImage.total}</p>
                <p className="filename">{currentImage.image_path.split('/').pop()}</p>
              </div>
              
              <BoundingBoxEditor 
                imagePath={currentImage.image_path}
                detections={detections}
                categories={categories}
                onDetectionsChange={updateDetections}
                defaultCategory={getDefaultCategory()}
              />
            </>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="controls-section">
          {/* Folder Management */}
          <div className="control-group">
            <h3>📁 Folder Setup</h3>
            <div className="folder-input">
              <label>Input Folder:</label>
              <input 
                type="text" 
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/data/input"
              />
              <button onClick={handleSetFolder} disabled={loading}>
                {loading ? 'Loading...' : 'Set Folder'}
              </button>
            </div>
            
            {progress && (
              <div className="progress-info">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${progress.progress_percentage}%`}}
                  ></div>
                </div>
                <p className="progress-text">
                  {progress.processed_images} of {progress.total_images} images 
                  ({progress.progress_percentage.toFixed(1)}%)
                </p>
              </div>
            )}
          </div>

          {/* Version Information */}
          <div className="control-group version-info-group">
            <h3>ℹ️ Version Info</h3>
            <div className="version-details">
              <p><strong>Version:</strong> {APP_VERSION.version}</p>
              <p><strong>Build Date:</strong> {APP_VERSION.buildDate}</p>
              <div className="version-features">
                <strong>Recent Updates:</strong>
                <ul>
                  {APP_VERSION.releaseNotes.slice(0, 3).map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Category Management */}
          <div className="control-group">
            <h3>🏷️ Categories</h3>
            
            <div className="category-add">
              <input 
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add custom category"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button onClick={handleAddCategory}>Add</button>
            </div>

            <div className="categories-list">
              {categories.map(category => (
                <div key={category} className="category-item">
                  <span>{category}</span>
                  <button onClick={() => handleRemoveCategory(category)}>×</button>
                </div>
              ))}
            </div>
            
            {categories.length === 0 && (
              <p style={{ color: '#666', fontStyle: 'italic', fontSize: '12px', marginTop: '10px' }}>
                Categories will be automatically extracted when you set a folder
              </p>
            )}
          </div>

          {/* Directory Status */}
          <div className="control-group">
            <h3>📁 Directory Status</h3>
            <div className="directory-status">
              {Object.entries(directoryStatus).map(([path, status]) => (
                <div key={path} className={`status-item ${status}`}>
                  <span className="status-icon">
                    {status === 'writable' ? '✅' : status === 'exists_but_not_writable' ? '⚠️' : '❌'}
                  </span>
                  <span className="status-path">{path.split('/').pop()}</span>
                  <span className="status-text">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {currentImage?.image_path && (
            <div className="control-group">
              <h3>💾 Actions</h3>
              <div className="action-buttons">
                {(() => {
                  const detectionsWithoutCategory = detections.filter(detection => !detection.category || detection.category.trim() === '');
                  const canSave = detections.length > 0 && detectionsWithoutCategory.length === 0;
                  
                  return (
                    <button 
                      className="save-btn"
                      onClick={handleSaveImage} 
                      disabled={!canSave}
                      title={!canSave && detectionsWithoutCategory.length > 0 ? 
                        `${detectionsWithoutCategory.length} box(es) missing categories` : ''}
                    >
                      💾 Save Crops ({detections.length})
                      {detectionsWithoutCategory.length > 0 && ` - ${detectionsWithoutCategory.length} missing`}
                    </button>
                  );
                })()}
                
                <button onClick={() => handleSkipImage('poor_quality')} className="skip-btn">
                  🚫 Skip - Poor Quality
                </button>
                <button onClick={() => handleSkipImage('no_objects')} className="skip-btn">
                  👻 Skip - No Objects
                </button>
                <button onClick={() => handleSkipImage('user_skipped')} className="skip-btn">
                  ⏭️ Skip - Other
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}