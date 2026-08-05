# Somnia Mindscape — Local Setup Guide

EEG neurological condition analysis app with a React frontend and a Python FastAPI backend powered by a Random Forest classifier.

---

## Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Git | any | https://git-scm.com |

---

## 1. Clone the Repository

```bash
git clone https://github.com/Mohith1220/somnia-mindscape.git
cd somnia-mindscape
```

---

## 2. Backend Setup (FastAPI + ML Model)

### Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run the backend server

```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- Health check: http://127.0.0.1:8000/health
- Model info:   http://127.0.0.1:8000/model/info
- Predict:      `POST` http://127.0.0.1:8000/predict

> Keep this terminal open and running while using the app.

---

## 3. Frontend Setup (React + Vite)

Open a **new terminal** and go back to the project root:

```bash
cd somnia-mindscape
```

### Install Node dependencies

```bash
npm install
```

### Configure the backend URL

Create a `.env` file in the project root:

```bash
# Windows (Command Prompt)
echo VITE_ML_API_URL=http://localhost:8000 > .env

# Mac / Linux
echo "VITE_ML_API_URL=http://localhost:8000" > .env
```

### Run the frontend dev server

```bash
npm run dev
```

The app will open at: http://localhost:8080

---

## 4. Using the App

1. Open http://localhost:8080 in your browser
2. Navigate to the **Analysis** page
3. Upload an EEG CSV file
4. The backend will classify the signal and return the predicted condition with confidence scores

### Supported CSV formats

| Format | Description |
|--------|-------------|
| 5 columns | Pre-extracted features: Mean, Std Dev, Variance, Min, Max |
| 178+ columns | Raw EEG signal rows (features auto-extracted) |
| 1 column | Single-channel signal stream |

---

## 5. Project Structure

```
somnia-mindscape/
├── backend/
│   ├── app.py              # FastAPI app entry point
│   ├── api.py              # Route handlers
│   ├── predict.py          # EEG feature extraction + inference
│   ├── model_loader.py     # Singleton model loader
│   ├── serialize.py        # Re-train / re-serialize models
│   ├── requirements.txt    # Python dependencies
│   └── models/
│       ├── random_forest_model.pkl
│       └── scaler.pkl
├── src/
│   ├── routes/             # React pages (index, analysis, results, etc.)
│   ├── components/         # Shared UI components
│   └── lib/                # API client, stores, utilities
├── .env                    # Local env vars (not committed)
├── package.json
└── vite.config.ts
```

---

## 6. Troubleshooting

### CORS error in browser console
The backend must be running before opening the frontend. If you see a CORS error, verify the backend is up at http://localhost:8000/health and that your `.env` has the correct `VITE_ML_API_URL`.

### `ModuleNotFoundError` when starting backend
Run uvicorn from inside the `backend/` directory:
```bash
cd backend
uvicorn app:app --reload
```

### Port already in use
If port 8000 or 8080 is occupied, use a different port:
```bash
# Backend on 8001
uvicorn app:app --host 127.0.0.1 --port 8001 --reload

# Update .env accordingly
VITE_ML_API_URL=http://localhost:8001
```

### sklearn version warning
The `.pkl` models were serialized with scikit-learn 1.6.1. A version mismatch warning is expected but non-fatal. To silence it, re-serialize with your installed version:
```bash
cd backend
python serialize.py
```

---

## 7. Re-training the Model (Optional)

If you want to retrain the Random Forest on new data:

```bash
cd backend
python serialize.py
```

This regenerates `models/random_forest_model.pkl` and `models/scaler.pkl`.
