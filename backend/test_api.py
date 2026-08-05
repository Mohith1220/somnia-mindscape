import os
import io
import json
import urllib.request
import urllib.error

API_URL = "http://127.0.0.1:8000/predict"
HEALTH_URL = "http://127.0.0.1:8000/health"

def test_health():
    print("\n--- Testing GET /health ---")
    req = urllib.request.Request(HEALTH_URL)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print("Health response:", json.dumps(data, indent=2))
        assert resp.status == 200
        assert data.get("model_loaded") is True
        print("[PASS] Health endpoint verified.")

def post_multipart(url, filename, content_bytes):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = io.BytesIO()
    
    body.write(f"--{boundary}\r\n".encode())
    body.write(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.write(b"Content-Type: text/csv\r\n\r\n")
    body.write(content_bytes)
    body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    
    data = body.getvalue()
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(data))
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        try:
            return e.code, json.loads(error_body)
        except Exception:
            return e.code, {"raw": error_body}

def test_predict_success():
    print("\n--- Testing POST /predict with sample EEG CSV ---")
    # Sample CSV with statistical features (mean, std, var, min, max)
    sample_csv = "mean,std,var,min,max\n-0.45,1.23,1.51,-1.82,1.75\n0.12,0.85,0.72,-0.95,0.91\n"
    status_code, response = post_multipart(API_URL, "eeg_sample.csv", sample_csv.encode())
    print(f"Status Code: {status_code}")
    print("Response JSON:\n", json.dumps(response, indent=2))
    
    assert status_code == 200
    assert response.get("success") is True
    assert "condition" in response
    assert "condition_id" in response
    assert "confidence" in response
    assert "probabilities" in response
    assert set(response["probabilities"].keys()) == {"normal", "insomnia", "apnea", "seizure"}
    print("[PASS] POST /predict response structure verified.")

def test_predict_test_data_csv():
    print("\n--- Testing POST /predict with project's test_data.csv ---")
    test_csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_data.csv")
    with open(test_csv_path, "rb") as f:
        file_bytes = f.read()
    
    status_code, response = post_multipart(API_URL, "test_data.csv", file_bytes)
    print(f"Status Code: {status_code}")
    print("Response JSON:\n", json.dumps(response, indent=2))
    assert status_code == 200
    assert response.get("success") is True
    print("[PASS] Test data CSV prediction verified.")

def test_error_handling():
    print("\n--- Testing Error Handling ---")
    
    # 1. Empty file
    status_code, response = post_multipart(API_URL, "empty.csv", b"")
    print(f"Empty File Test -> Status: {status_code}, Response: {response}")
    assert status_code == 400
    
    # 2. Non-CSV file
    status_code, response = post_multipart(API_URL, "test.txt", b"hello world")
    print(f"Non-CSV File Test -> Status: {status_code}, Response: {response}")
    assert status_code == 400
    
    # 3. Invalid non-numeric data
    status_code, response = post_multipart(API_URL, "invalid.csv", b"col1,col2\nfoo,bar\n")
    print(f"Non-numeric Data Test -> Status: {status_code}, Response: {response}")
    assert status_code == 400

    print("[PASS] Error handling verified.")

if __name__ == "__main__":
    test_health()
    test_predict_success()
    test_predict_test_data_csv()
    test_error_handling()
    print("\n================ ALL TESTS PASSED SUCCESSFULLY! ================\n")
