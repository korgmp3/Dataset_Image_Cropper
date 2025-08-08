import os
from pathlib import Path

def ensure_directories():
    """Ensure all required directories exist with proper permissions"""
    required_dirs = [
        "/data/input",
        "/data/output", 
        "/app/logs",
        "/app/data"
    ]
    
    for dir_path in required_dirs:
        path = Path(dir_path)
        try:
            if not path.exists():
                print(f"Creating directory: {dir_path}")
                path.mkdir(parents=True, exist_ok=True)
            
            # Ensure directory is writable
            if not os.access(dir_path, os.W_OK):
                print(f"Setting write permissions for: {dir_path}")
                os.chmod(dir_path, 0o755)
                
            print(f"✓ Directory ready: {dir_path}")
        except Exception as e:
            print(f"✗ Error creating directory {dir_path}: {e}")
            raise

def ensure_output_structure():
    """Ensure output directory structure is ready for cropping"""
    output_base = Path("/data/output")
    try:
        # Create main output directory
        output_base.mkdir(parents=True, exist_ok=True)
        
        # Ensure it's writable
        if not os.access(output_base, os.W_OK):
            os.chmod(output_base, 0o755)
            
        print(f"✓ Output directory ready: {output_base}")
        return True
    except Exception as e:
        print(f"✗ Error setting up output directory: {e}")
        return False

if __name__ == "__main__":
    ensure_directories()
    ensure_output_structure()