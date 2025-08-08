from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import json

DATABASE_URL = "sqlite:////app/data/image_crop.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    source_image_path = Column(String, nullable=False)
    source_image_name = Column(String, nullable=False)
    cropped_image_path = Column(String, nullable=True)
    category = Column(String, nullable=True)
    bounding_box_data = Column(Text, nullable=True)  # JSON string for box coordinates
    processing_status = Column(String, nullable=False)  # "processed", "skipped"
    skip_reason = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)
    
    def set_bounding_box_data(self, box_data):
        """Store bounding box data as JSON string"""
        self.bounding_box_data = json.dumps(box_data)
    
    def get_bounding_box_data(self):
        """Retrieve bounding box data from JSON string"""
        if self.bounding_box_data:
            return json.loads(self.bounding_box_data)
        return None

class ImageProgress(Base):
    __tablename__ = "image_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, unique=True, nullable=False)
    processed = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()