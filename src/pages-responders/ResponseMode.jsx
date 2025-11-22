import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Clock, Loader2, Map } from "lucide-react";
import ResponderSidebar from "../components/responder/Sidebar";
import ResponderTopbar from "../components/responder/Topbar";
import ContextGeneratorPanel from "../components/responder/response-mode/ContextGeneratorPanel";
import ConversationPanel from "../components/responder/response-mode/ConversationPanel";
import NavigationPanel from "../components/responder/response-mode/NavigationPanel";
import responseModeService from "../services/responseMode";
import { ROUTES } from "../config/routes";
import { useAuth } from "../context/AuthContext";
import useConversationInsights from "../hooks/useConversationInsights";
import { useRealtime } from "../context/RealtimeContext";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import { insertMessageChronologically, normalizeMessage } from "../lib/chatUtils";
import { useIncidents } from "../context/IncidentContext";
import { useReverseGeocode } from "../hooks/useReverseGeocode";

const LOCK_STATUSES = new Set(["on_scene", "hospital_transfer", "resolved"]);

const timestampOfStatus = (history, statuses) => {
  if (!Array.isArray(history)) return null;
  const entry = history.find((item) => statuses.includes(item?.status));
  if (!entry) return null;
  const parsed = Date.parse(entry.created_at || entry.created_at_human);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function ResponseMode() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents } = useIncidents(); // Ensure incidents are available if needed, though we use params
  
  const {
    messages,
    setMessages,
    loading,
    error,
    setError,
    conversation,
    setConversation,
    hospitals,
    setHospitals,
    incident,
  } = useResponseModeData(incidentId, user?.id, navigate);

  // Extract coordinates for reverse geocoding
  const incidentLat = incident?.latitude || incident?.location_lat;
  const incidentLng = incident?.longitude || incident?.location_lng;
  const { address: incidentAddress } = useReverseGeocode(incidentLat, incidentLng);

  const lockTimestamp = useMemo(
    () => timestampOfStatus(incident?.history, Array.from(LOCK_STATUSES)),
    [incident]
  );

  const insights = useConversationInsights(messages, { lockTimestamp });

  const deriveParticipantName = useCallback(
    (conversationPayload) => {
      if (!conversationPayload) {
        return "Patient";
      }

      if (conversationPayload.participant?.name) {
        return conversationPayload.participant.name;
      }

      if (Array.isArray(conversationPayload.participants)) {
        const other = conversationPayload.participants.find((person) => {
          if (!person) return false;
          if (!user?.id) return true;
          return person.id !== user.id;
        });
        if (other?.name) {
          return other.name;
        }
      }

      return conversationPayload.participant?.name || "Patient";
    },
    [user?.id]
  );

  const formatMessageForDisplay = useCallback(
    (rawMessage, fallbackName = "Patient") => {
      if (!rawMessage) {
        return null;
      }

      const normalized = normalizeMessage(
        rawMessage,
        fallbackName,
        user?.id ?? null
      );

      return {
        ...normalized,
        body: normalized.text ?? normalized.body ?? "",
        createdAt: normalized.timestamp,
      };
    },
    [user?.id]
  );

  const hydrateMessages = useCallback(
    (rawMessages, fallbackName) => {
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        setMessages([]);
        return;
      }

      const normalized = rawMessages
        .map((message) => formatMessageForDisplay(message, fallbackName))
        .filter(Boolean);
      setMessages(normalized);
    },
    [formatMessageForDisplay]
  );

  const appendRealtimeMessage = useCallback(
    (rawMessage, fallbackName) => {
      const prepared = formatMessageForDisplay(rawMessage, fallbackName);
      if (!prepared) return;

      setMessages((prev) => {
        if (prev.some((message) => message.id === prepared.id)) {
          return prev;
        }
        return insertMessageChronologically(prev, prepared);
      });
    },
    [formatMessageForDisplay]
  );

  const applyConversationPayload = useCallback(
    (payload) => {
      if (!payload) {
        setConversation(null);
        setMessages([]);
        return;
      }

      setConversation(payload);
      const fallbackName = deriveParticipantName(payload);
      hydrateMessages(payload.messages ?? [], fallbackName);
    },
    [deriveParticipantName, hydrateMessages]
  );

  const handleExit = () => {
    navigate(ROUTES.RESPONDER.DASHBOARD);
  };

  useEffect(() => {
    if (!incidentId || !user?.id) {
      return;
    }

    let chatChannel;
    let incidentsChannel;
    let cancelled = false;

    const subscribeToRealtime = async () => {
      const result = await ensureConnected();
      if (!result?.ok || cancelled) {
        return;
      }

      const echoInstance = getEchoInstance?.();
      if (!echoInstance) {
        return;
      }

      reconnectEcho();

      const chatChannelName = `chat.user.${user.id}`;

      try {
        chatChannel = echoInstance.private(chatChannelName);
        chatChannel.listen(".message.sent", (payload) => {
          if (!payload?.message) {
            return;
          }

          const activeConversation = conversationRef.current;
          const activeIncident = incidentRef.current;

          const activeIncidentIdString = activeIncident?.id
            ? String(activeIncident.id)
            : incidentId
            ? String(incidentId)
            : null;
          const activeConversationIdString = activeConversation
            ? String(
                activeConversation.conversationId ?? activeConversation.id
              )
            : null;

          const payloadIncidentId =
            payload?.incident_id ??
            payload?.conversation?.incident_id ??
            payload?.conversation?.incidentId ??
            payload?.message?.incident_id ??
            payload?.message?.incidentId ??
            null;
          const payloadIncidentIdString =
            payloadIncidentId !== null ? String(payloadIncidentId) : null;

          const payloadConversationId =
            payload?.conversation?.conversationId ??
            payload?.conversation?.id ??
            payload?.message?.conversation_id ??
            payload?.message?.conversationId ??
            null;
          const payloadConversationIdString =
            payloadConversationId !== null
              ? String(payloadConversationId)
              : null;

          if (
            payloadIncidentIdString &&
            activeIncidentIdString &&
            payloadIncidentIdString !== activeIncidentIdString
          ) {
            return;
          }

          if (
            payloadConversationIdString &&
            activeConversationIdString &&
            payloadConversationIdString !== activeConversationIdString
          ) {
            return;
          }

          if (payload?.conversation) {
            setConversation((prev) => ({
              ...(prev ?? {}),
              ...payload.conversation,
            }));
          }

          const participantName = deriveParticipantName(
            payload?.conversation ?? activeConversation
          );
          appendRealtimeMessage(payload.message, participantName);
        });
      } catch (error) {
        console.error("Failed to subscribe to chat realtime channel", error);
      }

      try {
        incidentsChannel = echoInstance.join("incidents");
        incidentsChannel.listen(".IncidentUpdated", (payload) => {
          if (!payload?.incident) {
            return;
          }

          const updatedId = payload.incident.id ?? payload.incident_id;
          if (
            updatedId !== undefined &&
            String(updatedId) !== String(incidentId)
          ) {
            return;
          }

          setIncident((prev) => ({ ...(prev ?? {}), ...payload.incident }));
        });
      } catch (error) {
        console.error("Failed to subscribe to incident realtime channel", error);
      }
    };

    subscribeToRealtime();

    return () => {
      cancelled = true;

      if (chatChannel) {
        try {
          chatChannel.stopListening(".message.sent");
        } catch (error) {
          console.warn("Failed to stop chat realtime listener", error);
        }
      }

      if (incidentsChannel) {
        try {
          incidentsChannel.stopListening(".IncidentUpdated");
        } catch (error) {
          console.warn("Failed to stop incident realtime listener", error);
        }
      }
    };
  }, [incidentId, user?.id, ensureConnected, appendRealtimeMessage, deriveParticipantName]);

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <ResponderSidebar />
        <div className="flex-1 flex flex-col">
          <ResponderTopbar />
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex">
        <ResponderSidebar />
        <div className="flex-1 flex flex-col">
          <ResponderTopbar />
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="bg-white border border-red-100 rounded-2xl p-6 text-center max-w-md">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={handleExit}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
              >
                Back to dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ResponderSidebar />
      <div className="flex-1 flex flex-col">
        <ResponderTopbar />
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                    Response Mode
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    Incident #{incident?.id}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Map className="h-6 w-6 text-primary" />
                  {incident?.type || "Active deployment"}
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {incidentAddress || incident?.location}
                  {incidentAddress && incident?.location && incidentAddress !== incident.location && (
                    <span className="text-xs text-gray-400">({incident.location})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
                  <p className="text-sm font-bold text-gray-900">
                    {incident?.status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
                  </p>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                <button
                  type="button"
                  onClick={handleExit}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  Exit Response Mode
                </button>
              </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-full min-h-[520px]">
                <ConversationPanel
                  conversation={conversation}
                  messages={messages}
                  loading={loading}
                  onBack={handleExit}
                  currentUserId={user?.id}
                />
              </div>
              <ContextGeneratorPanel insights={insights} locked={Boolean(lockTimestamp)} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NavigationPanel incident={incident} hospitals={hospitals} incidentAddress={incidentAddress} />
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Response Timeline
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    Live Updates
                  </span>
                </div>

                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                  {incident?.history?.length ? (
                    incident.history.map((entry, index) => (
                      <div key={entry.id || index} className="relative">
                        <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {entry.status?.replace(/_/g, " ")}
                          </p>
                          <span className="text-xs text-gray-500 font-mono">
                            {entry.created_at_human || new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-gray-600 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900">
                          Incident Created
                        </p>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Waiting for updates...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function useResponseModeData(incidentId, userId, navigate) {
  const [messages, setMessages] = useState([]);
  const [incident, setIncident] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const conversationRef = useRef(null);
  const incidentRef = useRef(null);

  const lockTimestamp = useMemo(
    () => timestampOfStatus(incident?.history, Array.from(LOCK_STATUSES)),
    [incident]
  );

  const insights = useConversationInsights(messages, { lockTimestamp });

  const deriveParticipantName = useCallback(
    (conversationPayload) => {
      if (!conversationPayload) {
        return "Patient";
      }

      if (conversationPayload.participant?.name) {
        return conversationPayload.participant.name;
      }

      if (Array.isArray(conversationPayload.participants)) {
        const other = conversationPayload.participants.find((person) => {
          if (!person) return false;
          if (!userId) return true;
          return person.id !== userId;
        });
        if (other?.name) {
          return other.name;
        }
      }

      return conversationPayload.participant?.name || "Patient";
    },
    [userId]
  );

  const formatMessageForDisplay = useCallback(
    (rawMessage, fallbackName = "Patient") => {
      if (!rawMessage) {
        return null;
      }

      const normalized = normalizeMessage(
        rawMessage,
        fallbackName,
        userId ?? null
      );

      return {
        ...normalized,
        body: normalized.text ?? normalized.body ?? "",
        createdAt: normalized.timestamp,
      };
    },
    [userId]
  );

  const hydrateMessages = useCallback(
    (rawMessages, fallbackName) => {
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        setMessages([]);
        return;
      }

      const normalized = rawMessages
        .map((message) => formatMessageForDisplay(message, fallbackName))
        .filter(Boolean);
      setMessages(normalized);
    },
    [formatMessageForDisplay]
  );

  const appendRealtimeMessage = useCallback(
    (rawMessage, fallbackName) => {
      const prepared = formatMessageForDisplay(rawMessage, fallbackName);
      if (!prepared) return;

      setMessages((prev) => {
        if (prev.some((message) => message.id === prepared.id)) {
          return prev;
        }
        return insertMessageChronologically(prev, prepared);
      });
    },
    [formatMessageForDisplay]
  );

  const applyConversationPayload = useCallback(
    (payload) => {
      if (!payload) {
        setConversation(null);
        setMessages([]);
        return;
      }

      setConversation(payload);
      const fallbackName = deriveParticipantName(payload);
      hydrateMessages(payload.messages ?? [], fallbackName);
    },
    [deriveParticipantName, hydrateMessages]
  );

  useEffect(() => {
    if (!incidentId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [incidentResult, conversationResult, hospitalResult] =
          await Promise.allSettled([
            responseModeService.getIncident(incidentId),
            responseModeService.getConversation(incidentId),
            responseModeService.getHospitalRecommendations(incidentId),
          ]);

        if (incidentResult.status !== "fulfilled" || !incidentResult.value) {
          const message =
            incidentResult.status === "rejected"
              ? incidentResult.reason?.message || "Incident not found"
              : "Incident not found";
          throw new Error(message);
        }

        setIncident(incidentResult.value);

        if (conversationResult.status === "fulfilled") {
          const convoValue =
            conversationResult.value?.conversation ?? conversationResult.value;
          applyConversationPayload(convoValue);
        } else {
          applyConversationPayload(null);
        }

        if (hospitalResult.status === "fulfilled") {
          setHospitals(hospitalResult.value ?? []);
        } else {
          setHospitals([]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load response mode data");
        if (err.message === "Incident not found") {
          navigate(ROUTES.RESPONDER.DASHBOARD);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [incidentId, applyConversationPayload, navigate]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    incidentRef.current = incident;
  }, [incident]);

  useEffect(() => {
    if (!Array.isArray(incidents) || !incidentId) {
      return;
    }

    const latest = incidents.find(
      (item) => String(item.id) === String(incidentId)
    );

    if (latest) {
      setIncident((prev) => ({ ...(prev ?? {}), ...latest }));
    }
  }, [incidents, incidentId]);

  return {
    messages,
    setMessages,
    loading,
    error,
    setError,
    conversation,
    setConversation,
    hospitals,
    setHospitals,
    incident,
    setIncident,
  };
}
