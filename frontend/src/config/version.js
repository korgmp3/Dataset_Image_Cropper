// Version Configuration - Easy to find and change
export const APP_VERSION = {
  version: "1.2.3",
  buildDate: "2025-08-08",
  releaseNotes: [
    "Fixed bounding box resizing functionality",
    "Improved image progression after save/skip",
    "Enhanced WebP image support", 
    "Added single-window UI layout",
    "Implemented mandatory category validation"
  ],
  features: [
    "AI Object Detection (OpenCV fallback)",
    "Manual bounding box creation and editing",
    "Category management with folder extraction",
    "WebP image format support",
    "Progress tracking and resume functionality",
    "Single-window interface design"
  ]
};

// Helper function to get version info
export const getVersionInfo = () => {
  return {
    ...APP_VERSION,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
};
