// Version Configuration - Easy to find and change
export const APP_VERSION = {
  version: "1.3.0",
  buildDate: "2025-08-09",
  releaseNotes: [
    "Fixed bounding box resizing functionality",
    "Improved image progression after save/skip",
    "Enhanced WebP image support", 
    "Added single-window UI layout",
    "Implemented mandatory category validation",
    "Added ML detection with OwlViT model"
  ],
  features: [
    "AI Object Detection (OpenCV fallback)",
    "Manual bounding box creation and editing",
    "Category management with folder extraction",
    "WebP image format support",
    "Progress tracking and resume functionality",
    "Single-window interface design",
    "ML detection with OwlViT model"
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
