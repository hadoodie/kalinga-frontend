import sys
import cv2
import pytesseract
import json
import re
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]

try:
    # 1. Load Image
    with open(image_path, 'rb') as f:
        file_bytes = np.asarray(bytearray(f.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        raise Exception("Could not decode image file")

    # 2. Pre-processing (High Contrast Grayscale)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Increase contrast to make text stand out against the blue background
    alpha = 1.5 # Contrast
    beta = -20   # Brightness (Darken slightly to make text heavier)
    adjusted = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
    
    # 3. Extract Text (PSM 6 is best for uniform blocks like IDs)
    text = pytesseract.image_to_string(adjusted, lang='eng', config='--psm 6')

    # 4. Clean and Split Lines
    # We filter out very short junk lines (less than 2 chars)
    raw_lines = text.split('\n')
    lines = [line.strip() for line in raw_lines if len(line.strip()) > 1]

    data = {
        "idNumber": "",
        "firstName": "",
        "lastName": "",
        "middleName": "",
        "birthYear": "",
        "birthMonth": "",
        "birthDay": "",
        "rawText": text
    }

    # --- HELPER: Find value AFTER a specific label ---
    def find_value_after_label(label_keywords, all_lines):
        for i, line in enumerate(all_lines):
            # Check if this line contains our label (e.g., "LAST NAME")
            line_upper = line.upper()
            if any(k in line_upper for k in label_keywords):
                
                # FOUND LABEL! Now look at the lines BELOW it.
                # We check up to 3 lines down to skip noise/garbage
                for offset in range(1, 4):
                    if i + offset >= len(all_lines): break
                    
                    val = all_lines[i + offset].strip()
                    
                    # Skip empty lines or lines that look like other labels
                    if not val: continue
                    if any(x in val.upper() for x in ["GIVEN", "PANGALAN", "MIDDLE", "GITNANG", "DATE", "BIRTH", "ADDRESS", "TIRAHAN"]):
                        continue

                    # Clean the value (Allow letters, spaces, and dashes for names like Dela Cruz)
                    clean_val = re.sub(r'[^A-Z\s.-]', '', val.upper()).strip()
                    
                    # If we have a decent length string, assume this is the name!
                    if len(clean_val) > 2:
                        return clean_val
        return ""

    # --- RUN THE HUNTER ---

    # 1. Last Name (Apelyido)
    data["lastName"] = find_value_after_label(["LAST NAME", "APELYIDO"], lines)

    # 2. First Name (Given Names / Mga Pangalan)
    data["firstName"] = find_value_after_label(["GIVEN NAMES", "PANGALAN"], lines)

    # 3. Middle Name (Gitnang Apelyido)
    data["middleName"] = find_value_after_label(["MIDDLE NAME", "GITNANG"], lines)

    # 4. ID Number (Standard Regex)
    # Looks for 4 digits - 4 digits - 4 digits - 4 digits
    id_match = re.search(r'\b(\d{4})[-\s](\d{4})[-\s](\d{4})[-\s](\d{4})\b', text)
    if id_match:
        data["idNumber"] = f"{id_match.group(1)}-{id_match.group(2)}-{id_match.group(3)}-{id_match.group(4)}"
    
    # 5. Date of Birth (Flexible Regex)
    # Looks for MONTH (Jan/January) followed by Day and Year
    dob_match = re.search(r'([A-Z]{3,9})\s+(\d{1,2})[,.]?\s+(\d{4})', text, re.IGNORECASE)
    if dob_match:
        data["birthMonth"] = dob_match.group(1)
        data["birthDay"] = dob_match.group(2)
        data["birthYear"] = dob_match.group(3)

    print(json.dumps(data))

except Exception as e:
    print(json.dumps({"error": str(e), "details": str(e)}))