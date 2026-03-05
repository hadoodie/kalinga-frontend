/**
 * RescueChatFab — Contextual floating action button shown ONLY during active
 * rescue tracking. Replaces the default EmergencyFab with a "Chat" button that
 * opens the patient ↔ responder conversation thread for the current incident.
 */

import { useState, useCallback } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import responseModeService from "../../../services/responseMode";

export default function RescueChatFab({ incidentId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const openChat = useCallback(async () => {
    if (!incidentId || loading) return;
    setLoading(true);

    try {
      // Fetch the specific conversation for this incident
      const conversation = await responseModeService.getConversation(incidentId);

      // Navigate to messages with the incident context so the Messages
      // component can auto-select the correct conversation thread.
      navigate("/patient/messages", {
        state: {
          filterCategory: "Emergency",
          openIncidentChat: {
            incidentId,
            conversationId: conversation?.id ?? conversation?.conversationId ?? null,
          },
        },
      });
    } catch (err) {
      console.error("Failed to open rescue chat:", err);
      // Fallback — open messages with emergency filter only
      navigate("/patient/messages", {
        state: { filterCategory: "Emergency" },
      });
    } finally {
      setLoading(false);
    }
  }, [incidentId, loading, navigate]);

  return (
    <button
      type="button"
      onClick={openChat}
      disabled={loading}
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 active:scale-95 flex items-center justify-center group"
      title="Chat with Responder"
    >
      {loading ? (
        <Loader2 size={28} className="animate-spin" />
      ) : (
        <MessageCircle size={28} />
      )}
      <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with Responder
      </span>
    </button>
  );
}
