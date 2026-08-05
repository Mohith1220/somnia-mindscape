import time
import logging
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from backend.predict import predict_eeg
from backend.model_loader import model_loader

logger = logging.getLogger("eeg_backend")
router = APIRouter()

@router.get("/")
async def root():
    return {
        "status": "online",
        "service": "EEG Neurological Condition Analysis API",
        "model": "Random Forest Classifier",
        "endpoints": ["/predict", "/health", "/model/info"]
    }


@router.get("/model/info")
async def model_info():
    """
    Returns real metadata read from the serialized Random Forest model:
    configuration, class list, trained feature importances, and (when
    available) evaluation metrics produced during serialization.
    """
    try:
        if not model_loader.is_loaded:
            model_loader.load()
        return model_loader.describe()
    except FileNotFoundError as fnfe:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(fnfe))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model_loader.is_loaded
    }

@router.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded EEG CSV file (multipart/form-data), runs feature extraction,
    and returns predicted condition, confidence score, and class probabilities.
    """
    start_time = time.time()
    filename = file.filename or "unknown.csv"

    # Validate file extension
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a valid CSV file."
        )

    try:
        file_bytes = await file.read()
        result = predict_eeg(file_bytes, filename)
        
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        
        # Log request details
        logger.info(
            f"FILENAME: {filename} | TIME: {elapsed_ms}ms | "
            f"PREDICTION: {result['condition']} (ID: {result['condition_id']}) | "
            f"CONFIDENCE: {result['confidence']}%"
        )
        
        return result

    except ValueError as ve:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"FILENAME: {filename} | TIME: {elapsed_ms}ms | BAD REQUEST: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except FileNotFoundError as fnfe:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"FILENAME: {filename} | TIME: {elapsed_ms}ms | MODEL MISSING: {str(fnfe)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(fnfe)
        )
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"FILENAME: {filename} | TIME: {elapsed_ms}ms | INTERNAL ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during prediction: {str(e)}"
        )
