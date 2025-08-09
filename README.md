# Image Cropping & Dataset Creator

**Current Version:** v1.0.0 (2025-08-09)

A Docker-based web application for creating image datasets by cropping objects and assigning categories.

## 📋 Version History

### v1.0.0 (2025-08-09) - Initial Release
**Status:** Released (2-day development sprint)
- ✨ **New Feature:** Docker-based web application with FastAPI backend and React frontend
- ✨ **New Feature:** Manual bounding box creation and editing
- ✨ **New Feature:** Interactive canvas-based image editing
- ✨ **New Feature:** Category management with automatic extraction from folder structure
- ✨ **New Feature:** Image cropping and saving to category-specific folders
- ✨ **New Feature:** Progress tracking and session management
- ✨ **New Feature:** Three-panel UI layout (tools, image, actions)
- ✨ **New Feature:** Toast notifications for user feedback
- ✨ **New Feature:** Default centered bounding box on image load
- ✨ **New Feature:** Box selection, resizing, and dragging functionality
- ✨ **New Feature:** WebP image format support
- ✨ **New Feature:** CSV report generation for processing logs
- ✨ **New Feature:** Database persistence with SQLite
- ✨ **Technical:** Disabled AI object detection for faster builds (manual mode only)
- 🔧 **Technical:** Docker Compose orchestration with health checks
- 🔧 **Technical:** Nginx reverse proxy for frontend
- 🔧 **Technical:** Comprehensive error handling and logging

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available for Docker

### 1. Clone and Setup
```bash
git clone https://github.com/korgmp3/Dataset_Image_Cropper.git
cd Dataset_Image_Cropper
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
1. Go to the **Categories** section (left panel)
2. Categories are automatically extracted when you set a folder
3. Add or remove categories as needed

### Step 2: Select Input Folder
1. Go to the **Folder Setup** section (left panel)
2. Enter your input folder path: `/data/input`
3. Click "Set Folder"

### Step 3: Process Images
1. The app will show the first unprocessed image in the center panel
2. A default centered bounding box is automatically created
3. For each bounding box:
   - Click to select it (highlighted in red)
   - Choose a category from the dropdown inside the box
   - Resize if needed (drag corners/edges)
   - Use the Detection Controls (right panel) to add/remove boxes
4. Click "Save Crops" to extract and save the objects
5. Or use "Skip" buttons if the image has no useful objects

### Step 4: Monitor Progress
- Track progress in the **Folder Setup** section (left panel)
- Resume processing anytime - the app remembers where you left off

## 🎯 Enhanced Detection Controls

### Box Management
- **Add Rectangle**: Creates a new bounding box centered on the image
- **Box Selection**: Click any box button to select it for editing
- **Remove Box**: Click the "×" button next to any box to delete it
- **Visual Feedback**: Selected boxes are highlighted in red with resize handles

### Box Editing
- **Select**: Click on any bounding box to select it
- **Move**: Drag the selected box to reposition it
- **Resize**: Drag the corner/edge handles to resize
- **Category**: Click the dropdown inside each box to assign a category

## ⚙️ Features

- ✅ **Manual Bounding Box Creation**: Add, select, and remove boxes individually
- ✅ **Interactive Editing**: Click, drag, and resize bounding boxes
- ✅ **Category Management**: Auto-extract categories from folder structure
- ✅ **Progress Tracking**: Resume processing from where you left off
- ✅ **Comprehensive Logging**: Track all operations in CSV format
- ✅ **Multiple Formats**: Support for JPG, PNG, BMP, TIFF, WEBP
- ✅ **Docker Ready**: One-command deployment
- ✅ **Toast Notifications**: Non-blocking user feedback
- ✅ **Default Bounding Box**: Automatic centered box on image load

## 🔧 Configuration

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

**1. Images not loading**
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

**4. Images not progressing after save/skip**
- Check database logs: `docker-compose logs backend`
- Restart the application: `docker-compose restart`

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

## 🎯 Development Timeline

### Day 1 (2025-08-08)
- ✅ **Project Setup**: Docker, FastAPI, React, SQLite
- ✅ **Basic UI**: Three-panel layout, image display
- ✅ **Core Functionality**: Image loading, bounding box creation
- ✅ **Database**: SQLite setup with processing logs
- ✅ **Docker**: Containerization and orchestration

### Day 2 (2025-08-09)
- ✅ **UI Enhancement**: Toast notifications, box selection
- ✅ **Advanced Features**: Box resizing, dragging, category management
- ✅ **Workflow**: Progress tracking, report generation
- ✅ **Polish**: Error handling, documentation, testing
- ✅ **Deployment**: Production-ready Docker setup

## 🔮 Future Roadmap

### Planned Features (v2.0.0+)
- 🔮 **AI Object Detection**: Re-enabled with improved models
- 🔮 **Batch Processing**: Multi-image simultaneous processing
- 🔮 **Export Options**: Multiple output formats and metadata
- 🔮 **Collaboration**: Multi-user support and sharing
- 🔮 **Analytics**: Processing statistics and performance metrics
- 🔮 **API Enhancement**: RESTful API for external integrations
- 🔮 **Mobile Support**: Responsive design for mobile devices
- 🔮 **Cloud Integration**: Cloud storage and processing support

---

*Project started: 2025-08-08*
*Initial release: 2025-08-09*
*Development time: 2 days*