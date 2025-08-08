from sqlalchemy import create_engine, text
from app.models.database import DATABASE_URL

def migrate_database():
    """Add missing columns to existing database tables"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if columns exist and add them if they don't
        try:
            # Add cropped_image_path column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE processing_logs 
                ADD COLUMN cropped_image_path VARCHAR
            """))
            print("Added cropped_image_path column")
        except Exception as e:
            print(f"Column cropped_image_path might already exist: {e}")
        
        try:
            # Add category column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE processing_logs 
                ADD COLUMN category VARCHAR
            """))
            print("Added category column")
        except Exception as e:
            print(f"Column category might already exist: {e}")
        
        try:
            # Add bounding_box_data column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE processing_logs 
                ADD COLUMN bounding_box_data TEXT
            """))
            print("Added bounding_box_data column")
        except Exception as e:
            print(f"Column bounding_box_data might already exist: {e}")
        
        try:
            # Add processing_status column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE processing_logs 
                ADD COLUMN processing_status VARCHAR
            """))
            print("Added processing_status column")
        except Exception as e:
            print(f"Column processing_status might already exist: {e}")
        
        try:
            # Add skip_reason column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE processing_logs 
                ADD COLUMN skip_reason VARCHAR
            """))
            print("Added skip_reason column")
        except Exception as e:
            print(f"Column skip_reason might already exist: {e}")
        
        conn.commit()
        print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate_database()
