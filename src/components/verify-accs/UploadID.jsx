import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ScanLine, Loader2, Camera, Upload } from "lucide-react";

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedID } = location.state || {};
  
  // State for Front ID
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);

  // State for Back ID
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  // Handle file selection 
  const handleFileChange = (e, type) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (type === 'front') {
        setFrontFile(uploadedFile);
        setFrontPreview(URL.createObjectURL(uploadedFile));
      } else {
        setBackFile(uploadedFile);
        setBackPreview(URL.createObjectURL(uploadedFile));
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

  const handleScanAndNext = async (e) => {
    e.preventDefault();
    if (!frontFile || !backFile) {
      alert("Please upload both the Front and Back of your ID.");
      return;
    }

    setIsScanning(true);
    setScanStatus("Uploading and analyzing...");

    try {
      const formData = new FormData();
      formData.append('image', frontFile); 
      formData.append('image_back', backFile);

      const response = await fetch('http://127.0.0.1:8000/api/parse-id', {
        method: 'POST',
        headers: {
          'Accept': 'application/json', 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Server failed to process image");
      }

      const extractedData = await response.json();
      console.log("Python Data:", extractedData);

      if (extractedData.error) {
          throw new Error(extractedData.error);
      }

      navigate("/fill-info", { 
        state: { 
          selectedID, 
          frontFile,
          backFile,
          scannedData: extractedData 
        } 
      });

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Auto-scan failed. Please enter details manually.\n\nError: " + error.message);
      navigate("/fill-info", { state: { selectedID, frontFile, backFile } });
    } finally {
      setIsScanning(false);
    }
  };

  // Reusable Upload Box Component
  const UploadBox = ({ type, label, file, preview }) => (
    <div className="w-full mb-4">
      <p className="text-sm font-semibold mb-2 text-gray-700">{label}</p>
      
      {preview ? (
        <div className="relative w-full">
          <img src={preview} alt={`${type} Preview`} className="w-full h-40 object-cover rounded-lg border bg-gray-100" />
          <button
            type="button"
            onClick={() => handleRemoveFile(type)}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black transition"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => document.getElementById(`${type}-upload`).click()}
          className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition bg-white"
        >
          <div className="bg-green-100 p-2 rounded-full mb-2">
            <Upload size={20} className="text-green-700" />
          </div>
          <span className="text-xs text-gray-500">Tap to upload {label}</span>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        id={`${type}-upload`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, type)}
      />
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-35 px-4 pb-10">
      
      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">Verify your account</h2>

        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-gray-300 rounded"></div>
        </div>

        <h2 className="text-xl font-bold mb-2 text-center">{selectedID}</h2>
        
        <p className="text-muted-foreground text-xs mb-6 text-center">
          Please upload clear photos of both the front and back of your ID.
        </p>

        {/* Upload Sections */}
        <div className="flex flex-col gap-2">
          <UploadBox type="front" label="Front of ID" file={frontFile} preview={frontPreview} />
          <UploadBox type="back" label="Back of ID" file={backFile} preview={backPreview} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/verify-id")}
            disabled={isScanning}
            className="flex-1 py-3 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
          >
            Back
          </button>
          
          <button
            type="submit"
            onClick={handleScanAndNext}
            disabled={!frontFile || !backFile || isScanning}
            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
              frontFile && backFile
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