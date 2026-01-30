import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ScanLine, Loader2, Camera } from "lucide-react";

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();

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
    if(document.getElementById("file-upload")) document.getElementById("file-upload").value = "";
    if(document.getElementById("file-scan")) document.getElementById("file-scan").value = "";
  };

  const handleScanAndNext = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsScanning(true);
    setScanStatus("Uploading and analyzing...");

    try {
      const formData = new FormData();
      formData.append('image', file);

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
          file, 
          scannedData: extractedData 
        } 
      });

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Auto-scan failed. Please enter details manually.\n\nError: " + error.message);
      navigate("/fill-info", { state: { selectedID, file } });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-35 px-4 pb-10">
      
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
          Upload a clear photo. We will scan it using our secure server.
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

        {/* Upload Buttons */}
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

            {/* Hidden Inputs */}
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

        {/* Action Buttons */}
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