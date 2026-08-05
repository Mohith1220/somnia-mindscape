import io
import numpy as np
import pandas as pd
from model_loader import model_loader

# Mapping class IDs (0, 1, 2, 3) to names and frontend keys
LABEL_MAP = {
    0: {"name": "Normal", "key": "normal"},
    1: {"name": "Insomnia", "key": "insomnia"},
    2: {"name": "Sleep Apnea", "key": "apnea"},
    3: {"name": "Seizure", "key": "seizure"}
}

def extract_features(df: pd.DataFrame) -> np.ndarray:
    """
    Extracts statistical features (mean, std, var, min, max) exactly matching
    the project's training & preprocessing pipeline in preprocessing.py.
    """
    # Filter non-numeric columns and label columns if present
    cols_to_drop = [c for c in df.columns if str(c).lower() in ['y', 'label', 'target', 'condition', 'id', 'timestamp', 'unnamed: 0']]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)

    numeric_df = df.apply(pd.to_numeric, errors='coerce').dropna(how='all')
    if numeric_df.empty:
        raise ValueError("No valid numeric data found in the uploaded CSV file.")

    values = numeric_df.values

    # Case 1: Pre-extracted 5 statistical features (mean, std, var, min, max)
    if values.shape[1] == 5:
        return values

    # Case 2: Multi-feature raw EEG signal rows (e.g. 178 signal points per sample row)
    elif values.shape[1] > 5:
        feat_mean = np.mean(values, axis=1, keepdims=True)
        feat_std = np.std(values, axis=1, keepdims=True)
        feat_var = np.var(values, axis=1, keepdims=True)
        feat_min = np.min(values, axis=1, keepdims=True)
        feat_max = np.max(values, axis=1, keepdims=True)
        return np.hstack([feat_mean, feat_std, feat_var, feat_min, feat_max])

    # Case 3: 1D signal stream (single column with N time points)
    elif values.shape[1] == 1:
        signal = values[:, 0]
        feat_mean = np.mean(signal)
        feat_std = np.std(signal)
        feat_var = np.var(signal)
        feat_min = np.min(signal)
        feat_max = np.max(signal)
        return np.array([[feat_mean, feat_std, feat_var, feat_min, feat_max]])

    else:
        raise ValueError(f"Invalid dataset dimensions ({values.shape[1]} columns). Expected 1 signal column, 5 statistical columns, or >5 signal feature columns.")

def predict_eeg(file_bytes: bytes, filename: str) -> dict:
    """
    Processes uploaded EEG CSV file, runs feature extraction, applies stored scaler,
    and returns predictions with confidence scores.
    """
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise ValueError("Uploaded CSV file is empty.")

    try:
        # Load CSV from bytes
        content_str = file_bytes.decode('utf-8', errors='ignore')
        df = pd.read_csv(io.StringIO(content_str))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")

    if df.empty:
        raise ValueError("Uploaded CSV contains no rows.")

    # 1. Feature Extraction matching training pipeline
    X_stats = extract_features(df)

    # 2. Load model & scaler (loads only once via singleton)
    if not model_loader.is_loaded:
        model_loader.load()

    scaler = model_loader.scaler
    rf_model = model_loader.model

    # 3. Apply fitted StandardScaler
    X_scaled = scaler.transform(X_stats)

    # 4. Predict probabilities using trained Random Forest
    probs_matrix = rf_model.predict_proba(X_scaled) # shape: (N, n_classes)

    # Average class probabilities across all sample windows in the CSV
    avg_probs = np.mean(probs_matrix, axis=0)

    # Map model classes (0, 1, 2, 3) to output probabilities dictionary
    class_probs_map = {cls: prob for cls, prob in zip(rf_model.classes_, avg_probs)}

    winning_class_id = int(rf_model.classes_[np.argmax(avg_probs)])
    winning_meta = LABEL_MAP.get(winning_class_id, {"name": "Unknown", "key": "unknown"})
    winning_confidence = round(float(class_probs_map.get(winning_class_id, 0.0) * 100), 1)

    probabilities_response = {
        "normal": round(float(class_probs_map.get(0, 0.0) * 100), 1),
        "insomnia": round(float(class_probs_map.get(1, 0.0) * 100), 1),
        "apnea": round(float(class_probs_map.get(2, 0.0) * 100), 1),
        "seizure": round(float(class_probs_map.get(3, 0.0) * 100), 1)
    }

    return {
        "success": True,
        "condition": winning_meta["name"],
        "condition_id": winning_class_id,
        "confidence": winning_confidence,
        "probabilities": probabilities_response,
        "feature_importance": model_loader.feature_importance(),
        "windows_analyzed": int(probs_matrix.shape[0])
    }
