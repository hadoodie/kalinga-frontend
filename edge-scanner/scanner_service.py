"""
Kalinga EDGE Scanner Service
Flask service running on the EDGE device (192.168.254.110:5000).

Responsibilities:
  - Expose POST /scan for the hardware QR scanner to push scanned values
  - Forward scanned QR tokens to the Node backend (POST /api/qr/scan)
  - Expose GET /health for uptime monitoring
  - Expose POST /sensor/vitals for RPi 5 health sensor data ingestion
  - Expose GET /sensor/vitals/latest for local sensor readout

Environment variables (set in .env or export before running):
  BACKEND_URL      Node backend base URL (e.g. http://192.168.254.1:5000)
  LARAVEL_URL      Laravel backend base URL (e.g. http://192.168.254.1:8000)
  EDGE_API_KEY     Shared secret sent as X-Edge-Key header to the backend
  PORT             Port to listen on (default: 5000)
"""

import os
import time
import logging
import threading
import random
from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
LARAVEL_URL = os.environ.get("LARAVEL_URL", "http://localhost:8000")
EDGE_API_KEY = os.environ.get("EDGE_API_KEY", "")
PORT = int(os.environ.get("PORT", 5000))

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# In-memory buffer for the latest sensor readings (thread-safe via GIL for simple reads)
_latest_vitals = {}
_vitals_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "kalinga-edge-scanner"}), 200


# ---------------------------------------------------------------------------
# QR scan endpoint
# ---------------------------------------------------------------------------

@app.post("/scan")
def scan():
    """
    Receive a QR code scan from the hardware scanner and forward it to the
    Node backend for validation and logging.

    Expected JSON body:
        { "qr_uid": "<scanned token string>" }

    Returns the backend response (user info on success, error on failure).
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get("qr_uid"), str) or not data["qr_uid"].strip():
        return jsonify({"success": False, "message": "qr_uid is required"}), 400

    qr_uid = data["qr_uid"].strip()
    logger.info("Received QR scan: %s", qr_uid)

    if not EDGE_API_KEY:
        logger.warning("EDGE_API_KEY is not set — backend request will likely be rejected")

    try:
        backend_resp = requests.post(
            f"{BACKEND_URL}/api/qr/scan",
            json={"qr_uid": qr_uid},
            headers={
                "Content-Type": "application/json",
                "X-Edge-Key": EDGE_API_KEY,
            },
            timeout=10,
        )
        return jsonify(backend_resp.json()), backend_resp.status_code
    except requests.exceptions.Timeout:
        logger.error("Backend request timed out")
        return jsonify({"success": False, "message": "Backend request timed out"}), 504
    except requests.exceptions.ConnectionError as exc:
        logger.error("Cannot reach backend: %s", exc)
        return jsonify({"success": False, "message": "Cannot reach backend"}), 502
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error: %s", exc)
        return jsonify({"success": False, "message": "Internal error"}), 500


# ---------------------------------------------------------------------------
# Sensor data endpoints (Alisto Health Monitoring — RPi 5)
# ---------------------------------------------------------------------------

@app.post("/sensor/vitals")
def ingest_vitals():
    """
    Receive vitals from attached sensors (or a local simulator) and:
      1. Cache locally for instant /sensor/vitals/latest reads
      2. Forward to the Laravel backend (POST /api/sensor/vitals)

    Expected JSON body:
        {
            "user_uuid": "<patient id>",
            "heart_rate": 78.0,
            "oxygen_saturation": 97.5,
            "temperature": 36.8,
            "blood_pressure": "120/80",   (optional)
            "respiratory_rate": 16        (optional)
        }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "JSON body required"}), 400

    required = ["user_uuid", "heart_rate", "oxygen_saturation", "temperature"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"success": False, "message": f"Missing fields: {', '.join(missing)}"}), 400

    # Validate numeric ranges
    try:
        hr = float(data["heart_rate"])
        spo2 = float(data["oxygen_saturation"])
        temp = float(data["temperature"])
        if not (20 <= hr <= 250):
            return jsonify({"success": False, "message": "heart_rate must be 20-250"}), 400
        if not (50 <= spo2 <= 100):
            return jsonify({"success": False, "message": "oxygen_saturation must be 50-100"}), 400
        if not (30 <= temp <= 45):
            return jsonify({"success": False, "message": "temperature must be 30-45"}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Numeric fields must be valid numbers"}), 400

    # Cache locally
    reading = {
        "user_uuid": str(data["user_uuid"]).strip(),
        "heart_rate": hr,
        "oxygen_saturation": spo2,
        "temperature": temp,
        "blood_pressure": data.get("blood_pressure"),
        "respiratory_rate": data.get("respiratory_rate"),
        "recorded_at": time.time(),
    }

    with _vitals_lock:
        _latest_vitals[reading["user_uuid"]] = reading

    logger.info("Sensor reading cached: HR=%.1f SpO2=%.1f Temp=%.1f [%s]",
                hr, spo2, temp, reading["user_uuid"])

    # Forward to Laravel backend
    try:
        resp = requests.post(
            f"{LARAVEL_URL}/api/sensor/vitals",
            json=data,
            headers={
                "Content-Type": "application/json",
                "X-Edge-Key": EDGE_API_KEY,
            },
            timeout=10,
        )
        return jsonify({"success": True, "backend": resp.json()}), resp.status_code
    except requests.exceptions.ConnectionError:
        logger.warning("Laravel backend unreachable — data cached locally only")
        return jsonify({"success": True, "message": "Cached locally; backend unreachable"}), 202
    except Exception as exc:  # noqa: BLE001
        logger.error("Forward error: %s", exc)
        return jsonify({"success": True, "message": "Cached locally; forward failed"}), 202


@app.get("/sensor/vitals/latest")
def get_latest_vitals():
    """Return the most recent cached sensor reading(s)."""
    user_uuid = request.args.get("user_uuid")

    with _vitals_lock:
        if user_uuid:
            reading = _latest_vitals.get(user_uuid)
            if reading:
                return jsonify({"success": True, "data": reading}), 200
            return jsonify({"success": False, "message": "No reading for this user"}), 404
        return jsonify({"success": True, "data": list(_latest_vitals.values())}), 200


@app.get("/sensor/simulate")
def simulate_reading():
    """
    Generate a single mock sensor reading for testing when hardware is
    unavailable. Does NOT persist — returns data directly.
    """
    return jsonify({
        "success": True,
        "source": "simulator",
        "data": {
            "user_uuid": "sim-rpi-001",
            "heart_rate": round(60 + random.random() * 40, 1),
            "oxygen_saturation": round(94 + random.random() * 6, 1),
            "temperature": round(36.0 + random.random() * 2, 1),
            "blood_pressure": f"{random.randint(110, 130)}/{random.randint(70, 85)}",
            "respiratory_rate": random.randint(12, 20),
            "recorded_at": time.time(),
        },
    }), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting Kalinga EDGE scanner on port %d", PORT)
    logger.info("Backend URL: %s", BACKEND_URL)
    app.run(host="0.0.0.0", port=PORT, debug=False)
