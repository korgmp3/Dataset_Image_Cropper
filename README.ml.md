# ML-Enhanced Image Cropping & Dataset Creator

## Overview

This document describes the Machine Learning enhanced version of the Image Cropping & Dataset Creator, which includes AI-powered object detection using Google's OwlViT model.

## Features

### Standard Features (All Versions)
- ✅ **Manual Bounding Box Creation**: Add, select, and remove boxes individually
- ✅ **Interactive Editing**: Click, drag, and resize bounding boxes
- ✅ **Category Management**: Auto-extract categories from folder structure
- ✅ **Progress Tracking**: Resume processing from where you left off
- ✅ **Multiple Formats**: Support for JPG, PNG, BMP, TIFF, WEBP
- ✅ **Docker Ready**: One-command deployment

### ML-Enhanced Features
- 🤖 **AI Object Detection**: Powered by Google OwlViT model
- 🎯 **Text-based Detection**: Describe objects in natural language
- ⚡ **CUDA Support**: Automatic GPU acceleration when available
- 🔄 **Auto-detection**: Automatic object detection on image load
- 📝 **Custom Prompts**: Flexible text queries for detection
- 🎚️ **Confidence Control**: Adjustable detection threshold

## Deployment Options

### Option 1: Lightweight Version (No ML)
For basic manual annotation without AI detection:

```bash
docker-compose up --build
```

**Use cases:**
- Manual annotation workflow
- Low-resource environments
- Simple cropping tasks
- Faster startup times

### Option 2: ML-Enhanced Version
For AI-powered object detection:

```bash
docker-compose -f docker-compose.ml.yml up --build
```

**Use cases:**
- Large dataset processing
- Semi-automated annotation
- Complex object detection
- GPU-accelerated workflows

## System Requirements

### Lightweight Version
- **CPU**: Any modern processor
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 500MB for Docker images
- **GPU**: Not required

### ML-Enhanced Version
- **CPU**: Multi-core processor recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB for Docker images and models
- **GPU**: Optional but recommended
  - NVIDIA GPU with CUDA support
  - 4GB+ VRAM for optimal performance

## GPU Support

### NVIDIA GPU Setup
1. **Install NVIDIA Docker runtime:**
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   
   sudo apt-get update && sudo apt-get install -y nvidia-docker2
   sudo systemctl restart docker
   ```

2. **Verify GPU access:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```

3. **Run ML version with GPU:**
   ```bash
   docker-compose -f docker-compose.ml.yml up --build
   ```

### CPU-Only Mode
The ML version automatically falls back to CPU if no GPU is available:
```bash
# Force CPU mode
CUDA_VISIBLE_DEVICES="" docker-compose -f docker-compose.ml.yml up --build
```

## ML Detection Usage

### 1. Text-based Object Detection
- **Natural Language**: Describe objects you want to detect
- **Examples**:
  - "a cat"
  - "a person walking"
  - "a red car"
  - "a dog sitting"

### 2. Detection Interface
When using the ML version, you'll see additional controls in the left panel:

#### ML Status Indicator
- ✅ **ML Available**: AI detection is ready
- ❌ **ML Unavailable**: Fallback to manual mode
- **Device Info**: Shows CPU/GPU usage

#### Detection Toggle
- **Auto-detection ON**: Automatically detect objects when loading new images
- **Auto-detection OFF**: Manual detection only

#### Object Prompt Textarea
- Enter objects to detect (one per line)
- Default prompts based on your categories
- Natural language descriptions work best

#### Confidence Threshold
- Adjust detection sensitivity (1% - 95%)
- Lower = more detections (may include false positives)
- Higher = fewer, more confident detections

### 3. Workflow with ML Detection

1. **Setup Categories**: Add or extract categories from folder structure
2. **Configure Detection**: Review and edit detection prompts
3. **Set Confidence**: Adjust threshold based on your needs
4. **Enable Auto-detection**: Toggle on for automatic detection
5. **Process Images**: AI will automatically detect objects
6. **Review & Edit**: Manually adjust detected bounding boxes
7. **Assign Categories**: Verify and modify category assignments
8. **Save Crops**: Export detected objects to category folders

## Model Information

### OwlViT (Object-centric Vision Transformer)
- **Developer**: Google Research
- **Type**: Vision-language model
- **Capabilities**: Zero-shot object detection with text queries
- **Input**: Images + text descriptions
- **Output**: Bounding boxes with confidence scores

### Performance Characteristics
- **GPU (CUDA)**: ~2-5 seconds per image
- **CPU**: ~10-30 seconds per image
- **Memory**: 2-4GB during inference
- **Model Size**: ~1.2GB download

## Configuration

### Environment Variables

#### ML-Enhanced Version
```bash
# Enable ML features
ML_ENABLED=true

# GPU configuration
CUDA_VISIBLE_DEVICES=0  # Use first GPU
# CUDA_VISIBLE_DEVICES=""  # Force CPU mode

# Memory limits
TORCH_HOME=/tmp/.cache/torch
TRANSFORMERS_CACHE=/tmp/.cache/transformers
```

#### Custom Model Configuration
```python
# In backend/app/services/ml_detection.py
detector = OwlViTDetector(
    model_name="google/owlvit-base-patch32",  # Default model
    confidence_threshold=0.1  # Default threshold
)
```

## Troubleshooting

### Common Issues

#### 1. ML Not Available
**Symptoms**: ML controls don't appear, status shows "unavailable"
**Solutions**:
```bash
# Check if ML version is running
docker-compose -f docker-compose.ml.yml logs backend

# Verify environment variable
docker exec -it <backend_container> env | grep ML_ENABLED

# Check model loading
docker-compose -f docker-compose.ml.yml logs backend | grep "OwlViT"
```

#### 2. CUDA Out of Memory
**Symptoms**: Detection fails with CUDA memory errors
**Solutions**:
```bash
# Reduce batch size or use CPU
CUDA_VISIBLE_DEVICES="" docker-compose -f docker-compose.ml.yml up

# Or add memory limits in docker-compose.ml.yml
deploy:
  resources:
    limits:
      memory: 8G
```

#### 3. Slow Detection Performance
**Solutions**:
- Use GPU if available
- Reduce image size before processing
- Increase confidence threshold
- Limit number of text queries

#### 4. Poor Detection Quality
**Solutions**:
- Adjust confidence threshold
- Improve text descriptions
- Use more specific object descriptions
- Try different variations of object names

### Performance Optimization

#### For GPU Users
```bash
# Optimize Docker for GPU
docker-compose -f docker-compose.ml.yml up --build

# Monitor GPU usage
nvidia-smi -l 1
```

#### For CPU Users
```bash
# Limit CPU cores for better memory usage
docker-compose -f docker-compose.ml.yml up --build
# Edit docker-compose.ml.yml to add:
# cpus: 4  # Limit to 4 cores
```

## API Endpoints (ML Version)

### Check ML Status
```bash
GET /api/ml/status
```

### Detect Objects
```bash
POST /api/ml/detect
{
  "image_path": "/data/input/image.jpg",
  "text_queries": ["a cat", "a dog"],
  "confidence_threshold": 0.1
}
```

### Get Device Information
```bash
GET /api/ml/device-info
```

## Development

### Running ML Version in Development
```bash
# Backend with ML
cd backend
pip install -r requirements.ml.txt
ML_ENABLED=true uvicorn app.main:app --reload

# Frontend (same as standard version)
cd frontend
npm install
npm run dev
```

### Testing ML Features
```bash
# Test detection endpoint
curl -X POST http://localhost:8000/api/ml/detect \
  -H "Content-Type: application/json" \
  -d '{
    "image_path": "/data/input/test.jpg",
    "text_queries": ["a cat", "a dog"],
    "confidence_threshold": 0.1
  }'
```

## Migration Guide

### From Lightweight to ML Version
1. **Stop current containers:**
   ```bash
   docker-compose down
   ```

2. **Switch to ML version:**
   ```bash
   docker-compose -f docker-compose.ml.yml up --build
   ```

3. **Data preservation**: All data in volumes is preserved

### From ML to Lightweight Version
1. **Stop ML containers:**
   ```bash
   docker-compose -f docker-compose.ml.yml down
   ```

2. **Switch to lightweight version:**
   ```bash
   docker-compose up --build
   ```

3. **Note**: ML detection features will be disabled, but manual annotation continues to work

## Future Enhancements

### Planned Features
- 🔮 **Custom Model Support**: Train and use custom detection models
- 🔮 **Batch Detection**: Process multiple images simultaneously
- 🔮 **Model Caching**: Faster startup with pre-loaded models
- 🔮 **Advanced Prompting**: Template-based detection queries
- 🔮 **Detection History**: Save and reuse successful detection patterns

### Community Contributions
- Submit feature requests via GitHub issues
- Contribute model improvements
- Share detection prompt templates
- Report performance optimizations

---

*For standard usage without ML features, see the main [README.md](README.md)*
