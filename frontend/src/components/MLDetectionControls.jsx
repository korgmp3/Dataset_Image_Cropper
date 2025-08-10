import React, { useState, useEffect } from 'react';
import { getMlStatus, detectObjects, parseTextQueries, createDefaultQueries } from '../services/mlApi';

const MLDetectionControls = ({ 
  categories, 
  currentImage, 
  onDetectionsChange, 
  confidence,
  setConfidence,
  showToast,
  showErrorToast,
  autoDetectionEnabled,
  setAutoDetectionEnabled,
  onAutoDetectionTrigger
}) => {
  const [mlEnabled, setMlEnabled] = useState(false);
  const [mlAvailable, setMlAvailable] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textQueries, setTextQueries] = useState('');

  useEffect(() => {
    checkMlStatus();
  }, []);

  useEffect(() => {
    // Update text queries when categories change
    if (categories && categories.length > 0) {
      const defaultQueries = createDefaultQueries(categories);
      setTextQueries(defaultQueries.join('\n'));
    }
  }, [categories]);

  const checkMlStatus = async () => {
    try {
      const status = await getMlStatus();
      setMlEnabled(status.ml_enabled);
      setMlAvailable(status.ml_available);
      setDeviceInfo(status.device_info);
      
      if (status.ml_available) {
        showToast('🤖 ML object detection available', 'info');
      }
    } catch (error) {
      console.error('Error checking ML status:', error);
      setMlEnabled(false);
      setMlAvailable(false);
    }
  };

  const handleDetection = async () => {
    if (!currentImage?.image_path) {
      showErrorToast('No image loaded');
      return;
    }

    if (!textQueries.trim()) {
      showErrorToast('Please enter objects to detect');
      return;
    }

    setLoading(true);
    try {
      const queries = parseTextQueries(textQueries);
      
      if (queries.length === 0) {
        showErrorToast('Please enter valid object descriptions');
        return;
      }

      showToast(`🔍 Detecting objects: ${queries.join(', ')}`, 'info');

      const result = await detectObjects(
        currentImage.image_path,
        queries,
        confidence
      );

      if (result.success && result.detections) {
        onDetectionsChange(result.detections);
        showToast(
          `🎯 Detected ${result.detections.length} objects`,
          result.detections.length > 0 ? 'success' : 'info'
        );
      } else {
        showToast('No objects detected', 'info');
        onDetectionsChange([]);
      }
    } catch (error) {
      console.error('Detection error:', error);
      showErrorToast('Detection failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetQueries = () => {
    const defaultQueries = createDefaultQueries(categories);
    setTextQueries(defaultQueries.join('\n'));
  };

  // Don't render if ML is not enabled
  if (!mlEnabled) {
    return null;
  }

  return (
    <div className="control-group ml-detection-controls">
      <h3>🤖 AI Object Detection</h3>
      
      {/* ML Status */}
      <div className="ml-status">
        <div className={`status-indicator ${mlAvailable ? 'available' : 'unavailable'}`}>
          {mlAvailable ? '✅ ML Available' : '❌ ML Unavailable'}
        </div>
        {deviceInfo && (
          <div className="device-info">
            <small>Device: {deviceInfo.device}</small>
          </div>
        )}
      </div>

      {mlAvailable && (
        <>
          {/* Detection Toggle */}
          <div className="detection-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoDetectionEnabled}
                onChange={(e) => setAutoDetectionEnabled(e.target.checked)}
              />
              <span className="toggle-slider">
                <span className="toggle-label">
                  {autoDetectionEnabled ? 'Auto-detection ON' : 'Auto-detection OFF'}
                </span>
              </span>
            </label>
          </div>

          {/* Manual Detection Button */}
          <div className="detection-action">
            <button
              onClick={handleDetection}
              disabled={loading || !currentImage?.image_path}
              className="detect-btn"
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  Detecting...
                </>
              ) : (
                '🎯 Detect Objects Manually'
              )}
            </button>
          </div>

          {/* Object Detection Prompt */}
          <div className="detection-prompt">
            <label>Objects to Detect:</label>
            <textarea
              value={textQueries}
              onChange={(e) => setTextQueries(e.target.value)}
              placeholder="Enter objects to detect (one per line)&#10;Example:&#10;a cat&#10;a dog&#10;a person"
              rows={6}
              className="detection-textarea"
            />
            <div className="prompt-controls">
              <button
                onClick={resetQueries}
                className="reset-queries-btn"
                type="button"
              >
                🔄 Reset to Categories
              </button>
              <small className="hint">
                One object per line. Use "a cat", "a dog" format for best results.
              </small>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="confidence-control">
            <label>
              Confidence Threshold: {(confidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.01"
              max="0.95"
              step="0.01"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="confidence-slider"
            />
            <div className="confidence-labels">
              <span>Low (1%)</span>
              <span>High (95%)</span>
            </div>
          </div>

          {/* Auto-detection Notice */}
          {autoDetectionEnabled && (
            <div className="auto-detection-notice">
              <p>
                <strong>Auto-detection enabled:</strong> Objects will be automatically 
                detected when a new image loads using the categories above.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MLDetectionControls;
