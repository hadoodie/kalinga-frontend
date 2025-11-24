import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Clock, Loader2, Map, Stethoscope } from "lucide-react";
import ResponderSidebar from "../components/responder/Sidebar";
import ResponderTopbar from "../components/responder/Topbar";
import ContextGeneratorPanel from "../components/responder/response-mode/ContextGeneratorPanel";
import ConversationPanel from "../components/responder/response-mode/ConversationPanel";
import LiveResponseMap from "../components/responder/response-mode/LiveResponseMap";
import StatusControlPanel from "../components/responder/response-mode/StatusControlPanel";
import ResponseModeDemoPanel from "../components/responder/response-mode/ResponseModeDemoPanel";
import responseModeService from "../services/responseMode";
import chatService from "../services/chatService";
import { ROUTES } from "../config/routes";
import { useAuth } from "../context/AuthContext";
import useConversationInsights from "../hooks/useConversationInsights";
import { useRealtime } from "../context/RealtimeContext";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import {
  insertMessageChronologically,
  normalizeMessage,
} from "../lib/chatUtils";
import { useIncidents } from "../context/IncidentContext";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import { updateIncidentStatus } from "../services/incidents";

const LOCK_STATUSES = new Set(["on_scene", "hospital_transfer", "resolved"]);

const timestampOfStatus = (history, statuses) => {
  if (!Array.isArray(history)) return null;
  const entry = history.find((item) => statuses.includes(item?.status));
  if (!entry) return null;
  const parsed = Date.parse(entry.created_at || entry.created_at_human);
  return Number.isNaN(parsed) ? null : parsed;
};

const PANEL_TABS = [
  {
    key: "control",
    label: "Control",
    description: "Status, hospitals, and notes",
  },
  {
    key: "comms",
    label: "Comms",
    description: "Conversation feed with caller",
  },
  {
    key: "intel",
    label: "Intel",
    description: "AI insights from patient dialogue",
  },
  {
    key: "demo",
    label: "Test",
    description: "Guided walkthrough for stakeholders",
  },
];

export default function ResponseMode() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents } = useIncidents(); // Ensure incidents are available if needed, though we use params
  const { ensureConnected } = useRealtime();

  const {
    messages,
    setMessages,
    loading,
    error,
    conversation,
    setConversation,
    hospitals,
    incident,
    setIncident,
    refreshHospitals,
    conversationRef,
    incidentRef,
  } = useResponseModeData(incidentId, user?.id, navigate, incidents);

  // Extract coordinates for reverse geocoding
  const incidentLat = incident?.latitude || incident?.location_lat;
  const incidentLng = incident?.longitude || incident?.location_lng;
  const { address: incidentAddress } = useReverseGeocode(
    incidentLat,
    incidentLng
  );

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [activeTab, setActiveTab] = useState("control");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendMessageError, setSendMessageError] = useState(null);

  useEffect(() => {
    setSelectedHospitalId(null);
  }, [incidentId]);

  const lockTimestamp = useMemo(
    () => timestampOfStatus(incident?.history, Array.from(LOCK_STATUSES)),
    [incident]
  );

  const insights = useConversationInsights(messages, { lockTimestamp });

  const nearestHospital = useMemo(() => {
    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      return null;
    }
    return hospitals[0];
  }, [hospitals]);

  const selectedHospital = useMemo(() => {
    if (
      selectedHospitalId === null ||
      selectedHospitalId === undefined ||
      !Array.isArray(hospitals)
    ) {
      return null;
    }
    return (
      hospitals.find(
        (hospital) => String(hospital.id) === String(selectedHospitalId)
      ) || null
    );
  }, [hospitals, selectedHospitalId]);

  useEffect(() => {
    if (selectedHospitalId === null || selectedHospitalId === undefined) {
      return;
    }

    if (!Array.isArray(hospitals)) {
      return;
    }

    const exists = hospitals.some(
      (hospital) => String(hospital.id) === String(selectedHospitalId)
    );

    if (!exists) {
      setSelectedHospitalId(null);
    }
  }, [hospitals, selectedHospitalId]);

  useEffect(() => {
    setStatusError(null);
  }, [incident?.status]);

  const handleHospitalChange = useCallback((hospitalId) => {
    setSelectedHospitalId(hospitalId);
  }, []);

  const handleAutoAssignHospital = useCallback((hospital) => {
    if (!hospital) return;
    setSelectedHospitalId((prev) => {
      if (prev && String(prev) === String(hospital.id)) {
        return prev;
      }
      return hospital.id;
    });
  }, []);

  const resolveReceiverId = useCallback(() => {
    if (!conversation) {
      return null;
    }

    const selfId = user?.id ? String(user.id) : null;
    const participantCandidates = [
      conversation.participant,
      ...(Array.isArray(conversation.participants)
        ? conversation.participants
        : []),
      conversation.receiver,
      conversation.sender,
      conversation.patient,
    ].filter(Boolean);

    for (const candidate of participantCandidates) {
      if (
        candidate?.id !== undefined &&
        candidate?.id !== null &&
        (!selfId || String(candidate.id) !== selfId)
      ) {
        return candidate.id;
      }
    }

    const fallbackIds = [
      conversation.receiver_id,
      conversation.patient_id,
      conversation.participant_id,
      conversation.user_id,
    ];

    for (const id of fallbackIds) {
      if (id !== undefined && id !== null) {
        if (!selfId || String(id) !== selfId) {
          return id;
        }
      }
    }

    return null;
  }, [conversation, user?.id]);

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

  const handleSendMessage = useCallback(
    async (messageText) => {
      if (!conversation || !user?.id) {
        return;
      }

      const trimmed = messageText.trim();
      if (!trimmed) {
        return;
      }

      const receiverId = resolveReceiverId();
      if (!receiverId) {
        setSendMessageError("Unable to identify chat recipient.");
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const timestamp = new Date().toISOString();

      const optimisticMessage = {
        id: tempId,
        clientId: tempId,
        text: trimmed,
        body: trimmed,
        senderId: user.id,
        sender: user.name || "Responder",
        createdAt: timestamp,
        timestamp,
        isOwn: true,
        deliveryStatus: "sending",
      };

      setMessages((prev) => insertMessageChronologically(prev, optimisticMessage));
      setSendMessageError(null);
      setSendingMessage(true);

      try {
        const payload = await chatService.sendMessage({
          receiver_id: receiverId,
          message: trimmed,
          incident_id: incident?.id,
          conversation_id: conversation.conversationId ?? conversation.id,
        });

        const fallbackName = deriveParticipantName(conversation);
        const normalized = normalizeMessage(
          {
            ...payload,
            senderId: payload.senderId ?? user.id,
            sender: payload.sender ?? user.name,
            timestamp: payload.timestamp ?? new Date().toISOString(),
          },
          fallbackName,
          user.id
        );

        const prepared = {
          ...normalized,
          body: normalized.text ?? normalized.body ?? "",
          createdAt: normalized.timestamp,
          isOwn: true,
          clientId: tempId,
        };

        setMessages((prev) => {
          const withoutTemp = prev.filter(
            (message) => message.id !== tempId && message.clientId !== tempId
          );
          return insertMessageChronologically(withoutTemp, prepared);
        });

        setConversation((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: trimmed,
                lastMessageTime: prepared.createdAt,
              }
            : prev
        );

        if (payload?.autoReply?.message) {
          const autoConversation =
            payload.autoReply.conversation ?? conversation;
          const autoFallback = deriveParticipantName(autoConversation);
          const autoNormalized = normalizeMessage(
            payload.autoReply.message,
            autoFallback,
            user.id
          );
          const autoPrepared = {
            ...autoNormalized,
            body: autoNormalized.text ?? autoNormalized.body ?? "",
            createdAt: autoNormalized.timestamp,
          };
          setMessages((prev) =>
            insertMessageChronologically(prev, autoPrepared)
          );
        }

        setSendMessageError(null);
      } catch (error) {
        console.error("Failed to send message", error);
        const fallbackError =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to send message right now.";
        setSendMessageError(fallbackError);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId || message.clientId === tempId
              ? { ...message, deliveryStatus: "failed", sendError: fallbackError }
              : message
          )
        );
        throw error;
      } finally {
        setSendingMessage(false);
      }
    },
    [
      conversation,
      deriveParticipantName,
      incident?.id,
      resolveReceiverId,
      setConversation,
      setMessages,
      user?.id,
      user?.name,
    ]
  );

  const handleStatusChange = useCallback(
    async (nextStatus, note) => {
      if (!incident?.id) {
        return;
      }

      setStatusUpdating(true);
      setStatusError(null);

      try {
        const payload = { status: nextStatus };
        if (note) {
          payload.notes = note;
        }

        const response = await updateIncidentStatus(incident.id, payload);
        const updatedIncident = response?.data?.data ?? response?.data ?? null;

        if (updatedIncident) {
          setIncident(updatedIncident);

          if (nextStatus === "on_scene") {
            await refreshHospitals?.();
          }
        }
      } catch (error) {
        console.error("Failed to update incident status", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to update status right now.";
        setStatusError(message);
      } finally {
        setStatusUpdating(false);
      }
    },
    [incident?.id, refreshHospitals, setIncident]
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
            ? String(activeConversation.conversationId ?? activeConversation.id)
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
        console.error(
          "Failed to subscribe to incident realtime channel",
          error
        );
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
  }, [
    incidentId,
    user?.id,
    ensureConnected,
    appendRealtimeMessage,
    deriveParticipantName,
  ]);

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
                  {incidentAddress &&
                    incident?.location &&
                    incidentAddress !== incident.location && (
                      <span className="text-xs text-gray-400">
                        ({incident.location})
                      </span>
                    )}
                </p>
                {selectedHospital && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span>
                      Destination:
                      <strong className="ml-1 text-gray-700">
                        {selectedHospital.name}
                      </strong>
                      {typeof selectedHospital.distance_km === "number" && (
                        <span className="ml-1 text-gray-400">
                          ({selectedHospital.distance_km.toFixed(2)} km)
                        </span>
                      )}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {incident?.status?.replace(/_/g, " ").toUpperCase() ||
                      "UNKNOWN"}
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

            <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <LiveResponseMap
                  incident={incident}
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  onAutoAssignHospital={handleAutoAssignHospital}
                />
              </div>
              <div className="xl:col-span-2 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Mission Console
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PANEL_TABS.map((tab) => {
                      const isActive = tab.key === activeTab;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                            isActive
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-gray-200 bg-white text-gray-600 hover:border-primary/40"
                          }`}
                        >
                          <span className="block text-sm font-bold">
                            {tab.label}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            {tab.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTab === "control" && (
                  <StatusControlPanel
                    incident={incident}
                    hospitals={hospitals}
                    nearestHospital={nearestHospital}
                    selectedHospitalId={selectedHospitalId}
                    selectedHospital={selectedHospital}
                    onHospitalChange={handleHospitalChange}
                    onStatusChange={handleStatusChange}
                    statusUpdating={statusUpdating}
                    statusError={statusError}
                  />
                )}

                {activeTab === "comms" && (
                  <ConversationPanel
                    conversation={conversation}
                    messages={messages}
                    loading={loading}
                    onBack={handleExit}
                    currentUserId={user?.id}
                    onSendMessage={handleSendMessage}
                    sending={sendingMessage}
                    sendError={sendMessageError}
                  />
                )}

                {activeTab === "intel" && (
                  <ContextGeneratorPanel
                    insights={insights}
                    locked={Boolean(lockTimestamp)}
                  />
                )}

                {activeTab === "demo" && (
                  <ResponseModeDemoPanel
                    incident={incident}
                    hospitals={hospitals}
                  />
                )}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
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
                      <div
                        className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                          index === 0 ? "bg-primary" : "bg-gray-300"
                        }`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {entry.status?.replace(/_/g, " ")}
                        </p>
                        <span className="text-xs text-gray-500 font-mono">
                          {entry.created_at_human ||
                            (entry.created_at
                              ? new Date(entry.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "")}
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
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Waiting for updates...
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function useResponseModeData(incidentId, userId, navigate, incidents) {
  const [messages, setMessages] = useState([]);
  const [incident, setIncident] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const conversationRef = useRef(null);
  const incidentRef = useRef(null);
  const previousIncidentIdRef = useRef(null);

  useEffect(() => {
    const previousId = previousIncidentIdRef.current;

    if (!incidentId) {
      previousIncidentIdRef.current = null;
      setMessages([]);
      setConversation(null);
      setIncident(null);
      setHospitals([]);
      setError(null);
      setLoading(true);
      return;
    }

    if (
      previousId !== null &&
      String(previousId) === String(incidentId)
    ) {
      return;
    }

    previousIncidentIdRef.current = incidentId;
    setMessages([]);
    setConversation(null);
    setIncident(null);
    setHospitals([]);
    setError(null);
    setLoading(true);
  }, [incidentId]);

  const fetchHospitals = useCallback(async () => {
    if (!incidentId) {
      setHospitals([]);
      return [];
    }

    try {
      const result = await responseModeService.getHospitalRecommendations(
        incidentId
      );
      const list = Array.isArray(result) ? result : [];
      setHospitals(list);
      return list;
    } catch (err) {
      console.error("Failed to load hospital recommendations", err);
      setHospitals([]);
      return [];
    }
  }, [incidentId]);

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
        const [incidentResult, conversationResult] = await Promise.allSettled([
          responseModeService.getIncident(incidentId),
          responseModeService.getConversation(incidentId),
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

        await fetchHospitals();
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
  }, [incidentId, applyConversationPayload, navigate, fetchHospitals]);

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
    incident,
    setIncident,
    refreshHospitals: fetchHospitals,
    conversationRef,
    incidentRef,
  };
}
