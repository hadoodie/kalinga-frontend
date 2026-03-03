import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { EmergencyPopup } from "../emergency-sos/PopUp"; 
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function EmergencyFab() {
  const [showPopup, setShowPopup] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();


  // Emergency logic (same as Sidebar/Report)
  const resolveLocation = () =>
    new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve({ error: "Geolocation is not supported on this device." });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          }),
        (error) =>
          resolve({
            error:
              error?.message ||
              "Unable to access location automatically. Please share it manually if prompted.",
          }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });

  const handleEmergencySend = async () => {
    setShowPopup(false);
    const triggeredAt = new Date().toISOString();
    let locationPayload = { location: null, error: null };
    try {
      locationPayload = await resolveLocation();
    } catch (error) {
      locationPayload = {
        error:
          error?.message ||
          "Unable to access location automatically. Please share it manually if prompted.",
      };
    }
    navigate("/patient/messages", {
      state: {
        filterCategory: "Emergency",
        startEmergencyChat: {
          triggeredAt,
          ...(locationPayload.location ? { location: locationPayload.location } : {}),
          ...(locationPayload.error ? { locationError: locationPayload.error } : {}),
        },
      },
    });
  };

  const handleEmergencyCancel = () => {
    setShowPopup(false);
    toast({
      title: "Cancelled",
      description: "Emergency alert cancelled.",
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setShowPopup(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 flex items-center justify-center group"
        title="Emergency SOS"
      >
        <AlertCircle size={32} className="animate-pulse" />
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Emergency SOS
        </span>
      </button>

      {/* Popup Modal */}
      {showPopup && (
        <EmergencyPopup
          onSendNow={handleEmergencySend}
          onCancel={handleEmergencyCancel}
        />
      )}
    </>
  );
}