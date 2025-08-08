import React, { useState, useEffect } from 'react';
import { getSettings, setConfidence } from '../services/api';

export default function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [confidence, setConfidenceValue] = useState(0.25);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await getSettings();
      setSettings(settingsData);
      setConfidenceValue(settingsData.confidence_threshold);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleConfidenceChange = async (newConfidence) => {
    setLoading(true);
    try {
      await setConfidence(newConfidence);
      setConfidenceValue(newConfidence);
      alert('Confidence threshold updated successfully');
    } catch (error) {
      alert('Error updating confidence: ' + error.message);
    }
    setLoading(false);
  };

  if (!settings) {
    return <div className="settings-panel">Loading settings...</div>;
  }

  return (
    <div className="settings-panel">
      <h2>Application Settings</h2>
      
      <div className="setting-group">
        <h3>Object Detection</h3>
        <div className="setting-item">
          <label>
            Detection Confidence Threshold: {confidence.toFixed(2)}
            <input 
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidenceValue(parseFloat(e.target.value))}
              disabled={loading}
            />
          </label>
          <button 
            onClick={() => handleConfidenceChange(confidence)}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Apply'}
          </button>
        </div>
        
        <div className="setting-item">
          <label>Detection Model:</label>
          <span>{settings.model_name}</span>
        </div>
      </div>

      <div className="setting-group">
        <h3>Supported Image Formats</h3>
        <div className="format-list">
          {settings.supported_formats.map(format => (
            <span key={format} className="format-tag">{format}</span>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>Usage Instructions</h3>
        <ol>
          <li>Set up your input folder with images organized in category subfolders</li>
          <li>Use the Dashboard to select your input folder</li>
          <li>Manage categories in the Categories tab</li>
          <li>Process images one by one in the Image Processor</li>
          <li>Adjust bounding boxes and assign categories</li>
          <li>Save cropped images to create your dataset</li>
        </ol>
      </div>
    </div>
  );
}