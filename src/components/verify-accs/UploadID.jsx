import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedID } = location.state || {};
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

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

  const handleScanClick = () => {
    document.getElementById("file-scan").click();
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!file) return;
    navigate("/fill-info", { state: { selectedID, file } });
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-35 px-4 pb-10">
      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">
          Verify your account
        </h2>

        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-gray-300 rounded"></div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center">{selectedID}</h2>

        <p className="text-sm font-medium mb-4">
          Make sure to follow these tips!
        </p>

        {/* Tips List */}
        <ul className="list-none text-left w-full space-y-4 mb-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Malinaw at nababasa ang mga nakasulat sa ID (Full Name, Birthdate,
              at Address)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Siguraduhin na tugma ang ID photo sa selfie</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Kuhanan ng litrato ang tunay na ID, at hindi photocopy</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>
              Kumpleto at tama ang lahat ng personal information na nasa ID
            </span>
          </li>
        </ul>

        <p className="text-muted-foreground text-sm mb-4 text-center">
          Upload a clear photo or scanned copy of your{" "}
          <span className="font-medium">{selectedID}</span>.
        </p>

        {/* File Preview */}
        {preview && (
          <div className="relative w-full mb-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg border"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Buttons for Uploading/Scanning */}
        {!file && (
          <div className="w-full flex flex-col space-y-4">
            <button
              onClick={handleUploadClick}
              className="w-full py-3 rounded-lg font-semibold bg-primary text-white hover:bg-[#70B85C]"
            >
              Upload File
            </button>
            <button
              onClick={handleScanClick}
              className="w-full py-3 rounded-lg font-semibold bg-primary text-white transition sm:hidden"
            >
              Scan your ID
            </button>

            {/* Hidden inputs */}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/verify-id")}
            className="flex-1 py-3 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Back
          </button>
          <button
            type="submit"
            onClick={handleNext}
            disabled={!file}
            className={`flex-1 py-3 rounded-lg font-medium ${
              file
                ? "bg-green-800 text-white hover:bg-green-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
