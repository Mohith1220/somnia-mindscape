import os
import sys
import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Path setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
TRAIN_CSV = os.path.join(BASE_DIR, "train_data.csv")
TEST_CSV = os.path.join(BASE_DIR, "test_data.csv")

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
    return model_path, scaler_path

if __name__ == "__main__":
    train_and_serialize()
