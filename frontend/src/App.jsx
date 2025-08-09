import React, { useState, useEffect, useRef } from 'react';
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

  // Check if processing is complete
  const [isComplete, setIsComplete] = useState(false);
  const [showReportButton, setShowReportButton] = useState(false);

  // Add useRef to the imports at the top of the file
  const boundingBoxRef = useRef();

  useEffect(() => {
    loadCurrentImage();
    loadCategories();
    loadProgress();
    checkCompletion(); // Add this line
    
    // Auto-refresh progress and completion every 5 seconds
    const interval = setInterval(() => {
      loadProgress();
      checkCompletion(); // Add this line
    }, 5000);
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

  // Add state for selected box
  const [selectedBox, setSelectedBox] = useState(null);

  // Add function to handle box selection
  const handleSelectBox = (index) => {
    setSelectedBox(index);
  };

  // Add function to handle adding rectangles
  const handleAddRectangle = () => {
    if (!currentImage?.image_path) return;
    
    if (boundingBoxRef.current) {
      boundingBoxRef.current.addRectangle();
    }
  };

  // Add function to remove a box
  const handleRemoveBox = (indexToRemove) => {
    const updatedDetections = detections.filter((_, index) => index !== indexToRemove);
    setDetections(updatedDetections);
    
    // Adjust selected box if needed
    if (selectedBox === indexToRemove) {
      setSelectedBox(null);
    } else if (selectedBox > indexToRemove) {
      setSelectedBox(selectedBox - 1);
    }
    
    showToast(`🗑️ Removed Box ${indexToRemove + 1}`);
  };

  // Check if processing is complete
  const checkCompletion = async () => {
    try {
      const response = await fetch('/api/images/is-complete');
      const data = await response.json();
      setIsComplete(data.is_complete);
      setShowReportButton(data.is_complete);
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  // Generate and download report
  const generateReport = async () => {
    try {
      const response = await fetch('/api/images/generate-report');
      
      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'processing_report.csv';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('📊 Report downloaded successfully!');
      } else {
        showErrorToast('Error generating report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showErrorToast('Error generating report: ' + error.message);
    }
  };

  // Add debug function
  const debugStatus = async () => {
    try {
      const response = await fetch('/api/images/debug-status');
      const data = await response.json();
      console.log('DEBUG STATUS:', data);
      showToast('Debug info logged to console');
    } catch (error) {
      console.error('Error getting debug status:', error);
      showErrorToast('Error getting debug status');
    }
  };

  // Add reset function
  const resetSession = async () => {
    try {
      const response = await fetch('/api/images/reset-session', {
        method: 'POST'
      });
      
      if (response.ok) {
        showToast('🔄 Session reset successfully');
        // Reload current image and progress
        await loadCurrentImage();
        await loadProgress();
        await checkCompletion();
      } else {
        showErrorToast('Error resetting session');
      }
    } catch (error) {
      console.error('Error resetting session:', error);
      showErrorToast('Error resetting session: ' + error.message);
    }
  };

  // Add clear database function
  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all database data? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/images/clear-database', {
        method: 'POST'
      });
      
      if (response.ok) {
        showToast('🗑️ Database cleared successfully');
        // Reload everything
        await loadCurrentImage();
        await loadProgress();
        await checkCompletion();
      } else {
        showErrorToast('Error clearing database');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      showErrorToast('Error clearing database: ' + error.message);
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
      
      {/* Debug buttons */}
      <div className="debug-section">
        <button onClick={debugStatus} className="debug-btn">
          🔍 Debug Status
        </button>
        <button onClick={resetSession} className="reset-btn">
          🔄 Reset Session
        </button>
      </div>
      
      {/* Report Generation Button */}
      {showReportButton && (
        <div className="report-section">
          <div className="report-notification">
            <h3>✅ All Images Processed!</h3>
            <p>All images in the current folder have been processed.</p>
            <div className="report-buttons">
              <button 
                onClick={generateReport}
                className="generate-report-btn"
              >
                📊 Generate Processing Report
              </button>
              <button 
                onClick={resetSession}
                className="reset-session-btn"
              >
                🔄 Reset Session
              </button>
              <button 
                onClick={clearDatabase}
                className="clear-db-btn"
              >
                🗑️ Clear Database
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="main-layout">
        {/* Left side - Tools */}
        <div className="tools-section">
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
        </div>

        {/* Center - Image */}
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
            <BoundingBoxEditor 
              ref={boundingBoxRef}
              imagePath={currentImage.image_path}
              detections={detections}
              categories={categories}
              onDetectionsChange={updateDetections}
              defaultCategory={getDefaultCategory()}
              selectedBox={selectedBox}
              onSelectBox={handleSelectBox}
            />
          )}
        </div>

        {/* Right side - Info & Actions */}
        <div className="actions-section">
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

          {/* Detection Controls */}
          {currentImage?.image_path && (
            <div className="control-group">
              <h3>🧠 Detection Controls</h3>
              <div className="detection-controls">
                <button 
                  onClick={handleAddRectangle}
                  className="add-rectangle-btn"
                >
                  ➕ Add Rectangle
                </button>
                
                <div className="box-selection">
                  {detections.map((detection, index) => (
                    <div key={index} className="box-item">
                      <button
                        onClick={() => handleSelectBox(index)}
                        className={`box-btn ${selectedBox === index ? 'selected' : ''}`}
                      >
                        Box {index + 1}
                      </button>
                      <button
                        onClick={() => handleRemoveBox(index)}
                        className="remove-box-btn"
                        title={`Remove Box ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Image Info */}
          {currentImage?.image_path && (
            <div className="control-group">
              <h3>📷 Current Image</h3>
              <div className="image-info">
                <p><strong>Image:</strong> {currentImage.index + 1} of {currentImage.total}</p>
                <p className="filename">{currentImage.image_path}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}