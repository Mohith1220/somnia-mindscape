import os
import json
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

FEATURE_NAMES = ["Mean", "Standard Deviation", "Signal Variance", "Minimum Amplitude", "Maximum Amplitude"]
CLASS_LABELS = {0: "Normal", 1: "Insomnia", 2: "Sleep Apnea", 3: "Seizure"}


class ModelLoader:
    _instance = None

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_loaded = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self):
        if self.is_loaded:
            return

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at '{MODEL_PATH}'. Please run serialization first.")
        
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler file not found at '{SCALER_PATH}'. Please run serialization first.")

        try:
            print("Loading Random Forest model and Scaler into memory...")
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
            self.is_loaded = True
            print("Random Forest model and Scaler loaded successfully.")
        except Exception as e:
            raise RuntimeError(f"Failed to load serialized ML models: {str(e)}")

    def feature_importance(self):
        """Real trained importances from the Random Forest, as percentages."""
        if not self.is_loaded:
            self.load()
        importances = getattr(self.model, "feature_importances_", None)
        if importances is None:
            return []
        total = float(sum(importances)) or 1.0
        names = FEATURE_NAMES if len(FEATURE_NAMES) == len(importances) else [f"Feature {i + 1}" for i in range(len(importances))]
        return [
            {"name": names[i], "value": round(float(v) / total * 100, 1)}
            for i, v in enumerate(importances)
        ]

    def metrics(self):
        """Evaluation metrics written by serialize.py, if present."""
        if not os.path.exists(METRICS_PATH):
            return None
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def describe(self):
        if not self.is_loaded:
            self.load()
        model = self.model
        estimators = getattr(model, "estimators_", []) or []
        depths = [int(e.get_depth()) for e in estimators] if estimators else []
        classes = [int(c) for c in getattr(model, "classes_", [])]
        return {
            "model_type": type(model).__name__,
            "n_estimators": int(getattr(model, "n_estimators", len(estimators))),
            "n_features": int(getattr(model, "n_features_in_", len(FEATURE_NAMES))),
            "feature_names": FEATURE_NAMES,
            "classes": [{"id": c, "label": CLASS_LABELS.get(c, f"Class {c}")} for c in classes],
            "max_tree_depth": max(depths) if depths else None,
            "avg_tree_depth": round(sum(depths) / len(depths), 1) if depths else None,
            "total_nodes": int(sum(e.tree_.node_count for e in estimators)) if estimators else None,
            "feature_importance": self.feature_importance(),
            "evaluation": self.metrics(),
        }

model_loader = ModelLoader.get_instance()
