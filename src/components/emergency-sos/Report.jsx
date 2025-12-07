import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { emergencyButton } from "@images";
import { EmergencyPopup } from "/src/components/emergency-sos/PopUp";

export const EmergencyReport = () => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

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

  const handleSendNow = async () => {
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

  const handleCancel = () => {
    setShowPopup(false);
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <section className="flex items-center justify-center w-full h-full box-border">
        <div className="text-center max-w-3xl w-full text-primary">
          <h4 className="text-[1.3rem] font-bold m-0">REPORT</h4>
          <h1 className="text-5xl font-extrabold my-2">EMERGENCY</h1>
          <p className="text-sm mb-3">
            Tap the button to report your emergency and get the assistance you
            need right away.
          </p>
          <img
            src={emergencyButton}
            alt="Emergency Button"
            className="w-1/2 h-auto mb-3 cursor-pointer mx-auto"
            onClick={() => setShowPopup(true)}
          />
          <p className="text-sm text-primary max-w-[90%] mx-auto">
            This <strong>EMERGENCY</strong> feature is intended for emergency
            situations only. Please use it responsibly to ensure timely
            assistance during critical moments.
          </p>
        </div>
        {showPopup && (
          <EmergencyPopup onSendNow={handleSendNow} onCancel={handleCancel} />
        )}
      </section>
    </div>
  );
};
