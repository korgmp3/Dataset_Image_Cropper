# Image Cropping & Dataset Creator

**Current Version:** v1.2.0 (2024-01-15)

A Docker-based web application for creating image datasets by cropping objects and assigning categories.

## 📋 Version History

### v1.2.0 (2024-01-15)
- ✅ Fixed bounding box resizing functionality
- ✅ Improved image progression after save/skip
- ✅ Enhanced WebP image support
- ✅ Added single-window UI layout
- ✅ Implemented mandatory category validation

### v1.1.0 (2024-01-10)
- ✅ Added manual bounding box creation
- ✅ Implemented category management
- ✅ Added progress tracking

### v1.0.0 (2024-01-05)
- ✅ Initial release with basic functionality
- ✅ AI object detection
- ✅ Image cropping and saving

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available for Docker

### 1. Clone and Setup
```bash
git clone <your-repo>
cd image-crop-dataset-app
```

### 2. Prepare Your Data
```bash
# Create input folder structure
mkdir -p sample_data/input_folder/{cats,dogs,birds}
mkdir -p sample_data/output_folder

# Add your images to category folders:
# sample_data/input_folder/cats/cat1.jpg
# sample_data/input_folder/dogs/dog1.jpg
# sample_data/input_folder/birds/bird1.jpg
```

### 3. Run the Application
```bash
docker-compose up --build
```

### 4. Access the Application
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

## 📁 Expected Folder Structure

### Input Structure
```
sample_data/input_folder/
├── cats/
│   ├── cat1.jpg
│   ├── cat2.jpg
│   └── cat3.png
├── dogs/
│   ├── dog1.jpg
│   └── dog2.jpeg
└── birds/
    ├── bird1.jpg
    └── bird2.png
```

### Output Structure (Created Automatically)
```
sample_data/output_folder/
├── cats/
│   ├── cat1_crop_0.jpg
│   ├── cat1_crop_1.jpg
│   └── cat2_crop_0.jpg
├── dogs/
│   ├── dog1_crop_0.jpg
│   └── dog2_crop_0.jpg
└── birds/
    ├── bird1_crop_0.jpg
    └── bird2_crop_0.jpg
```

## 🎯 How to Use

### Step 1: Setup Categories
1. Go to the **Categories** tab
2. Click "Extract from Folder" to automatically detect categories from your folder structure
3. Add or remove categories as needed

### Step 2: Select Input Folder
1. Go to the **Dashboard** tab
2. Enter your input folder path: `/data/input`
3. Click "Set Folder"

### Step 3: Process Images
1. Go to the **Image Processor** tab
2. The app will show the first unprocessed image
3. Detected objects will be highlighted with bounding boxes
4. For each bounding box:
   - Click to select it
   - Choose a category from the dropdown
   - Resize if needed (drag corners/edges)
   - Delete unwanted boxes
5. Click "Save Crops" to extract and save the objects
6. Or use "Skip" buttons if the image has no useful objects

### Step 4: Monitor Progress
- Track progress in the **Dashboard** tab
- Resume processing anytime - the app remembers where you left off

## ⚙️ Features

- ✅ **AI Object Detection**: Uses YOLOv5 for automatic object detection
- ✅ **Interactive Editing**: Click, drag, and resize bounding boxes
- ✅ **Category Management**: Auto-extract categories from folder structure
- ✅ **Progress Tracking**: Resume processing from where you left off
- ✅ **Comprehensive Logging**: Track all operations in CSV format
- ✅ **Multiple Formats**: Support for JPG, PNG, BMP, TIFF, WEBP
- ✅ **Docker Ready**: One-command deployment

## 🔧 Configuration

### Adjust Detection Sensitivity
1. Go to **Settings** tab
2. Adjust "Detection Confidence Threshold"
3. Lower values = more detections (but more false positives)
4. Higher values = fewer detections (but more accurate)

### Custom Input/Output Paths
Edit `docker-compose.yml` to change volume mounts:
```yaml
volumes:
  - /your/custom/input:/data/input
  - /your/custom/output:/data/output
```

## 📊 Logs and Data

### Processing Logs
- Location: `./logs/processing_log.csv`
- Contains detailed information about every cropped object
- Includes coordinates, categories, timestamps, and file paths

### Database
- Location: `./backend_data/app.db` (SQLite)
- Stores processing progress and session data

## 🐛 Troubleshooting

### Common Issues

**1. Detection not working**
```bash
# Check backend logs
docker-compose logs backend

# Restart services
docker-compose restart
```

**2. Permission errors**
```bash
# Fix folder permissions
sudo chmod -R 755 sample_data/
```

**3. Out of memory**
```bash
# Increase Docker memory limit to 4GB+
# Or process smaller batches of images
```

**4. Images not loading**
- Ensure input folder path is correct: `/data/input`
- Check that images are in supported formats
- Verify folder permissions

### Performance Tips
- Use images smaller than 4K resolution for faster processing
- Process images in batches of 100-500 for better performance
- Close unused browser tabs to save memory

## 🏗️ Development

### Run in Development Mode
```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install
npm run dev
```

### API Documentation
- Full API docs available at: http://localhost:8000/docs
- Swagger UI with interactive testing

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Open an issue with detailed error information