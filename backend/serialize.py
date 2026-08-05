import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

# Path setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
TRAIN_CSV = os.path.join(BASE_DIR, "train_data.csv")
TEST_CSV = os.path.join(BASE_DIR, "test_data.csv")
CLASS_LABELS = {0: "Normal", 1: "Insomnia", 2: "Sleep Apnea", 3: "Seizure"}


def evaluate_and_write_metrics(model, scaler, classes):
    """Evaluates the trained model on test_data.csv and stores real metrics."""
    if not os.path.exists(TEST_CSV):
        print(f"test_data.csv not found at {TEST_CSV} — skipping evaluation metrics.")
        return None

    test_df = pd.read_csv(TEST_CSV)
    X_test = test_df.iloc[:, :-1].values
    y_test = test_df.iloc[:, -1].values
    y_pred = model.predict(scaler.transform(X_test))

    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, labels=classes, zero_division=0
    )
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    total = int(sum(support)) or 1

    metrics = {
        "model": "Random Forest",
        "samples_evaluated": total,
        "accuracy": round(float(accuracy_score(y_test, y_pred)) * 100, 2),
        "precision": round(float(macro_p) * 100, 2),
        "recall": round(float(macro_r) * 100, 2),
        "f1": round(float(macro_f1) * 100, 2),
        "labels": [CLASS_LABELS.get(int(c), str(c)) for c in classes],
        "per_class": [
            {
                "label": CLASS_LABELS.get(int(c), str(c)),
                "precision": round(float(precision[i]) * 100, 2),
                "recall": round(float(recall[i]) * 100, 2),
                "f1": round(float(f1[i]) * 100, 2),
                "support": int(support[i]),
            }
            for i, c in enumerate(classes)
        ],
        "confusion_matrix": cm.astype(int).tolist(),
        "class_distribution": [
            {
                "condition": CLASS_LABELS.get(int(c), str(c)),
                "count": int(support[i]),
                "pct": round(int(support[i]) / total * 100, 1),
            }
            for i, c in enumerate(classes)
        ],
    }

    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Evaluation metrics written to {metrics_path} (accuracy {metrics['accuracy']}%).")
    return metrics


def train_and_serialize():
    """
    Fits StandardScaler and RandomForestClassifier using the project's exact logic
    and serializes them to backend/models/.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(TRAIN_CSV):
        print(f"train_data.csv not found at {TRAIN_CSV}. Running preprocessing pipeline first...")
        sys.path.append(BASE_DIR)
        from preprocessing import main as run_preprocessing
        run_preprocessing()

    print(f"Loading training data from {TRAIN_CSV}...")
    train_df = pd.read_csv(TRAIN_CSV)
    
    X_train = train_df.iloc[:, :-1].values
    y_train = train_df.iloc[:, -1].values

    print(f"Fitting StandardScaler on {X_train.shape[0]} samples with {X_train.shape[1]} features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    print("Training RandomForestClassifier(n_estimators=100, random_state=42)...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train_scaled, y_train)

    model_path = os.path.join(MODELS_DIR, "random_forest_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")

    print(f"Saving model to {model_path}...")
    joblib.dump(rf, model_path)
    
    print(f"Saving scaler to {scaler_path}...")
    joblib.dump(scaler, scaler_path)

    print("Model and Scaler successfully serialized!")

    evaluate_and_write_metrics(rf, scaler, [int(c) for c in np.unique(y_train)])
    return model_path, scaler_path

if __name__ == "__main__":
    train_and_serialize()
