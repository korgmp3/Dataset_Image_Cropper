import csv
import os
from datetime import datetime
from pathlib import Path

class ProcessingLogger:
    def __init__(self, log_file_path: str = "/app/logs/processing_log.csv"):
        self.log_file_path = Path(log_file_path)
        self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_log_file()
    
    def _initialize_log_file(self):
        if not self.log_file_path.exists():
            with open(self.log_file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([
                    'timestamp', 'source_image_path', 'source_image_name',
                    'rectangle_id', 'x_coordinate', 'y_coordinate', 'width', 'height',
                    'assigned_category', 'output_image_path', 'processing_status', 'skip_reason'
                ])
    
    def log_extraction(self, source_path: str, rect_id: int, coords: dict, category: str, output_path: str):
        self._write_log_entry({
            'timestamp': datetime.now().isoformat(),
            'source_image_path': source_path,
            'source_image_name': Path(source_path).name,
            'rectangle_id': rect_id,
            'x_coordinate': coords['x'],
            'y_coordinate': coords['y'],
            'width': coords['width'],
            'height': coords['height'],
            'assigned_category': category,
            'output_image_path': output_path,
            'processing_status': 'extracted',
            'skip_reason': ''
        })
    
    def log_skip(self, source_path: str, reason: str):
        self._write_log_entry({
            'timestamp': datetime.now().isoformat(),
            'source_image_path': source_path,
            'source_image_name': Path(source_path).name,
            'rectangle_id': '',
            'x_coordinate': '',
            'y_coordinate': '',
            'width': '',
            'height': '',
            'assigned_category': '',
            'output_image_path': '',
            'processing_status': 'skipped',
            'skip_reason': reason
        })
    
    def _write_log_entry(self, entry: dict):
        with open(self.log_file_path, 'a', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=entry.keys())
            writer.writerow(entry)

# Global logger instance
logger = ProcessingLogger()