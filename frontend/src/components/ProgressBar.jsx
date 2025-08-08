import React from 'react';

export default function ProgressBar({ current, total, percentage }) {
  return (
    <div className="progress-container">
      <div className="progress-info">
        <span>{current} of {total} images processed</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}