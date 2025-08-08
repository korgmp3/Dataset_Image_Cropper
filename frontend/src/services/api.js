const API_URL = "/api";  // Changed from "http://localhost:8000"

// Detection
export async function detectObjects(file, confidence) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confidence", confidence);
  const res = await fetch(`${API_URL}/images/detect`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// Categories
export async function getCategories() {
  const res = await fetch(`${API_URL}/categories/`);
  return res.json();
}

export async function updateCategories(categories) {
  const res = await fetch(`${API_URL}/categories/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ categories }),
  });
  return res.json();
}

export async function extractCategoriesFromFolder(folderPath) {
  const res = await fetch(`${API_URL}/categories/extract-from-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ folder_path: folderPath }),
  });
  return res.json();
}

// Images
export async function setImageFolder(folderPath) {
  const res = await fetch(`${API_URL}/images/set-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ folder_path: folderPath }),
  });
  return res.json();
}

export async function getCurrentImage() {
  const res = await fetch(`${API_URL}/images/current`);
  return res.json();
}

export async function cropAndSave(data) {
  const res = await fetch(`${API_URL}/images/crop-and-save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function skipImage(imagePath, reason) {
  const res = await fetch(`${API_URL}/images/skip?image_path=${encodeURIComponent(imagePath)}&reason=${reason}`, {
    method: "POST",
  });
  return res.json();
}

export async function getProgress() {
  const res = await fetch(`${API_URL}/images/progress`);
  return res.json();
}

// Settings
export async function getSettings() {
  const res = await fetch(`${API_URL}/settings/`);
  return res.json();
}

export async function setConfidence(confidence) {
  const res = await fetch(`${API_URL}/settings/confidence/${confidence}`, {
    method: "POST",
  });
  return res.json();
}