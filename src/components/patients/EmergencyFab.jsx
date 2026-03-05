import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { EmergencyPopup } from "../emergency-sos/PopUp";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import RescueChatFab from "./rescue/RescueChatFab";
import api from "../../services/api";

/**
 * EmergencyFab — global floating action button for patient pages.
 *
 * Behaviour:
 *  • Default: shows the red "Emergency SOS" button.
 *  • When the patient has an active emergency response (is being rescued),
 *    automatically swaps to a blue "Chat with Responder" button that deep-links
 *    to the patient ↔ responder conversation thread.
 *
 * @param {string} [activeIncidentId] — If the parent already knows the active
 *        incident id, pass it to skip the extra API call.
 */
export default function EmergencyFab({ activeIncidentId: propIncidentId } = {}) {
  const [showPopup, setShowPopup] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Active-rescue detection (auto-switch to Chat FAB) ---
  const [detectedIncidentId, setDetectedIncidentId] = useState(null);
  const [pendingEmergencyAt, setPendingEmergencyAt] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem("pendingEmergencyAt");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const persistPendingEmergency = useCallback((timestamp) => {
    setPendingEmergencyAt(timestamp);
    if (typeof window !== "undefined") {
      if (timestamp) {
        window.sessionStorage.setItem("pendingEmergencyAt", String(timestamp));
      } else {
        window.sessionStorage.removeItem("pendingEmergencyAt");
      }
    }
  }, []);

  const syncActiveIncident = useCallback(async () => {
    if (propIncidentId) {
      setDetectedIncidentId(propIncidentId);
      persistPendingEmergency(null);
      return;
    }

    try {
      const res = await api.get("/rescue/active");
      if (res.data?.has_active_rescue) {
        setDetectedIncidentId(res.data?.data?.incident?.id ?? null);
        persistPendingEmergency(null);
      } else {
        setDetectedIncidentId(null);
      }
    } catch {
      // Silently ignore — keep existing UI state
    }
  }, [propIncidentId, persistPendingEmergency]);

  useEffect(() => {
    syncActiveIncident();

    const intervalId = window.setInterval(syncActiveIncident, 10000);
    const onFocus = () => syncActiveIncident();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncActiveIncident]);

  const activeIncidentId = propIncidentId ?? detectedIncidentId;
  const hasPendingEmergency = useMemo(() => {
    if (!pendingEmergencyAt) return false;
    // Show Chat for up to 10 minutes after reporting while incident assignment syncs.
    return Date.now() - pendingEmergencyAt < 10 * 60 * 1000;
  }, [pendingEmergencyAt]);

  // Lifecycle rule:
  // State 1 (no active/pending incident): SOS button
  // State 2 (active incident reported): Chat button
  if (activeIncidentId || hasPendingEmergency) {
    return <RescueChatFab incidentId={activeIncidentId} />;
  }

  // --- Standard Emergency SOS logic ---
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
    persistPendingEmergency(Date.now());

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