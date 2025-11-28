from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import random
import threading
import requests  # REQUIRED: pip install requests

app = Flask(__name__)
CORS(app)

# ==========================================
# CONFIGURATION (UPDATE THIS!)
# ==========================================
# Replace 192.168.X.X with your Laptop's IP Address
# Make sure Laravel is running: php artisan serve --host=0.0.0.0 --port=8000

# CORRECT SETTING for running locally on the Pi
LARAVEL_API_URL = "http://127.0.0.1:8000/api/vitals"

# ==========================================
# GLOBAL STATE
# ==========================================
current_temp = 0.0
current_bpm = 0
current_spo2 = 0
finger_detected = False
current_user_id = "WAITING_FOR_QR" # Default ID until a QR is scanned

# ==========================================
# LARAVEL COMMUNICATION
# ==========================================
def send_to_laravel():
    """Sends the current sensor data to the Laravel Database"""
    global current_temp, current_bpm, current_spo2, current_user_id
    
    # Don't save empty data or if no user is scanned yet (optional)
    if not finger_detected:
        return

    payload = {
        "user_id": current_user_id,
        "temperature": current_temp,
        "bpm": current_bpm,
        "spo2": current_spo2
    }

    try:
        print(f"📤 Sending to Laravel: {payload}")
        response = requests.post(LARAVEL_API_URL, json=payload, timeout=3)
        
        if response.status_code == 201:
            print("✅ SUCCESS: Data saved to PostgreSQL.")
        else:
            print(f"❌ FAILED (Status {response.status_code})")
            print(f"❌ SERVER RESPONSE: {response.text}") # <--- THIS WILL REVEAL THE DB ERROR

    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR: Cannot reach {LARAVEL_API_URL}")
        print("   -> Is Laravel running? (php artisan serve --host=0.0.0.0)")
        print("   -> Is the IP address correct?")
    except Exception as e:
        print(f"❌ ERROR: {e}")

# ==========================================
# SENSOR LOOP (Background Thread)
# ==========================================
def background_task():
    global current_temp, current_bpm, current_spo2, finger_detected
    
    counter = 0
    
    while True:
        # 1. Simulate Sensor Readings (Updates every 1 second)
        current_temp = round(36.5 + random.uniform(-0.2, 0.5), 1)
        finger_detected = True 
        
        if finger_detected:
            current_bpm = random.randint(70, 85)
            current_spo2 = random.randint(97, 99)
        
        # 2. Send to Laravel every 5 seconds (to avoid flooding DB)
        counter += 1
        if counter >= 5:
            send_to_laravel()
            counter = 0
            
        time.sleep(1)

# Start the background thread
threading.Thread(target=background_task, daemon=True).start()

# ==========================================
# FLASK API ROUTES (For React Frontend)
# ==========================================
@app.route('/api/scan', methods=['POST'])
def scan_qr():
    global current_user_id
    code = request.json.get('qr_code', '')
    
    if code:
        current_user_id = code # Update the ID so data sends correctly
        print(f"📷 QR SCANNED: New User ID is {current_user_id}")
        return jsonify({'found': True, 'id': code, 'user': {'name': 'Test Patient ' + code}})
    
    return jsonify({'found': False})

@app.route('/api/scan-cam', methods=['POST'])
def scan_camera():
    global current_user_id
    # Simulate camera finding a code
    fake_id = "P-CAM-01"
    current_user_id = fake_id
    time.sleep(2)
    return jsonify({'found': True, 'id': fake_id, 'user': {'name': 'Camera User'}})

@app.route('/api/temp', methods=['GET'])
def get_temp():
    return jsonify({'temp_c': current_temp})

@app.route('/api/pulse-stream', methods=['GET'])
def get_pulse():
    return jsonify({
        'raw_ir': 30000, 
        'finger_detected': finger_detected, 
        'bpm': current_bpm, 
        'spo2': current_spo2
    })

if __name__ == '__main__':
    # Running on 0.0.0.0 allows React to connect to this Pi
    app.run(host='0.0.0.0', port=5000)
