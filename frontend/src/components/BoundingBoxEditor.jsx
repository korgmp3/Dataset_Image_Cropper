import React, { useState, useRef, useEffect } from 'react';

export default function BoundingBoxEditor({ 
  imagePath, 
  detections, 
  categories, 
  onDetectionsChange, 
  defaultCategory,
  selectedBox,
  onSelectBox,
  onAddRectangle
}) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
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

  // Add global mouse event listeners for better resize control
  useEffect(() => {
    const handleGlobalMouseMove = (event) => {
      if (isResizing || isDragging) {
        handleMouseMove(event);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isResizing || isDragging) {
        handleMouseUp();
      }
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing, isDragging]);

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
    onSelectBox(0); // Select the default rectangle
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    
    // Fixed dimensions for the center panel
    const maxWidth = 560; // Fixed width for canvas (600px - 40px padding)
    const maxHeight = 600; // Fixed max height
    
    let canvasWidth = image.width;
    let canvasHeight = image.height;
    
    // Calculate the scale to fit within max dimensions while maintaining aspect ratio
    const scaleX = maxWidth / canvasWidth;
    const scaleY = maxHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    canvasWidth = Math.round(canvasWidth * scale);
    canvasHeight = Math.round(canvasHeight * scale);
    
    // Set canvas resolution (this is the actual canvas size)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Set display size (this is what the user sees)
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

  const getMousePos = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Get raw mouse coordinates relative to canvas element
    let clientX = event.clientX - rect.left;
    let clientY = event.clientY - rect.top;
    
    // Clamp coordinates to canvas bounds to prevent going outside
    clientX = Math.max(0, Math.min(rect.width, clientX));
    clientY = Math.max(0, Math.min(rect.height, clientY));
    
    // Scale coordinates to match canvas resolution
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
    const handleSize = 16; // Increased handle size for easier targeting
    
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
        onSelectBox(i);
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
    onSelectBox(null);
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
      
      // Clamp mouse coordinates to image bounds
      const clampedMouseX = Math.max(0, Math.min(image.width, mouseXImg));
      const clampedMouseY = Math.max(0, Math.min(image.height, mouseYImg));
      
      const newDetection = { ...originalDetection };
      
      // Calculate based on original detection bounds
      const originalLeft = originalDetection.x - originalDetection.width/2;
      const originalRight = originalDetection.x + originalDetection.width/2;
      const originalTop = originalDetection.y - originalDetection.height/2;
      const originalBottom = originalDetection.y + originalDetection.height/2;
      
      switch (resizeHandle) {
        case 'top-left':
          newDetection.width = Math.max(20, originalRight - clampedMouseX);
          newDetection.height = Math.max(20, originalBottom - clampedMouseY);
          newDetection.x = clampedMouseX + newDetection.width/2;
          newDetection.y = clampedMouseY + newDetection.height/2;
          break;
        case 'top-right':
          newDetection.width = Math.max(20, clampedMouseX - originalLeft);
          newDetection.height = Math.max(20, originalBottom - clampedMouseY);
          newDetection.x = originalLeft + newDetection.width/2;
          newDetection.y = clampedMouseY + newDetection.height/2;
          break;
        case 'bottom-left':
          newDetection.width = Math.max(20, originalRight - clampedMouseX);
          newDetection.height = Math.max(20, clampedMouseY - originalTop);
          newDetection.x = clampedMouseX + newDetection.width/2;
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'bottom-right':
          newDetection.width = Math.max(20, clampedMouseX - originalLeft);
          newDetection.height = Math.max(20, clampedMouseY - originalTop);
          newDetection.x = originalLeft + newDetection.width/2;
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'top':
          newDetection.height = Math.max(20, originalBottom - clampedMouseY);
          newDetection.y = clampedMouseY + newDetection.height/2;
          break;
        case 'bottom':
          newDetection.height = Math.max(20, clampedMouseY - originalTop);
          newDetection.y = originalTop + newDetection.height/2;
          break;
        case 'left':
          newDetection.width = Math.max(20, originalRight - clampedMouseX);
          newDetection.x = clampedMouseX + newDetection.width/2;
          break;
        case 'right':
          newDetection.width = Math.max(20, clampedMouseX - originalLeft);
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
        // Check if mouse is over any box
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
    onSelectBox(null);
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
    onSelectBox(updatedDetections.length - 1);
  };

  const selectBox = (index) => {
    onSelectBox(index);
  };

  return (
    <div className="bounding-box-editor">
      {!image ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading image...</p>
        </div>
      ) : (
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
                  selectBox(index);
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
      )}
    </div>
  );
}