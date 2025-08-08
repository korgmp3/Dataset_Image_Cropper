import React, { useState, useEffect } from 'react';
import { getCurrentImage, detectObjects, cropAndSave, skipImage, getCategories } from '../services/api';
import BoundingBoxEditor from './BoundingBoxEditor';

export default function ImageProcessor() {
  const [currentImage, setCurrentImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0.25);

  useEffect(() => {
    loadCurrentImage();
    loadCategories();
  }, []);

  const loadCurrentImage = async () => {
    setLoading(true);
    try {
      console.log('=== LOADING CURRENT IMAGE ===');
      const image = await getCurrentImage();
      console.log('Current image response:', image);
      setCurrentImage(image);
      if (image.image_path) {
        console.log('Image path to load:', image.image_path);
        runDetection(image.image_path);
      }
    } catch (error) {
      console.error('Error loading current image:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const runDetection = async (imagePath) => {
    setLoading(true);
    try {
      // Create a File object from the image path for detection
      const response = await fetch(`/api/images/file?path=${encodeURIComponent(imagePath)}`);
      const blob = await response.blob();
      const file = new File([blob], imagePath.split('/').pop());
      
      const result = await detectObjects(file, confidence);
      const defaultCat = getDefaultCategory();
      
      // Set default category for all detections
      const detectionsWithDefaults = (result.detections || []).map(detection => ({
        ...detection,
        category: detection.category || defaultCat
      }));
      
      setDetections(detectionsWithDefaults);
    } catch (error) {
      console.error('Error running detection:', error);
      setDetections([]);
    }
    setLoading(false);
  };

  const handleSaveImage = async () => {
    if (!currentImage?.image_path) {
      alert('No image loaded');
      return;
    }

    if (detections.length === 0) {
      const proceed = confirm('No objects detected or created. Skip this image?');
      if (proceed) {
        await handleSkipImage('no_objects');
        return;
      } else {
        return;
      }
    }

    // Validate that all detections have categories assigned
    const detectionsWithoutCategory = detections.filter(detection => !detection.category || detection.category.trim() === '');
    
    if (detectionsWithoutCategory.length > 0) {
      alert(`Please assign categories to all bounding boxes before saving.\n${detectionsWithoutCategory.length} box(es) missing categories.`);
      return;
    }

    // Validate that at least one detection has a valid category
    const validDetections = detections.filter(detection => detection.category && detection.category.trim() !== '');
    
    if (validDetections.length === 0) {
      alert('Please assign at least one valid category before saving.');
      return;
    }

    try {
      await cropAndSave({
        image_path: currentImage.image_path,
        boxes: validDetections, // Only send detections with categories
        categories: categories
      });
      
      alert(`Image processed successfully! Saved ${validDetections.length} cropped image(s).`);
      loadCurrentImage(); // Load next image
    } catch (error) {
      alert('Error saving image: ' + error.message);
    }
  };

  const handleSkipImage = async (reason = 'user_skipped') => {
    if (!currentImage?.image_path) return;

    try {
      await skipImage(currentImage.image_path, reason);
      loadCurrentImage(); // Load next image
    } catch (error) {
      alert('Error skipping image: ' + error.message);
    }
  };

  const updateDetections = (newDetections) => {
    setDetections(newDetections);
  };

  // Extract default category from input folder path
  const getDefaultCategory = () => {
    if (!currentImage?.image_path) return null;
    
    // Extract folder name from path like "/data/input/category_name/image.jpg"
    const pathParts = currentImage.image_path.split('/');
    const inputFolderIndex = pathParts.indexOf('input');
    
    if (inputFolderIndex >= 0 && inputFolderIndex < pathParts.length - 2) {
      const folderName = pathParts[inputFolderIndex + 1];
      // Check if this folder name exists in our categories
      if (categories.includes(folderName)) {
        return folderName;
      }
    }
    
    return null;
  };

  if (!currentImage?.image_path) {
    return (
      <div className="image-processor">
        <h2>Image Processing</h2>
        <p>No more images to process or no folder selected.</p>
      </div>
    );
  }

  return (
    <div className="image-processor">
      <h2>Image Processing</h2>
      
      <div className="image-info">
        <p>Image {currentImage.index + 1} of {currentImage.total}</p>
        <p>{currentImage.image_path.split('/').pop()}</p>
      </div>

      <div className="controls">
        <label>
          Detection Confidence:
          <input 
            type="range" 
            min="0.1" 
            max="0.9" 
            step="0.05"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
          />
          {confidence}
        </label>
        <button onClick={() => runDetection(currentImage.image_path)} disabled={loading}>
          {loading ? 'Detecting...' : 'Re-run Detection'}
        </button>
      </div>

      <BoundingBoxEditor 
        imagePath={currentImage.image_path}
        detections={detections}
        categories={categories}
        onDetectionsChange={updateDetections}
        defaultCategory={getDefaultCategory()}
      />

      <div className="action-buttons">
        {(() => {
          const detectionsWithoutCategory = detections.filter(detection => !detection.category || detection.category.trim() === '');
          const canSave = detections.length > 0 && detectionsWithoutCategory.length === 0;
          
          return (
            <button 
              onClick={handleSaveImage} 
              disabled={!canSave}
              style={{
                backgroundColor: canSave ? '#27ae60' : '#bdc3c7',
                color: 'white',
                cursor: canSave ? 'pointer' : 'not-allowed'
              }}
              title={!canSave && detectionsWithoutCategory.length > 0 ? 
                `${detectionsWithoutCategory.length} box(es) missing categories` : ''}
            >
              Save Crops ({detections.length})
              {detectionsWithoutCategory.length > 0 && ` - ${detectionsWithoutCategory.length} missing categories`}
            </button>
          );
        })()}
        
        <button onClick={() => handleSkipImage('poor_quality')}>
          Skip - Poor Quality
        </button>
        <button onClick={() => handleSkipImage('no_objects')}>
          Skip - No Objects
        </button>
        <button onClick={() => handleSkipImage('user_skipped')}>
          Skip - Other
        </button>
      </div>
    </div>
  );
}