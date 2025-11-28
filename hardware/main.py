import time
import board
import busio
import threading
import json
import uuid
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- CONFIG ---
HARDWARE_AVAILABLE = False 

try:
    import adafruit_tca9548a
    import adafruit_mlx90614
    from max30100 import MAX30100 
    HARDWARE_AVAILABLE = True
    print("✅ Hardware: ACTIVE")
except ImportError:
    print("⚠️ Running in HEADLESS MODE")

# --- STATE ---
sensor_state = { "raw_ir": 0, "bpm": 0, "spo2": 0, "temp_c": 0, "finger_detected": False }
RECORDS_DB = [] # In-memory storage

# --- SENSOR THREAD ---
def worker():
    global sensor_state
    mx30, mlx = None, None
    
    if HARDWARE_AVAILABLE:
        try:
            i2c = busio.I2C(board.SCL, board.SDA)
            mux = adafruit_tca9548a.TCA9548A(i2c)
            try: mlx = adafruit_mlx90614.MLX90614(mux[0])
            except: pass
            try: mx30 = MAX30100(mux[1])
            except: pass
        except: pass

    while True:
        if HARDWARE_AVAILABLE and mx30:
            try:
                mx30.update()
                sensor_state["raw_ir"] = mx30.raw_ir
                sensor_state["bpm"] = mx30.bpm
                sensor_state["spo2"] = mx30.spo2
                sensor_state["finger_detected"] = mx30.raw_ir > 15000
                if mlx and int(time.time()*10)%5==0:
                    sensor_state["temp_c"] = mlx.object_temperature
            except: pass
        else:
            sensor_state["raw_ir"] = 0
            sensor_state["finger_detected"] = False
            time.sleep(1)
        time.sleep(0.01)

threading.Thread(target=worker, daemon=True).start()

# --- APP ---
app = Flask(__name__)
CORS(app)

@app.route('/status', methods=['GET'])
def status(): return jsonify({"status": "online", "hw": HARDWARE_AVAILABLE})

# --- LOGIC: CHECK DATABASE ---
@app.route('/api/scan', methods=['POST'])
def scan():
    id = request.json.get('qr_code') or request.json.get('id')
    
    # Check if ID exists in our in-memory DB
    existing = next((r for r in RECORDS_DB if str(r.get('patient_id')) == str(id)), None)
    
    if existing:
        return jsonify({"found": True, "user": {"name": existing['patient_name']}, "id": id})
    else:
        return jsonify({"found": False, "id": id})

@app.route('/api/temp', methods=['GET'])
def temp(): return jsonify({"temp_c": sensor_state["temp_c"]})

@app.route('/api/pulse-stream', methods=['GET'])
def pulse(): return jsonify(sensor_state)

# --- RECORDS ENDPOINTS ---
@app.route('/api/vitals', methods=['GET'])
def get_records():
    return jsonify(RECORDS_DB)

@app.route('/api/vitals', methods=['POST'])
def add_record():
    data = request.json
    data['id'] = str(uuid.uuid4())
    if 'timestamp' not in data:
        data['timestamp'] = datetime.now().isoformat()
    
    RECORDS_DB.insert(0, data)
    return jsonify({"success": True})

@app.route('/api/vitals/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    global RECORDS_DB
    RECORDS_DB = [r for r in RECORDS_DB if r['id'] != record_id]
    return jsonify({"success": True})

@app.route('/api/scan-image', methods=['POST'])
def scan_image(): return jsonify({"found": False}) 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
