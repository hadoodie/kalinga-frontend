import time
import board
import busio
import random
import statistics
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- Hardware Logic ---
HARDWARE_AVAILABLE = False
try:
    import adafruit_tca9548a
    import adafruit_mlx90614
    from max30100 import MAX30100
    HARDWARE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Hardware libraries missing: {e}")
except Exception as e:
    print(f"⚠️ Init Error: {e}")

app = Flask(__name__)
CORS(app)

# --- Hardware Setup ---
mux = None
mlx = None
mx30 = None

if HARDWARE_AVAILABLE:
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        mux = adafruit_tca9548a.TCA9548A(i2c)
        
        # Temp Sensor (Channel 0)
        try:
            mlx = adafruit_mlx90614.MLX90614(mux[0])
            print("✅ MLX90614 (Temp) Ready")
        except Exception:
            print("❌ MLX90614 Failed")

        # Pulse Sensor (Channel 1)
        try:
            mx30 = MAX30100(i2c=mux[1])
            mx30.enable_spo2()
            print("✅ MAX30100 (Pulse) Ready")
        except Exception:
            print("❌ MAX30100 Failed")

    except Exception as e:
        print(f"⚠️ I2C Bus Error: {e}")
        HARDWARE_AVAILABLE = False

# --- Helper: Reset Sensor ---
def reset_max30100():
    if HARDWARE_AVAILABLE and mx30:
        try:
            mx30.reset()
            mx30.enable_spo2()
        except Exception:
            pass  # Sensor reset failures are non-critical; continue with stale state

# --- Routes ---

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"system": "online", "hardware": HARDWARE_AVAILABLE})

@app.route('/scan-user', methods=['POST'])
def scan_user():
    data = request.json
    return jsonify({
        "user_id": data.get('qr_code', 'UNKNOWN'),
        "name": "Juan Dela Cruz",
        "status": "Active"
    })

# --- NEW: Check Finger Status (Fast) ---
@app.route('/check-finger', methods=['GET'])
def check_finger():
    is_detected = False
    raw_val = 0
    
    if HARDWARE_AVAILABLE and mx30:
        try:
            mx30.update()
            raw_val = mx30.get_raw_ir()
            # Threshold matches driver logic
            if raw_val > 5000: 
                is_detected = True
        except Exception:
            pass  # Hardware read errors are expected; return default values
    else:
        # Simulation: Always say yes for testing flow, or randomize
        is_detected = True 
        
    return jsonify({"finger_detected": is_detected, "raw": raw_val})

@app.route('/record-temp', methods=['POST'])
def record_temp():
    print("\n🌡️  READING TEMPERATURE...")
    readings = []
    start_time = time.time()
    
    while (time.time() - start_time) < 3.0:
        val = 0
        if HARDWARE_AVAILABLE and mlx:
            try:
                val = mlx.object_temperature
            except Exception:
                pass  # Temp sensor read errors are expected; skip this reading
        else:
            val = random.uniform(36.3, 36.7)
            
        if val > 0: readings.append(val)
        time.sleep(0.1)
        
    avg_temp = round(statistics.mean(readings), 1) if readings else 0
    print(f"   Result: {avg_temp}°C")
    return jsonify({"temp_c": avg_temp, "status": "success"})

@app.route('/record-pulse', methods=['POST'])
def record_pulse():
    print("\n💓 READING PULSE (Sequence Started)...")
    reset_max30100()
    
    valid_hr = []
    valid_spo2 = []
    
    # Total Scan Time (Stabilization + Recording)
    TOTAL_DURATION = 10.0 
    start_time = time.time()
    
    while (time.time() - start_time) < TOTAL_DURATION:
        elapsed = time.time() - start_time
        curr_hr = 0
        curr_spo2 = 0
        
        if HARDWARE_AVAILABLE and mx30:
            try:
                mx30.update()
                curr_hr = mx30.get_heart_rate()
                curr_spo2 = mx30.get_spo2()
            except Exception:
                pass  # Pulse sensor read errors are expected; skip this sample
        else:
            # Sim
            if elapsed > 3:
                curr_hr = random.randint(70, 80)
                curr_spo2 = 98

        # Logic: Only accept data if sensor has locked (HR > 40)
        if curr_hr > 40 and curr_spo2 > 50:
            valid_hr.append(curr_hr)
            valid_spo2.append(curr_spo2)
        
        # Console Feedback
        if int(elapsed * 10) % 5 == 0:
             status = f"HR: {curr_hr}" if curr_hr > 0 else "Stabilizing..."
             print(f"   T+{elapsed:.1f}s | {status}")

        time.sleep(0.02)

    if len(valid_hr) > 0:
        final_hr = int(statistics.median(valid_hr))
        final_spo2 = int(statistics.median(valid_spo2))
        print(f"🏁 FINAL: {final_hr} BPM | {final_spo2}% SpO2")
        return jsonify({"heart_rate": final_hr, "spo2": final_spo2, "status": "success"})
    else:
        print("❌ FAILED: Signal unstable or lost.")
        return jsonify({"heart_rate": 0, "spo2": 0, "status": "error", "message": "Signal unstable"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)