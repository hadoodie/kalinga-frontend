import time
import board
import busio
import adafruit_tca9548a
from max30100 import MAX30100

print("--- Pulse Waveform View ---")
print("Values should ripple between -100 and +100")

i2c = busio.I2C(board.SCL, board.SDA)
mux = adafruit_tca9548a.TCA9548A(i2c)
mx30 = MAX30100(i2c=mux[1])
mx30.enable_spo2()

while True:
    try:
        mx30.update()
        
        # Read the AC signal (Heartbeat only)
        ac = mx30.get_ac_ir()
        
        # Scale for visualization
        val = int(ac / 5) 
        
        bar = "|"
        if val > 0: bar = "|" + "#" * min(val, 50)
        else: bar = "#" * min(abs(val), 50) + "|"
            
        print(f"Signal: {int(ac):<5} {bar:>52}")
        time.sleep(0.02)
        
    except KeyboardInterrupt: break
    except: time.sleep(0.1)