import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { emergencyButton } from "@images";
import { EmergencyPopup } from "/src/components/emergency-sos/PopUp";
import { useAuth } from "../../context/AuthContext";
import { submitEmergencyReport } from "../../services/emergencyService";
import { getCurrentLocation } from "../../utils/location";

export const EmergencyReport = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSendNow = useCallback(async () => {
    if (isSending) {
      return;
    }

    setShowPopup(false);

    if (!user) {
      setStatus({
        type: "error",
        message: "You must be signed in to send an emergency alert.",
      });
      return;
    }

    setIsSending(true);
    setStatus({ type: "pending", message: "Sending emergency alert..." });

    const triggeredAt = new Date().toISOString();
    let locationInfo = null;
    let locationError = null;

    try {
      const result = await getCurrentLocation({ timeout: 12000 });
      if (result.ok) {
        locationInfo = result.coords;
      } else {
        locationError = result.error;
      }
    } catch (error) {
      locationError =
        error?.message ||
        "Unable to access location automatically. Please share it manually if prompted.";
    }

    try {
      await submitEmergencyReport({
        user,
        location: locationInfo,
        locationError,
        triggeredAt,
      });

      setStatus({
        type: "success",
        message: "Emergency alert sent to responders. Stay near your device for updates.",
      });
    } catch (error) {
      const fallbackMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send emergency alert. Please try again or call your local emergency number.";

      setStatus({ type: "error", message: fallbackMessage });
    } finally {
      setIsSending(false);
    }
  }, [isSending, user]);

  const handleCancel = () => {
    if (isSending) {
      return;
    }
    setShowPopup(false);
  };

  const handleOpenChat = () => {
    navigate("/patient/messages", {
      state: {
        filterCategory: "Emergency",
      },
    });
  };

  const renderStatusBanner = () => {
    if (!status) {
      return null;
    }

    const baseClasses = {
      success: "bg-green-50 text-green-800 border-green-200",
      error: "bg-red-50 text-red-800 border-red-200",
      pending: "bg-blue-50 text-blue-800 border-blue-200",
    };

    const tone = baseClasses[status.type] || baseClasses.pending;

    return (
      <div className={`mt-6 px-4 py-3 rounded-md border text-sm ${tone}`}>
        <p className="m-0">{status.message}</p>
        {status.type === "success" && (
          <button
            type="button"
            className="mt-3 inline-flex items-center text-xs font-semibold underline hover:no-underline"
            onClick={handleOpenChat}
          >
            Open emergency chat
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <section className="flex flex-col items-center justify-center w-full h-full box-border px-4">
        <div className="text-center max-w-3xl w-full text-primary">
          <h4 className="text-[1.3rem] font-bold m-0">REPORT</h4>
          <h1 className="text-5xl font-extrabold my-2">EMERGENCY</h1>
          <p className="text-sm mb-3">
            Tap the button to report your emergency and get the assistance you need right away.
          </p>
          <img
            src={emergencyButton}
            alt="Emergency Button"
            className={`w-1/2 h-auto mb-3 mx-auto ${
              isSending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={() => {
              if (!isSending) {
                setShowPopup(true);
              }
            }}
          />
          <p className="text-sm text-primary max-w-[90%] mx-auto">
            This <strong>EMERGENCY</strong> feature is intended for emergency situations only. Please
            use it responsibly to ensure timely assistance during critical moments.
          </p>
          {renderStatusBanner()}
        </div>
        {showPopup && (
          <EmergencyPopup
            onSendNow={handleSendNow}
            onCancel={handleCancel}
            isProcessing={isSending}
          />
        )}
      </section>
    </div>
  );
};
