import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure base directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.model_loader import model_loader
from backend.api import router as api_router

# Setup Logs directory and File Logging
LOGS_DIR = os.path.join(BASE_DIR, "backend", "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOGS_DIR, "app.log")

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("eeg_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads serialized ML models once when the FastAPI server starts up.
    """
    logger.info("Initializing EEG Neurological Condition FastAPI Server...")
    try:
        model_loader.load()
        logger.info("ML Models successfully loaded on startup.")
    except Exception as e:
        logger.error(f"Failed to load ML models during startup: {e}")
    yield
    logger.info("Shutting down EEG Neurological Condition FastAPI Server...")

app = FastAPI(
    title="EEG Neurological Condition Analysis API",
    description="FastAPI backend serving Random Forest EEG classification model for Lovable React Frontend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Lovable React frontend
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
