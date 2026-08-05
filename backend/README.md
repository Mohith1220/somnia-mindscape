# SOMNIA AI — EEG ML Backend (FastAPI)

Random Forest EEG classifier served to the React frontend.

## Run

```bash
cd <project root>
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

- Health: http://127.0.0.1:8000/health
- Predict: `POST /predict` with `multipart/form-data`, field name `file` (a `.csv`)

Serialized artifacts live in `backend/models/` (`random_forest_model.pkl`,
`scaler.pkl`). Re-train/re-serialize with `python backend/serialize.py`.

## Frontend wiring

`src/lib/analyze-csv.ts` POSTs each uploaded CSV to the endpoint and overrides
only `condition`, `conditionLabel`, `confidence` and the probability bars. If the
API is unreachable it silently falls back to the built-in client-side engine.

Default URL is `http://localhost:8000/predict`; override with a `.env` entry:

```
VITE_ML_API_URL=http://127.0.0.1:8000/predict
```

Note: browsers may block calls from an `https://*.lovable.app` preview to a plain
`http://localhost` backend. Run the frontend locally (`bun dev` → http://localhost:8080)
for the full end-to-end test, or expose the API over HTTPS (e.g. a tunnel) and point
`VITE_ML_API_URL` at it.

## Tests

```bash
python backend/tests/test_api.py   # server must be running
```
