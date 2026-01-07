import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ScanLine, Loader2, Camera } from "lucide-react";
import Tesseract from 'tesseract.js';

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const { selectedID } = location.state || {};
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setPreview(URL.createObjectURL(uploadedFile));
    }
  };

  const handleUploadClick = () => {
    document.getElementById("file-upload").click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    document.getElementById("file-upload").value = "";
  };

  // --- IMAGE PRE-PROCESSING ---
  const preprocessImage = (imageFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get raw pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply Grayscale & High Contrast
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const color = avg > 120 ? 255 : 0; 
          data[i] = color;     
          data[i + 1] = color; 
          data[i + 2] = color; 
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleScanAndNext = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsScanning(true);
    setScanStatus("Cleaning image...");

    try {
      const cleanImageURL = await preprocessImage(file);
      
      setScanStatus("Reading text...");
      
      const result = await Tesseract.recognize(
        cleanImageURL,
        'eng',
        { logger: m => {
            if(m.status === 'recognizing text') {
              setScanStatus(`Scanning... ${Math.round(m.progress * 100)}%`);
            }
          } 
        }
      );

      const text = result.data.text;
      console.log("Extracted Text:", text);

      setScanStatus("Analyzing data...");
      const extractedData = parseIDText(text);

      navigate("/fill-info", { 
        state: { 
          selectedID, 
          file, 
          scannedData: extractedData 
        } 
      });

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Auto-scan failed. Please enter details manually.");
      navigate("/fill-info", { state: { selectedID, file } });
    } finally {
      setIsScanning(false);
    }
  };

  const parseIDText = (text) => {
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: ""
    };

    const dateRegex = /(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})|(\d{1,2}\s+[A-Z]{3,}\s+\d{4})|([A-Z]{3,}\s+\d{1,2}\s+\d{4})/i;
    const dateMatch = text.match(dateRegex);

    if (dateMatch) {
      const dateStr = dateMatch[0].replace(/\//g, '-');
      const dateObj = new Date(dateStr);
      
      if (!isNaN(dateObj)) {
        data.birthYear = dateObj.getFullYear().toString();
        data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
        data.birthDay = dateObj.getDate().toString();
      }
    }

    const idMatches = text.match(/(?<!09)\b([A-Z0-9]{1,4}[- ]?){3,}\b/g);
    
    if (idMatches) {
        const likelyID = idMatches.find(m => {
            const numbers = m.replace(/[^0-9]/g, '');
            return numbers.length >= 7 && numbers.length <= 16;
        });
        if (likelyID) data.idNumber = likelyID.replace(/\s/g, ''); 
    }

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const upperCaseLines = lines.filter(l => /^[A-Z\s.-]+$/.test(l) && l.length > 5 && !/\d/.test(l));
    
    if (upperCaseLines.length > 0) {
        const parts = upperCaseLines[0].split(' ');
        if (parts.length > 1) {
            data.lastName = parts[0]; 
            data.firstName = parts.slice(1).join(' ');
        }
    }

    return data;
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-35 px-4 pb-10">
      
      {/* HIDDEN CANVAS FOR PROCESSING */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">Verify your account</h2>

        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-gray-300 rounded"></div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center">{selectedID}</h2>
        
        <p className="text-muted-foreground text-sm mb-4 text-center">
          Upload a clear photo. We will try to scan it for you.
        </p>

        {/* File Preview */}
        {preview && (
          <div className="relative w-full mb-4">
            <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-lg border bg-gray-100" />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Buttons */}
        {!file && (
          <div className="w-full flex flex-col space-y-4">
            <button
              onClick={handleUploadClick}
              className="w-full py-3 rounded-lg font-semibold bg-primary text-white hover:bg-[#70B85C]"
            >
              Upload File
            </button>
            <button
              onClick={() => document.getElementById("file-scan").click()}
              className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white sm:hidden flex justify-center items-center gap-2"
            >
              <Camera size={20} /> Take Photo
            </button>

            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
             <input
              id="file-scan"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate("/verify-id")}
            disabled={isScanning}
            className="flex-1 py-3 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Back
          </button>
          
          <button
            type="submit"
            onClick={handleScanAndNext}
            disabled={!file || isScanning}
            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
              file
                ? "bg-green-800 text-white hover:bg-green-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                {scanStatus || "Scanning..."}
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