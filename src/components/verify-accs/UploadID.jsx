import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ScanLine, Loader2, Camera, Upload } from "lucide-react";

// IMAGE PROCESSING CONSTANTS

// Scaling: Max width for OCR processing to prevent memory crashes
const TARGET_IMAGE_WIDTH = 2000;

// Grayscale Conversion: Standard Rec. 709 Luma coefficients
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;

// Color bounds
const RGB_MAX = 255;
const RGB_MIN = 0;

// Thresholding: Forces high contrast for better OCR reading
const WHITE_THRESHOLD = 180; 
const BLACK_THRESHOLD = 100; 

// File Upload Constraints
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [currentIDType, setCurrentIDType] = useState(
    location.state?.selectedID || localStorage.getItem("selectedID") || ""
  );

  useEffect(() => {
    if (!currentIDType) {
      alert("No ID Type selected. Returning to selection screen.");
      navigate("/verify-id"); 
    } else {
      localStorage.setItem("selectedID", currentIDType);
    }
  }, [currentIDType, navigate]);

  // State for Front ID
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);

  // State for Back ID
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [extractedText, setExtractedText] = useState("");

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    };
  }, [frontPreview]);

  useEffect(() => {
    return () => {
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [backPreview]);

  // Handle file selection 
  const handleFileChange = (e, type) => {
    const uploadedFile = e.target.files[0];
    
    if (uploadedFile) {
      // 1. Validate File Type (Must be an image)
      if (!uploadedFile.type.startsWith("image/")) {
        alert("Invalid file format. Please upload a valid image file (JPEG, PNG, etc.).");
        e.target.value = ""; // Clear the input
        return;
      }

      // 2. Validate File Size (Enforce max size to prevent crashes)
      if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
        alert(`File is too large. Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = ""; // Clear the input
        return;
      }

      // If it passes validation, proceed as normal
      const previewUrl = URL.createObjectURL(uploadedFile);
      if (type === 'front') {
        setFrontFile(uploadedFile);
        setFrontPreview(previewUrl);
      } else {
        setBackFile(uploadedFile);
        setBackPreview(previewUrl);
      }
    }
  };

  const handleRemoveFile = (type) => {
    if (type === 'front') {
      setFrontFile(null);
      setFrontPreview(null);
      if(document.getElementById("front-upload")) document.getElementById("front-upload").value = "";
    } else {
      setBackFile(null);
      setBackPreview(null);
      if(document.getElementById("back-upload")) document.getElementById("back-upload").value = "";
    }
  };

  // ENHANCED IMAGE PRE-PROCESSING 
  const preprocessImage = (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(imageFile);
      
      // ERROR HANDLER: Prevents the infinite scanner hang
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl); // Clean up memory
        reject(new Error("Failed to load or decode the image for processing."));
      };

      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // Clean up memory immediately once loaded

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Only downscale images wider than TARGET_IMAGE_WIDTH; preserve original size for smaller images to avoid wasting memory and CPU
        const width = Math.min(img.width, TARGET_IMAGE_WIDTH);
        const scaleFactor = width / img.width;
        const height = img.height * scaleFactor;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Grayscale & High Contrast Logic
        let min = RGB_MAX, max = RGB_MIN;
        for (let i = 0; i < data.length; i += 4) {
          const avg = LUMA_RED * data[i] + LUMA_GREEN * data[i + 1] + LUMA_BLUE * data[i + 2];
          if (avg < min) min = avg;
          if (avg > max) max = avg;
        }

        const range = max - min;
        const factor = RGB_MAX / (range || 1); 

        for (let i = 0; i < data.length; i += 4) {
          const avg = LUMA_RED * data[i] + LUMA_GREEN * data[i + 1] + LUMA_BLUE * data[i + 2];
          const newVal = (avg - min) * factor;
          
          let final = newVal;
          if (final > WHITE_THRESHOLD) final = RGB_MAX; 
          if (final < BLACK_THRESHOLD) final = RGB_MIN;   

          data[i] = final;
          data[i + 1] = final;
          data[i + 2] = final;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.src = objectUrl; // Trigger the load AFTER defining handlers
    });
  };

  const handleScanAndNext = async (e) => {
    e.preventDefault();
    if (!frontFile || !backFile) {
      alert("Please upload both the Front and Back of your ID.");
      return;
    }

    console.log("Submitting with ID Type:", currentIDType);

    setIsScanning(true);
    setScanStatus("Enhancing image clarity...");

    try {
      const cleanImageURL = await preprocessImage(frontFile);
      
      // Lazy Load Tesseract to dramatically reduce initial bundle size
      setScanStatus("Loading OCR Engine...");
      const tesseractModule = await import('tesseract.js');
      const Tesseract = tesseractModule.default || tesseractModule;

      setScanStatus("Scanning ID...");
      
      const result = await Tesseract.recognize(
        cleanImageURL,
        'eng',
        { logger: m => {
            if(m.status === 'recognizing text') {
              setScanStatus(`Processing... ${Math.round(m.progress * 100)}%`);
            }
          } 
        }
      );

      const text = result.data.text;
      setExtractedText(text); 
      console.log("Raw Text:", text);

      setScanStatus("Extracting details...");
      const extractedData = parseIDText(text, currentIDType); 
      console.log("Extracted Data:", extractedData);

      navigate("/fill-info", { 
        state: { 
          selectedID: currentIDType,
          frontFile,
          backFile,
          scannedData: extractedData 
        } 
      });

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Scan failed. Please enter details manually.\n\nError: " + error.message);
      navigate("/fill-info", { 
        state: { 
            selectedID: currentIDType, 
            frontFile, 
            backFile 
        } 
      });
    } finally {
      setIsScanning(false);
    }
  };

  // SPECIALIZED PHILIPPINE NATIONAL ID PARSER 
  const parsePhilippineNationalID = (text, lines) => {
    console.log("=== USING PHILIPPINE NATIONAL ID PARSER ===");
    
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      address: ""
    };

    // Extract PCN
    const pcnPattern = /\b([0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/;
    const pcnMatch = text.match(pcnPattern);
    if (pcnMatch) {
      data.idNumber = pcnMatch[1].replace(/\s+/g, '');
    }

    const cleanLines = lines.map(l => l.replace(/\s+/g, ' ').trim());
    
    // Find Last Name
    const lastNameIndex = cleanLines.findIndex(line => /Apelyido/i.test(line) || /Last\s*Name/i.test(line));
    if (lastNameIndex !== -1) {
      for (let i = lastNameIndex + 1; i <= lastNameIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (/^[A-Z][A-Z\s]{2,25}$/.test(line) && !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|MGA|PANGALAN|GIVEN|GITNANG|MIDDLE|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
          data.lastName = line;
          break;
        }
      }
    }

    // Find First Name
    const firstNameIndex = cleanLines.findIndex(line => /Mga\s*Pangalan/i.test(line) || /Given\s*Names?/i.test(line));
    if (firstNameIndex !== -1) {
      for (let i = firstNameIndex + 1; i <= firstNameIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (/^[A-Z][A-Z\s]{2,35}$/.test(line) && !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|APELYIDO|LAST|GITNANG|MIDDLE|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
          const nameParts = line.split(/\s+/);
          const middleInitialIndex = nameParts.findIndex(part => /^[A-Z]\.?$/.test(part));
          
          if (middleInitialIndex !== -1 && middleInitialIndex > 0) {
            data.firstName = nameParts.slice(0, middleInitialIndex).join(' ');
            if (!data.middleName) data.middleName = nameParts[middleInitialIndex].replace('.', '');
          } else {
            data.firstName = line;
          }
          break;
        }
      }
    }

    // Find Middle Name
    if (!data.middleName) {
      const middleNameIndex = cleanLines.findIndex(line => /Gitnang/i.test(line) || (/Middle\s*Name/i.test(line) && !/Date/i.test(line)));
      if (middleNameIndex !== -1) {
        for (let i = middleNameIndex + 1; i <= middleNameIndex + 5 && i < cleanLines.length; i++) {
          const line = cleanLines[i];
          if (/^[A-Z][A-Z\s]{1,25}$/.test(line) && !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|APELYIDO|LAST|PANGALAN|GIVEN|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
            data.middleName = line;
            break;
          }
        }
      }
    }

    // Find Date of Birth
    const dobIndex = cleanLines.findIndex(line => /Petsa/i.test(line) || /Date\s*of\s*Birth/i.test(line) || /Kapanganakan/i.test(line));
    if (dobIndex !== -1) {
      for (let i = dobIndex + 1; i <= dobIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        const dateMatch = line.match(/([A-Z]{3,9})\s+([0-9]{1,2})[,\s]+([0-9]{4})/i);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
          const dateObj = new Date(`${month} ${day}, ${year}`);
          if (!isNaN(dateObj)) {
            data.birthYear = year;
            data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
            data.birthDay = day;
            break;
          }
        }
      }
    }

    // Find Address
    const addressIndex = cleanLines.findIndex(line => /Tirahan/i.test(line) || (/Address/i.test(line) && !/Apelyido|Middle/i.test(line)));
    if (addressIndex !== -1) {
      for (let i = addressIndex + 1; i <= addressIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (line.length > 10 && !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|VALID|PETSA|PHL/i.test(line)) {
          data.address = line.slice(0, 200);
          break;
        }
      }
    }

    // Fallback
    if (!data.lastName || !data.firstName) {
      const potentialNameLines = cleanLines.filter((line) => {
        if (!/^[A-Z][A-Z\s]+$/.test(line)) return false;
        if (line.length < 3 || line.length > 35) return false;
        if (/REPUBLIKA|PHILIPPINES|REPUBLIC|PAMBANSANG|PAGKAKAKILANLAN|PHILIPPINE|IDENTIFICATION|CARD|APELYIDO|PANGALAN|GITNANG|PETSA|KAPANGANAKAN|TIRAHAN|LAST|FIRST|MIDDLE|GIVEN|BIRTH|DATE|ADDRESS|VALID|NAME/i.test(line)) return false;
        if (/PUROK|NAREGTA|LANAT|BARANGAY|BRGY|CITY|PROVINCE|STREET|ROAD|AVENUE|SAN|MANUEL|TARLAC|MANILA|QUEZON/i.test(line)) return false;
        return true;
      });
      
      if (!data.lastName && potentialNameLines[0]) data.lastName = potentialNameLines[0];
      if (!data.firstName && potentialNameLines[1]) {
        const parts = potentialNameLines[1].split(/\s+/);
        const midInitIdx = parts.findIndex(p => /^[A-Z]\.?$/.test(p));
        
        if (midInitIdx !== -1 && midInitIdx > 0) {
          data.firstName = parts.slice(0, midInitIdx).join(' ');
          if (!data.middleName) data.middleName = parts[midInitIdx].replace('.', '');
        } else {
          data.firstName = potentialNameLines[1];
        }
      }
      if (!data.middleName && potentialNameLines[2]) data.middleName = potentialNameLines[2];
    }

    return data;
  };

  // DRIVER'S LICENSE PARSER
  const parseDriversLicense = (text, lines) => {
    console.log("=== USING DRIVER'S LICENSE PARSER ===");
    const data = { idNumber: "", firstName: "", lastName: "", middleName: "", birthYear: "", birthMonth: "", birthDay: "", address: "" };

    const licensePattern = /\b([A-Z][0-9]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{6})\b/;
    const match = text.match(licensePattern);
    if (match) data.idNumber = match[1].replace(/\s+/g, '');

    const nameMatch = text.match(/([A-Z\s]+),\s*([A-Z\s]+?)(?:\s+([A-Z])\.?)?(?:\n|$)/);
    if (nameMatch) {
      data.lastName = nameMatch[1].trim();
      data.firstName = nameMatch[2].trim();
      if (nameMatch[3]) data.middleName = nameMatch[3];
    }

    const dateMatch = text.match(/([0-9]{2})[-/]([0-9]{2})[-/]([0-9]{4})/);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      const dateObj = new Date(`${year}-${month}-${day}`);
      if (!isNaN(dateObj)) {
        data.birthYear = year;
        data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
        data.birthDay = day;
      }
    }

    const addressMatch = text.match(/(?:ADDRESS|ADD)[:\s]*(.+?)(?=\n(?:DATE|BIRTH|EXPIRY|$))/is);
    if (addressMatch) data.address = addressMatch[1].trim().slice(0, 200);

    return data;
  };

  // PASSPORT PARSER
  const parsePassport = (text, lines) => {
    console.log("=== USING PASSPORT PARSER ===");
    const data = { idNumber: "", firstName: "", lastName: "", middleName: "", birthYear: "", birthMonth: "", birthDay: "", address: "" };
    
    // MRZ Strategy (Most Reliable)
    const mrzMatch = text.match(/P[<]?PHL([A-Z]+)[<]+([A-Z<]+)/);
    if (mrzMatch) {
      data.lastName = mrzMatch[1].replace(/<+/g, '').trim();
      const givenParts = mrzMatch[2].replace(/</g, ' ').trim().split(/\s+/).filter(p => p.length > 0);
      if (givenParts.length > 0) {
        data.firstName = givenParts[0];
        if (givenParts.length > 1) data.middleName = givenParts.slice(1).join(' ');
      }
    }

    // Passport Number
    const passportPatterns = [
      /\b([P][0-9]{6,8}[A-Z])\b/i,
      /([P][\s]?[0-9][\s]?[0-9]{5,7}[A-Z]?)/i,
      /\b([0-9]{7,9}[A-Z])\b/,
    ];
    for (const pattern of passportPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[1]) {
        const potentialNumber = matches[1].replace(/\s+/g, '');
        if (potentialNumber.length >= 6) {
          data.idNumber = potentialNumber.toUpperCase();
          break;
        }
      }
    }

    // Date of birth fallback
    const dateMatch = text.match(/([0-9]{2})[\s-]*([A-Z]{3})[\s-]*([0-9]{4})/i);
    if (dateMatch) {
      const [, day, monthAbbr, year] = dateMatch;
      const dateObj = new Date(`${monthAbbr} ${day}, ${year}`);
      if (!isNaN(dateObj) && parseInt(year) >= 1900 && parseInt(year) <= 2020) {
        data.birthYear = year;
        data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
        data.birthDay = day.padStart(2, '0');
      }
    }

    return data;
  };

  // MAIN PARSER WITH ID-TYPE ROUTING
  const parseIDText = (text, idType) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const idTypeLower = idType ? idType.toLowerCase() : '';

    if (idTypeLower.includes("national") || idTypeLower.includes("philid")) {
      return parsePhilippineNationalID(text, lines);
    }
    
    if (idTypeLower.includes("driver") || idTypeLower.includes("license")) {
      return parseDriversLicense(text, lines);
    }
    
    if (idTypeLower.includes("passport")) {
      return parsePassport(text, lines);
    }

    // Generic fallback parser 
    const data = { idNumber: "", firstName: "", lastName: "", middleName: "", birthYear: "", birthMonth: "", birthDay: "", address: "" };

    const datePatterns = [
      /\b([0-9]{1,2}[-/.]\s?[0-9]{1,2}[-/.]\s?[0-9]{4})\b/,
      /\b([0-9]{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+[0-9]{2,4})\b/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateObj = new Date(match[1].replace(/[/.]/g, '-'));
        if (!isNaN(dateObj) && dateObj.getFullYear() > 1900 && dateObj.getFullYear() < 2030) {
          data.birthYear = dateObj.getFullYear().toString();
          data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
          data.birthDay = dateObj.getDate().toString();
          break;
        }
      }
    }

    const idPatterns = [
      /\b([A-Z]{1,3}[-\s]?[0-9]{7,12})\b/,
      /\b([0-9]{4}[-\s]?[0-9]{4,7}[-\s]?[0-9]{4,7})\b/,
      /\b([A-Z0-9]{10,20})\b/
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        const idNum = (match[1] || match[0]).replace(/\s+/g, '');
        if (/\d/.test(idNum) && idNum.length >= 8) {
          data.idNumber = idNum;
          break;
        }
      }
    }

    const lastNameMatch = text.match(/(?:LAST\s+NAME|SURNAME|FAMILY\s+NAME)[:\s]*([A-Z][A-Z\s.'-]+?)(?:\n|FIRST|GIVEN|MIDDLE|,|$)/i);
    if (lastNameMatch) data.lastName = lastNameMatch[1].trim();

    const firstNameMatch = text.match(/(?:FIRST\s+NAME|GIVEN\s+NAME)[:\s]*([A-Z][A-Z\s.'-]+?)(?:\n|MIDDLE|LAST|,|$)/i);
    if (firstNameMatch) data.firstName = firstNameMatch[1].trim();

    return data;
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex items-center justify-center px-4 py-8">
      
      {/* HIDDEN CANVAS FOR PROCESSING */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">Verify your account</h2>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="h-2 w-12 bg-green-700 rounded-full"></div>
          <div className="h-2 w-12 bg-green-700 rounded-full"></div>
          <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Selected ID Display */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Selected ID Type</p>
          <p className="font-bold text-green-800 text-lg">{currentIDType || "Loading..."}</p>
        </div>
        
        <p className="text-gray-600 text-xs mb-6 text-center">
          Upload clear photos of both sides of your ID. We'll automatically extract your information. After scanning, you'll be able to review and correct any information.
        </p>
        
        {/* Upload Buttons Container */}
        <div className="space-y-4 mb-6">
          
          {/* Front ID Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Front of ID</label>
            {frontPreview ? (
              <div className="relative group w-full bg-gray-50 rounded-lg border-2 border-green-500 overflow-hidden">
                <img 
                  src={frontPreview} 
                  alt="Front Preview" 
                  className="w-full h-auto block" 
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFile('front')}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-90 hover:opacity-100 shadow-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => document.getElementById("front-upload").click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-green-500 transition-colors"
              >
                <Camera className="mb-2 opacity-50" size={32} />
                <span className="text-sm">Tap to upload Front</span>
              </button>
            )}
            <input id="front-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'front')} />
          </div>

          {/* Back ID Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Back of ID</label>
            {backPreview ? (
              <div className="relative group w-full bg-gray-50 rounded-lg border-2 border-green-500 overflow-hidden">
                <img 
                  src={backPreview} 
                  alt="Back Preview" 
                  className="w-full h-auto block" 
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFile('back')}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-90 hover:opacity-100 shadow-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => document.getElementById("back-upload").click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-green-500 transition-colors"
              >
                <Upload className="mb-2 opacity-50" size={32} />
                <span className="text-sm">Tap to upload Back</span>
              </button>
            )}
            <input id="back-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'back')} />
          </div>
        </div>

        {/* Show extracted text */}
        {extractedText && (
          <details className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-xs">
            <summary className="font-bold text-yellow-800 cursor-pointer mb-2">
              ⚠️ OCR Debug Info - Check Text
            </summary>
            <div className="p-2 bg-white rounded border border-gray-200">
              <p className="font-semibold text-gray-700 mb-1">Raw Scanned Text:</p>
              <pre className="whitespace-pre-wrap text-gray-600 max-h-32 overflow-y-auto text-xs">
                {extractedText}
              </pre>
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isScanning}
            className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            onClick={handleScanAndNext}
            disabled={!frontFile || !backFile || isScanning || !currentIDType}
            className={`flex-[2] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              frontFile && backFile && !isScanning && currentIDType
                ? "bg-green-700 text-white hover:bg-green-800 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="text-sm">{scanStatus || "Scanning..."}</span>
              </>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                Scan & Next
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}