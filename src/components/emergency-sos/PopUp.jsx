import { useEffect, useState, useRef } from "react";

export const EmergencyPopup = ({ onCancel, onSendNow }) => {
  const [countdown, setCountdown] = useState(15);
  const firedRef = useRef(false);

  useEffect(() => {
    if (countdown === 0 && !firedRef.current) {
      firedRef.current = true;
      onSendNow();
      return;
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onSendNow]);

  const handleSend = () => {
    if (firedRef.current) {
      return;
    }

    firedRef.current = true;
    onSendNow();
  };

  const handleCancel = () => {
    firedRef.current = true;
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-background bg-opacity-10 flex flex-col justify-center items-center text-center z-[999] px-6">
      <p className="text-lg mb-6 text-primary max-w-2xl">
        You have triggered the <strong className="text-highlight">EMERGENCY</strong> button. If this was a
        mistake, you can cancel within the next <span className="text-highlight font-bold">{countdown} seconds</span>.
        Otherwise, the alert will be sent automatically.
      </p>
      <div className="flex flex-row justify-center gap-8">
        <button
          className="bg-highlight text-white font-bold px-6 py-2 rounded-md hover:bg-[#8d8605] transition"
          onClick={handleSend}
        >
          Send NOW
        </button>
        <button
          className="bg-green-900 text-white font-bold px-6 py-2 rounded-md hover:bg-green-950 transition"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
