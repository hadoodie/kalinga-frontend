import time
import board
import busio
import adafruit_tca9548a
from max30100 import MAX30100

print("\n--- Kalinga Data Logger ---")
print("Columns: RAW_IR | DC_FILTER | AC_SIGNAL | HEART_RATE")
print("Press CTRL+C to stop and copy the logs.\n")

# Setup
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    mux = adafruit_tca9548a.TCA9548A(i2c)
    mx30 = MAX30100(i2c=mux[1])
    mx30.enable_spo2()
except Exception as e:
    print(f"Init Error: {e}")
    exit()

# Header for CSV format (Optional: pipe this to a file >> log.csv)
print("Timestamp,Raw,DC,AC,BPM,SpO2")

while True:
    try:
        mx30.update()
        
        # We access internal variables to debug the math
        raw = mx30.get_raw_ir()
        dc = mx30.dc_ir
        ac = mx30.get_ac_ir()
        bpm = mx30.get_heart_rate()
        spo2 = mx30.get_spo2()
        
        # Only log if finger is likely present to reduce spam
        if raw > 1000:
            print(f"{time.time():.2f}, {raw}, {int(dc)}, {int(ac)}, {bpm}, {spo2}")
        else:
            print(f"{time.time():.2f}, {raw}, -, -, -, - (No Finger)")

        time.sleep(0.05) # 20 samples per second
        
    except KeyboardInterrupt:
        print("\nStopped.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(0.1)