import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, ProcessingLog, ImageProgress

def init_database():
    """Initialize the database and create tables"""
    try:
        # Create database directory
        db_dir = Path("/app/data")
        db_dir.mkdir(parents=True, exist_ok=True)
        
        # Create database engine
        database_url = "sqlite:////app/data/image_crop.db"
        engine = create_engine(database_url)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✓ Database initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        return False

if __name__ == "__main__":
    init_database()