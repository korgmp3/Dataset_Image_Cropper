import React, { useState, useEffect } from 'react';
import { setImageFolder, getProgress } from '../services/api';

export default function Dashboard() {
  const [folderPath, setFolderPath] = useState('/data/input');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSetFolder = async () => {
    setLoading(true);
    try {
      const result = await setImageFolder(folderPath);
      alert(result.message);
      loadProgress();
    } catch (error) {
      alert('Error setting folder: ' + error.message);
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

  useEffect(() => {
    loadProgress();
    const interval = setInterval(loadProgress, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h2>Project Dashboard</h2>
      
      <div className="folder-selection">
        <label>
          Input Folder Path:
          <input 
            type="text" 
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="/path/to/your/images"
          />
        </label>
        <button onClick={handleSetFolder} disabled={loading}>
          {loading ? 'Loading...' : 'Set Folder'}
        </button>
      </div>

      {progress && (
        <div className="progress-info">
          <h3>Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{width: `${progress.progress_percentage}%`}}
            ></div>
          </div>
          <p>
            {progress.processed_images} of {progress.total_images} images processed 
            ({progress.progress_percentage.toFixed(1)}%)
          </p>
          {progress.current_image && (
            <p>Current: {progress.current_image.split('/').pop()}</p>
          )}
        </div>
      )}
    </div>
  );
}