import React, { useState, useRef, useEffect } from 'react';

export default function BoundingBoxEditor({ imagePath, detections, categories, onDetectionsChange, defaultCategory }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  useEffect(() => {
    loadImage();
  }, [imagePath]);

  useEffect(() => {
    drawCanvas();
  }, [image, detections, selectedBox]);

  // Add effect to create default rectangle when image loads
  useEffect(() => {
    if (image && detections.length === 0) {
      createDefaultRectangle();
    }
  }, [image, detections.length]);

  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
    };
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      // Try the converted endpoint as fallback
      if (!img.src.includes('serve-converted')) {
        img.src = `/api/images/serve-converted?path=${encodeURIComponent(imagePath)}`;
      }
    };
    
    // Use converted endpoint for WebP files
    const endpoint = imagePath.toLowerCase().endsWith('.webp') ? 'serve-converted' : 'serve';
    img.src = `/api/images/${endpoint}?path=${encodeURIComponent(imagePath)}`;
  };

  // Function to create default rectangle
  const createDefaultRectangle = () => {
    if (!image) return;
    
    const defaultDetection = {
      x: image.width / 2, // Center X
      y: image.height / 2, // Center Y
      width: image.width / 2, // Half width
      height: image.height / 2, // Half height
      confidence: 1.0,
      class_name: "default",
      category: defaultCategory || null
    };
    
    onDetectionsChange([defaultDetection]);
    setSelectedBox(0); // Select the default rectangle
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions to maintain aspect ratio
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = window.innerHeight - 300;
    
    let canvasWidth = image.width;
    let canvasHeight = image.height;
    
    if (canvasWidth > maxWidth) {
      const ratio = maxWidth / canvasWidth;
      canvasWidth = maxWidth;
      canvasHeight = canvasHeight * ratio;
    }
    
    if (canvasHeight > maxHeight) {
      const ratio = maxHeight / canvasHeight;
      canvasHeight = maxHeight;
      canvasWidth = canvasWidth * ratio;
    }
    
    // Set both canvas resolution and display size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    detections.forEach((detection, index) => {
      const x = (detection.x / image.width) * canvas.width;
      const y = (detection.y / image.height) * canvas.height;
      const boxWidth = (detection.width / image.width) * canvas.width;
      const boxHeight = (detection.height / image.height) * canvas.height;

      // Box color and style based on selection
      if (selectedBox === index) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        // Add selection highlight
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        
        // Draw resize handles for selected box
        drawResizeHandles(ctx, x, y, boxWidth, boxHeight);
      } else {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
      }
      
      ctx.strokeRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);

      // Draw dimensions near the bottom-right of the box
      const dimensionText = `${Math.round(detection.width)} × ${Math.round(detection.height)}`;
      ctx.font = '12px Arial';
      const textMetrics = ctx.measureText(dimensionText);
      const textWidth = textMetrics.width;
      
      // Position dimensions outside the box (bottom-right corner)
      const dimX = x + boxWidth/2 + 5;
      const dimY = y + boxHeight/2 + 15;
      
      // Draw background for dimensions
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(dimX - 2, dimY - 12, textWidth + 4, 16);
      
      // Draw dimensions text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dimensionText, dimX, dimY);

      // Draw category label (top of box)
      if (detection.category) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(x - boxWidth/2, y - boxHeight/2 - 25, 120, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(detection.category, x - boxWidth/2 + 5, y - boxHeight/2 - 10);
      }
    });
  };

  const drawResizeHandles = (ctx, centerX, centerY, boxWidth, boxHeight) => {
    const handleSize = 12;
    const left = centerX - boxWidth/2;
    const right = centerX + boxWidth/2;
    const top = centerY - boxHeight/2;
    const bottom = centerY + boxHeight/2;

    ctx.fillStyle = '#ff0000';
    
    // Corner handles
    ctx.fillRect(left - handleSize/2, top - handleSize/2, handleSize, handleSize);
    ctx.fillRect(right - handleSize/2, top - handleSize/2, handleSize, handleSize);
    ctx.fillRect(left - handleSize/2, bottom - handleSize/2, handleSize, handleSize);
    ctx.fillRect(right - handleSize/2, bottom - handleSize/2, handleSize, handleSize);
    
    // Edge handles
    ctx.fillRect(centerX - handleSize/2, top - handleSize/2, handleSize, handleSize);
    ctx.fillRect(centerX - handleSize/2, bottom - handleSize/2, handleSize, handleSize);
    ctx.fillRect(left - handleSize/2, centerY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(right - handleSize/2, centerY - handleSize/2, handleSize, handleSize);
  };

  // FIXED: Proper coordinate conversion accounting for canvas scaling
  const getMousePos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get raw mouse coordinates relative to canvas element
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    
    // Scale coordinates to match canvas resolution
    // This accounts for any difference between display size and canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: clientX * scaleX,
      y: clientY * scaleY
    };
  };

  const getResizeHandle = (mouseX, mouseY) => {
    if (selectedBox === null) return null;
    
    const canvas = canvasRef.current;
    const detection = detections[selectedBox];
    const x = (detection.x / image.width) * canvas.width;
    const y = (detection.y / image.height) * canvas.height;
    const boxWidth = (detection.width / image.width) * canvas.width;
    const boxHeight = (detection.height / image.height) * canvas.height;
    
    const left = x - boxWidth/2;
    const right = x + boxWidth/2;
    const top = y - boxHeight/2;
    const bottom = y + boxHeight/2;
    const handleSize = 12;
    
    // Check corner handles first (higher priority)
    if (Math.abs(mouseX - left) <= handleSize/2 && Math.abs(mouseY - top) <= handleSize/2) return 'top-left';
    if (Math.abs(mouseX - right) <= handleSize/2 && Math.abs(mouseY - top) <= handleSize/2) return 'top-right';
    if (Math.abs(mouseX - left) <= handleSize/2 && Math.abs(mouseY - bottom) <= handleSize/2) return 'bottom-left';
    if (Math.abs(mouseX - right) <= handleSize/2 && Math.abs(mouseY - bottom) <= handleSize/2) return 'bottom-right';
    
    // Check edge handles
    if (Math.abs(mouseX - x) <= handleSize/2 && Math.abs(mouseY - top) <= handleSize/2) return 'top';
    if (Math.abs(mouseX - x) <= handleSize/2 && Math.abs(mouseY - bottom) <= handleSize/2) return 'bottom';
    if (Math.abs(mouseX - left) <= handleSize/2 && Math.abs(mouseY - y) <= handleSize/2) return 'left';
    if (Math.abs(mouseX - right) <= handleSize/2 && Math.abs(mouseY - y) <= handleSize/2) return 'right';
    
    return null;
  };

  const isPointInBox = (mouseX, mouseY, boxIndex) => {
    const canvas = canvasRef.current;
    const detection = detections[boxIndex];
    const boxCenterX = (detection.x / image.width) * canvas.width;
    const boxCenterY = (detection.y / image.height) * canvas.height;
    const boxWidth = (detection.width / image.width) * canvas.width;
    const boxHeight = (detection.height / image.height) * canvas.height;

    const boxLeft = boxCenterX - boxWidth/2;
    const boxRight = boxCenterX + boxWidth/2;
    const boxTop = boxCenterY - boxHeight/2;
    const boxBottom = boxCenterY + boxHeight/2;

    return mouseX >= boxLeft && mouseX <= boxRight && 
           mouseY >= boxTop && mouseY <= boxBottom;
  };

  const handleMouseDown = (event) => {
    const pos = getMousePos(event);
    
    // Check for resize handles first
    const handle = getResizeHandle(pos.x, pos.y);
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      // Store the initial detection state and mouse position
      setDragStart({
        detection: { ...detections[selectedBox] },
        mousePos: pos
      });
      return;
    }
    
    // Check if clicking on a box
    for (let i = 0; i < detections.length; i++) {
      if (isPointInBox(pos.x, pos.y, i)) {
        setSelectedBox(i);
        setIsDragging(true);
        // Store both detection and mouse position for consistent reference
        setDragStart({
          detection: { ...detections[i] },
          mousePos: pos
        });
        return;
      }
    }
    
    // Clicked on empty space
    setSelectedBox(null);
  };

  const handleMouseMove = (event) => {
    const pos = getMousePos(event);
    const canvas = canvasRef.current;
    
    if (isResizing && selectedBox !== null && dragStart) {
      // Handle resizing - use original detection as reference
      const originalDetection = dragStart.detection;
      const updatedDetections = [...detections];
      
      // Convert current mouse position to image coordinates
      const mouseXImg = (pos.x / canvas.width) * image.width;
      const mouseYImg = (pos.y / canvas.height) * image.height;
      
      const newDetection = { ...originalDetection };
      
      // Calculate based on original detection bounds
      const originalLeft = originalDetection.x - originalDetection.width/2;
      const originalRight = originalDetection.x + originalDetection.width/2;
      const originalTop = originalDetection.y - originalDetection.height/2;
      const originalBottom = originalDetection.y + originalDetection.height/2;
      
      switch (resizeHandle) {
        case 'top-left':
          newDetection.width = Math.max(20, originalRight - mouseXImg);
          newDetection.height = Math.max(20, originalBottom - mouseYImg);
          newDetection.x = mouseXImg + newDetection.width/2;
          newDetection.y = mouseYImg + newDetection.height/2;
          break;
        case 'top-right':
          newDetection.width = Math.max(20, mouseXImg - originalLeft);
          newDetection.height = Math.max(20, originalBottom - mouseYImg);
          newDetection.x = originalLeft + newDetection.width/2;
          newDetection.y = mouseYImg + newDetection.height/2;
          break;
        case 'bottom-left':
          newDetection.width = Math.max(20, originalRight - mouseXImg);
          newDetection.height = Math.max(20, mouseYImg - originalTop);
          newDetection.x = mouseXImg + newDetection.width/2;
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'bottom-right':
          newDetection.width = Math.max(20, mouseXImg - originalLeft);
          newDetection.height = Math.max(20, mouseYImg - originalTop);
          newDetection.x = originalLeft + newDetection.width/2;
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'top':
          newDetection.height = Math.max(20, originalBottom - mouseYImg);
          newDetection.y = mouseYImg + newDetection.height/2;
          break;
        case 'bottom':
          newDetection.height = Math.max(20, mouseYImg - originalTop);
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'left':
          newDetection.width = Math.max(20, originalRight - mouseXImg);
          newDetection.x = mouseXImg + newDetection.width/2;
          break;
        case 'right':
          newDetection.width = Math.max(20, mouseXImg - originalLeft);
          newDetection.x = originalLeft + newDetection.width/2;
          break;
      }
      
      // Ensure box stays within image bounds
      newDetection.x = Math.max(newDetection.width/2, Math.min(image.width - newDetection.width/2, newDetection.x));
      newDetection.y = Math.max(newDetection.height/2, Math.min(image.height - newDetection.height/2, newDetection.y));
      
      updatedDetections[selectedBox] = newDetection;
      onDetectionsChange(updatedDetections);
      
    } else if (isDragging && selectedBox !== null && dragStart) {
      // Handle dragging - calculate delta from original position
      const updatedDetections = [...detections];
      
      // Calculate delta in canvas coordinates, then convert to image coordinates
      const canvasDeltaX = pos.x - dragStart.mousePos.x;
      const canvasDeltaY = pos.y - dragStart.mousePos.y;
      
      const imageDeltaX = canvasDeltaX * (image.width / canvas.width);
      const imageDeltaY = canvasDeltaY * (image.height / canvas.height);
      
      // Apply delta to original detection position
      const newDetection = { ...dragStart.detection };
      newDetection.x = dragStart.detection.x + imageDeltaX;
      newDetection.y = dragStart.detection.y + imageDeltaY;
      
      // Ensure box stays within image bounds
      newDetection.x = Math.max(newDetection.width/2, Math.min(image.width - newDetection.width/2, newDetection.x));
      newDetection.y = Math.max(newDetection.height/2, Math.min(image.height - newDetection.height/2, newDetection.y));
      
      updatedDetections[selectedBox] = newDetection;
      onDetectionsChange(updatedDetections);
      
    } else {
      // Update cursor based on what's under mouse
      const handle = getResizeHandle(pos.x, pos.y);
      if (handle) {
        canvas.style.cursor = getCursorForHandle(handle);
      } else {
        // Check if over a box
        let overBox = false;
        for (let i = 0; i < detections.length; i++) {
          if (isPointInBox(pos.x, pos.y, i)) {
            overBox = true;
            break;
          }
        }
        canvas.style.cursor = overBox ? 'move' : 'default';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
  };

  const getCursorForHandle = (handle) => {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'nw-resize';
      case 'top-right':
      case 'bottom-left':
        return 'ne-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'left':
      case 'right':
        return 'ew-resize';
      default:
        return 'default';
    }
  };

  const updateDetectionCategory = (index, category) => {
    const updatedDetections = [...detections];
    updatedDetections[index].category = category;
    onDetectionsChange(updatedDetections);
  };

  const removeDetection = (index) => {
    const updatedDetections = detections.filter((_, i) => i !== index);
    onDetectionsChange(updatedDetections);
    setSelectedBox(null);
  };

  const addManualRectangle = () => {
    if (!image) return;
    
    const newDetection = {
      x: image.width / 2,
      y: image.height / 2,
      width: Math.min(150, image.width / 4),
      height: Math.min(150, image.height / 4),
      confidence: 1.0,
      class_name: "manual",
      category: defaultCategory || null
    };
    
    const updatedDetections = [...detections, newDetection];
    onDetectionsChange(updatedDetections);
    setSelectedBox(updatedDetections.length - 1);
  };

  const selectBox = (index) => {
    setSelectedBox(index);
  };

  return (
    <div className="bounding-box-editor">
      {!image ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading image...</p>
        </div>
      ) : (
        <>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            📝 <strong>Instructions:</strong> Click to select • Drag to move • Drag handles to resize • Click inside rectangle to change category
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas 
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ 
                cursor: 'default',
                border: '2px solid #dee2e6',
                borderRadius: '4px',
                display: 'block',
                margin: '0 auto'
              }}
            />
            
            {/* Floating category dropdowns inside rectangles */}
            {image && detections.map((detection, index) => {
              const canvas = canvasRef.current;
              if (!canvas) return null;
              
              const x = (detection.x / image.width) * canvas.width;
              const y = (detection.y / image.height) * canvas.height;
              const boxWidth = (detection.width / image.width) * canvas.width;
              const boxHeight = (detection.height / image.height) * canvas.height;
              
              // Center the dropdown in the rectangle
              const dropdownX = x - 60; // Half of dropdown width (120px)
              const dropdownY = y - 12; // Half of dropdown height (24px)
              
              return (
                <select
                  key={index}
                  className="floating-category-dropdown"
                  value={detection.category || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateDetectionCategory(index, e.target.value);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBox(index);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${dropdownX}px`,
                    top: `${dropdownY}px`,
                    width: '120px',
                    height: '24px',
                    pointerEvents: 'auto'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              );
            })}
          </div>
        </>
      )}
      
      <div className="detection-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4>Objects ({detections.length})</h4>
          {image && (
            <button 
              onClick={addManualRectangle}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              + Add Rectangle
            </button>
          )}
        </div>
        
        {detections.map((detection, index) => {
          const hasCategory = detection.category && detection.category.trim() !== '';
          return (
            <div 
              key={index} 
              className={`detection-item ${selectedBox === index ? 'selected' : ''} ${!hasCategory ? 'missing-category' : ''}`}
              style={{
                backgroundColor: selectedBox === index ? '#e3f2fd' : (!hasCategory ? '#ffebee' : 'white'),
                border: selectedBox === index ? '2px solid #2196f3' : (!hasCategory ? '2px solid #f44336' : '1px solid #ddd'),
                padding: '10px',
                margin: '5px 0',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => selectBox(index)}
            >
              <div style={{ marginBottom: '5px' }}>
                <strong>Box #{index + 1}</strong> - {detection.class_name} ({(detection.confidence * 100).toFixed(1)}%)
                {!hasCategory && <span style={{ color: '#f44336', marginLeft: '10px' }}>⚠️ Category Required</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                Size: {Math.round(detection.width)} × {Math.round(detection.height)}px
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={detection.category || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateDetectionCategory(index, e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: '5px',
                    borderRadius: '4px',
                    border: !hasCategory ? '2px solid #f44336' : '1px solid #ddd',
                    backgroundColor: !hasCategory ? '#ffebee' : 'white'
                  }}
                >
                  <option value="">Select Category *</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDetection(index);
                  }}
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
              
              {!hasCategory && (
                <div className="category-warning" style={{ color: '#f44336', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>
                  ⚠️ Category assignment is required before saving
                </div>
              )}
            </div>
          );
        })}
        
        {detections.length === 0 && (
          <div style={{ 
            color: '#666', 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '4px',
            margin: '10px 0'
          }}>
            <p>No objects detected.</p>
            <p>Click "Add Rectangle" to create manual bounding boxes.</p>
          </div>
        )}
      </div>
    </div>
  );
}