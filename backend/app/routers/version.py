from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/version")
async def get_version():
    return {
        "version": "1.2.3",
        "build_date": "2025-08-08",
        "backend": "FastAPI",
        "python_version": "3.9",
        "timestamp": datetime.now().isoformat()
    }
