import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyID() {
  const [selectedID, setSelectedID] = useState("");
  const navigate = useNavigate();

  const ids = [
    "Driver’s License", 
    "UMID", 
    "Postal ID", 
    "Passport", 
    "SSS", 
    "PRC ID",
    "HDMF (Pag-IBIG ID)",
    "National ID",
    "ePHIL ID",
    "Student ID"
  ];

  const handleNext = (e) => {
    e.preventDefault();
    if (!selectedID) return;
    navigate("/upload-id", { state: { selectedID } });
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-30 px-4">
      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">
          Verify your account
        </h2>

        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-gray-300 rounded"></div>
          <div className="h-1 w-8 bg-gray-300 rounded"></div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 text-center">
          Choose an ID to get verified.
        </p>

        <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-1">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedID(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left font-medium transition ${
                selectedID === id
                  ? "border-green-700 bg-green-50 text-green-700"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              <span>{id}</span>
              <span
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  selectedID === id ? "border-green-700" : "border-gray-400"
                }`}
              >
                {selectedID === id && (
                  <span className="h-2 w-2 bg-green-700 rounded-full"></span>
                )}
              </span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          onClick={handleNext}
          disabled={!selectedID}
          className={`w-full mt-4 py-3 rounded-lg font-medium ${
            selectedID
              ? "bg-green-800 text-white hover:bg-green-900"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
