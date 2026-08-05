import os
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

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

model_loader = ModelLoader.get_instance()
