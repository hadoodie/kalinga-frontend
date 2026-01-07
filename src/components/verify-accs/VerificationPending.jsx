import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Clock, RefreshCw, LogOut } from "lucide-react"; 
import api from "../../services/api";

export default function VerificationPending() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      // Re-fetch the user data to see if status changed to 'verified'
      const response = await api.get("/me");
      const updatedUser = response.data;

      // Update local context
      setUser(updatedUser);
      
      if (updatedUser.verification_status === "verified") {
        alert("Great news! Your account has been verified.");
        navigate("/patient/dashboard");
      } else if (updatedUser.verification_status === "rejected") {
        alert("Your verification was rejected. Please try again.");
        navigate("/verify-id");
      } else {
        alert("Your account is still under review. Please check back later.");
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center text-center">
        
        {/* Icon */}
        <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-yellow-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verification Pending
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Thank you for submitting your ID! Our team is currently reviewing your documents to ensure the safety of our community.
        </p>

        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 w-full text-sm text-gray-500">
          <p>This process usually takes <strong>24-48 hours</strong>.</p>
          <p className="mt-1">You will be notified once your account is active.</p>
        </div>

        {/* Actions */}
        <button
          onClick={handleCheckStatus}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-green-700 text-white hover:bg-green-800 transition mb-3"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking..." : "Check Status"}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}