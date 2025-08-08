from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = "sqlite:////app/data/image_crop.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_image_path = Column(String, nullable=False)
    source_image_name = Column(String, nullable=False)
    rectangle_id = Column(Integer, nullable=True)
    x_coordinate = Column(Float, nullable=True)
    y_coordinate = Column(Float, nullable=True)
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    assigned_category = Column(String, nullable=True)
    output_image_path = Column(String, nullable=True)
    processing_status = Column(String, nullable=False)  # extracted/skipped/no_objects
    skip_reason = Column(String, nullable=True)

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