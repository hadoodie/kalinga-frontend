"""
Kalinga EDGE Scanner Service
Flask service running on the EDGE device (192.168.254.110:5000).

Responsibilities:
  - Expose POST /scan for the hardware QR scanner to push scanned values
  - Forward scanned QR tokens to the Node backend (POST /api/qr/scan)
  - Expose GET /health for uptime monitoring

Environment variables (set in .env or export before running):
  BACKEND_URL      Node backend base URL (e.g. http://192.168.254.1:5000)
  EDGE_API_KEY     Shared secret sent as X-Edge-Key header to the backend
  PORT             Port to listen on (default: 5000)
"""

import os
import logging
from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
EDGE_API_KEY = os.environ.get("EDGE_API_KEY", "")
PORT = int(os.environ.get("PORT", 5000))

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


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
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting Kalinga EDGE scanner on port %d", PORT)
    logger.info("Backend URL: %s", BACKEND_URL)
    app.run(host="0.0.0.0", port=PORT, debug=False)
