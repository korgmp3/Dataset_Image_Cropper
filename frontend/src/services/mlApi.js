// ML Detection API functions

const API_BASE = '/api/ml';

/**
 * Check ML status and availability
 */
export const getMlStatus = async () => {
  const response = await fetch(`${API_BASE}/status`);
  if (!response.ok) {
    throw new Error('Failed to get ML status');
  }
  return response.json();
};

/**
 * Detect objects in an image using text queries
 */
export const detectObjects = async (imagePath, textQueries, confidenceThreshold = 0.1) => {
  const response = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_path: imagePath,
      text_queries: textQueries,
      confidence_threshold: confidenceThreshold
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Object detection failed');
  }

  return response.json();
};

/**
 * Get detailed device information
 */
export const getDeviceInfo = async () => {
  const response = await fetch(`${API_BASE}/device-info`);
  if (!response.ok) {
    throw new Error('Failed to get device info');
  }
  return response.json();
};

/**
 * Parse text queries from a textarea input
 * Each line becomes a separate query
 */
export const parseTextQueries = (text) => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

/**
 * Create default object detection queries based on categories
 */
export const createDefaultQueries = (categories) => {
  const queries = [];
  
  for (const category of categories) {
    // Add various forms of the category
    queries.push(`a ${category}`);
    queries.push(category);
  }
  
  // Add some common objects if no categories
  if (categories.length === 0) {
    queries.push('a person', 'a car', 'a cat', 'a dog', 'an object');
  }
  
  return queries;
};
