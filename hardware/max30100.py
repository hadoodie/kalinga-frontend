import time
from adafruit_bus_device.i2c_device import I2CDevice

# --- Registers ---
MAX30100_I2C_ADDRESS = 0x57
REG_MODE_CONFIG = 0x06
REG_SPO2_CONFIG = 0x07
REG_LED_CONFIG = 0x09
REG_FIFO_DATA = 0x05
REG_FIFO_WR_PTR = 0x02
REG_FIFO_RD_PTR = 0x04
REG_FIFO_OVF_CTR = 0x03

class MAX30100:
    def __init__(self, i2c):
        self.i2c_device = I2CDevice(i2c, MAX30100_I2C_ADDRESS)
        
        # Public State
        self.raw_ir = 0
        self.raw_red = 0
        self.bpm = 0
        self.spo2 = 0
        
        # Signal Processing State
        self.dc_filter_ir = 0
        self.dc_filter_red = 0
        self.lpf_ir = 0
        self.last_beat = 0
        self.beats = []
        self.sig_min = 0
        self.sig_max = 0
        self.is_beat = False
        
        self.init_sensor()

    def write(self, reg, val):
        with self.i2c_device as i2c:
            i2c.write(bytes([reg, val]))

    def read(self, reg, count=1):
        buf = bytearray(count)
        with self.i2c_device as i2c:
            i2c.write_then_readinto(bytes([reg]), buf)
        return buf

    def init_sensor(self):
        self.write(REG_MODE_CONFIG, 0x40) # Reset
        time.sleep(0.1)
        self.write(REG_MODE_CONFIG, 0x03) # Mode: SpO2
        self.write(REG_SPO2_CONFIG, 0x07) # Config: 100SPS, 1600us
        self.write(REG_LED_CONFIG, 0xFF) # LED: 50mA (High Current)

    def update(self):
        """Reads all available data from FIFO for speed."""
        ptr = self.read(REG_FIFO_WR_PTR)[0]
        rd_ptr = self.read(REG_FIFO_RD_PTR)[0]
        
        count = ptr - rd_ptr
        if count < 0: count += 16

        if count > 0:
            data = self.read(REG_FIFO_DATA, 4 * count)
            # Process ALL samples to catch every beat
            for i in range(0, 4 * count, 4):
                ir = (data[i] << 8) | data[i+1]
                red = (data[i+2] << 8) | data[i+3]
                self.raw_ir = ir
                self.process(ir, red)

    def process(self, ir, red):
        # 1. Finger Threshold
        if ir < 15000: 
            self.bpm = 0; self.spo2 = 0; self.beats = []; self.dc_filter_ir = 0
            return

        # 2. DC Filter
        self.dc_filter_ir = ir + 0.95 * self.dc_filter_ir - self.dc_filter_ir
        ac_ir = self.dc_filter_ir

        # 3. Low Pass Filter
        self.lpf_ir += 0.4 * (ac_ir - self.lpf_ir)
        sig = self.lpf_ir

        # 4. Dynamic Threshold
        self.sig_max *= 0.98
        self.sig_min *= 0.98
        if sig > self.sig_max: self.sig_max = sig
        if sig < self.sig_min: self.sig_min = sig
        
        thresh = self.sig_max * 0.5
        now = time.time()
        
        # 5. Beat Detection
        if sig > thresh and not self.is_beat:
            self.is_beat = True
            if self.last_beat > 0:
                delta = now - self.last_beat
                # Valid range: 35-180 BPM
                if 0.33 < delta < 1.7: 
                    bpm = 60 / delta
                    self.beats.append(bpm)
                    if len(self.beats) > 10: self.beats.pop(0)
                    
                    # Smooth: Trim outliers and average
                    if len(self.beats) > 4:
                        s = sorted(self.beats)[1:-1]
                        self.bpm = int(sum(s)/len(s))
                    else:
                        self.bpm = int(bpm)
            self.last_beat = now
            
        if sig < thresh * 0.8: self.is_beat = False

        # 6. SpO2
        self.dc_filter_red = red + 0.95 * self.dc_filter_red - self.dc_filter_red
        if ir > 0:
            r = red / ir
            spo2 = 110 - (25 * r)
            self.spo2 = int(min(max(spo2, 80), 100))

    def get_heart_rate(self): return self.bpm
    def get_spo2(self): return self.spo2
