"""
Example snippet: securely post edge vitals payload to Node middleware for PCR auto-population.

Usage:
  python pcr_post_example.py
"""

import os
import requests

NODE_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
EDGE_API_KEY = os.environ.get("EDGE_API_KEY", "")

payload = {
    "case_no": "PCR-2026-0001",
    "patient_uuid": "patient-uuid-123",
    "reading": {
        "sensor": "GY-906 MLX90614",
        "temperature": 36.7,
        "heart_rate": 88,
        "oxygen_saturation": 98,
        "respiratory_rate": 18,
        "blood_pressure": "120/80",
        "time": "14:32",
    },
}

resp = requests.post(
    f"{NODE_URL}/api/edge/pcr-ingest",
    json=payload,
    headers={
        "Content-Type": "application/json",
        "X-Edge-Key": EDGE_API_KEY,
    },
    timeout=10,
)

print(resp.status_code, resp.text)
