import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  Map,
  Stethoscope,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import Layout from "../layouts/Layout";
import ContextGeneratorPanel from "../components/responder/response-mode/ContextGeneratorPanel";
import ConversationPanel from "../components/responder/response-mode/ConversationPanel";
import LiveResponseMap from "../components/responder/response-mode/LiveResponseMap";
import StatusControlPanel from "../components/responder/response-mode/StatusControlPanel";
import ResponseModeDemoPanel from "../components/responder/response-mode/ResponseModeDemoPanel";
import ResponseTimelinePanel from "../components/responder/response-mode/ResponseTimelinePanel";
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
import formatEmergencyAddress from "../lib/formatEmergencyAddress";
import { useIncidents } from "../context/IncidentContext";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import { updateIncidentStatus } from "../services/incidents";
import { useResponderDevMenu } from "../context/ResponderDevMenuContext";

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
    key: "timeline",
    label: "Timeline",
    description: "Live incident history",
  },
];

const getConversationReceiverId = (conversation, userId) => {
  if (!conversation) return null;
  const participantId = conversation.participant?.id;
  if (participantId && participantId !== userId) return participantId;

  if (Array.isArray(conversation.participants)) {
    const other = conversation.participants.find(
      (person) => person?.id && person.id !== userId,
    );
    if (other?.id) return other.id;
  }

  if (conversation.receiver_id && conversation.receiver_id !== userId) {
    return conversation.receiver_id;
  }

  if (conversation.user_id && conversation.user_id !== userId) {
    return conversation.user_id;
  }

  if (conversation.patient_id && conversation.patient_id !== userId) {
    return conversation.patient_id;
  }

  return null;
};

export default function ResponseMode() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents } = useIncidents(); // Ensure incidents are available if needed, though we use params
  const { ensureConnected } = useRealtime();
  const {
    showResponseModeTestPanel,
    setShowResponseModeTestPanel,
    enableResponderSimulation,
  } = useResponderDevMenu();

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
    incidentLng,
  );

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [activeTab, setActiveTab] = useState("control");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("control");
  const [mobileCommsOpen, setMobileCommsOpen] = useState(false);
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [mobileMapIndicators, setMobileMapIndicators] = useState({
    hospitalsVisible: true,
    visibleHospitalCount: 0,
    blockadesVisible: true,
    visibleBlockadeCount: 0,
  });
  const [mobileRouteMeta, setMobileRouteMeta] = useState({
    etaMinutes: null,
    distanceKm: null,
    routeLoading: false,
    routeError: null,
    status: null,
    destination: null,
  });

  useEffect(() => {
    setSelectedHospitalId(null);
  }, [incidentId]);

  const lockTimestamp = useMemo(
    () => timestampOfStatus(incident?.history, Array.from(LOCK_STATUSES)),
    [incident],
  );

  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    source: insightsSource,
  } = useConversationInsights(messages, { lockTimestamp });

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
        (hospital) => String(hospital.id) === String(selectedHospitalId),
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
      (hospital) => String(hospital.id) === String(selectedHospitalId),
    );

    if (!exists) {
      setSelectedHospitalId(null);
    }
  }, [hospitals, selectedHospitalId]);

  useEffect(() => {
    setStatusError(null);
  }, [incident?.status]);

  const handleSendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || !conversation) {
        return;
      }

      const receiverId = getConversationReceiverId(conversation, user?.id);
      if (!receiverId) {
        setSendError("No recipient available for this conversation.");
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const optimistic = {
        id: tempId,
        text: trimmed,
        body: trimmed,
        senderId: user?.id,
        sender: user?.name || "You",
        createdAt: timestamp,
        timestamp,
        isOwn: true,
      };

      setSendError(null);
      setMessages((prev) => insertMessageChronologically(prev, optimistic));
      setSendingMessage(true);

      try {
        const payload = await chatService.sendMessage({
          receiver_id: receiverId,
          message: trimmed,
          incident_id: incident?.id ?? undefined,
          conversation_id:
            conversation?.conversationId ??
            conversation?.conversation_id ??
            conversation?.id,
        });

        const normalized = normalizeMessage(
          payload,
          conversation?.participant?.name || "Patient",
          user?.id ?? null,
        );
        const prepared = {
          ...normalized,
          body: normalized.text ?? normalized.body ?? "",
          createdAt: normalized.timestamp,
        };

        setMessages((prev) =>
          insertMessageChronologically(
            prev.filter((message) => message.id !== tempId),
            prepared,
          ),
        );
      } catch (err) {
        console.error("Failed to send message", err);
        setMessages((prev) => prev.filter((message) => message.id !== tempId));
        setSendError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to send message",
        );
      } finally {
        setSendingMessage(false);
      }
    },
    [conversation, incident?.id, setMessages, user?.id, user?.name],
  );

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

  const handleStatusChange = useCallback(
    async (nextStatus, noteOrPayload) => {
      if (!incident?.id) {
        return;
      }

      setStatusUpdating(true);
      setStatusError(null);

      try {
        let payload = { status: nextStatus };

        // Handle both simple note strings and full payload objects
        if (typeof noteOrPayload === "object" && noteOrPayload !== null) {
          // Full payload from support request modal
          payload = { ...payload, ...noteOrPayload };
        } else if (noteOrPayload) {
          // Simple note string
          payload.notes = noteOrPayload;
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
    [incident?.id, refreshHospitals, setIncident],
  );

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
    [user?.id],
  );

  const formatMessageForDisplay = useCallback(
    (rawMessage, fallbackName = "Patient") => {
      if (!rawMessage) {
        return null;
      }

      const normalized = normalizeMessage(
        rawMessage,
        fallbackName,
        user?.id ?? null,
      );

      return {
        ...normalized,
        body: normalized.text ?? normalized.body ?? "",
        createdAt: normalized.timestamp,
      };
    },
    [user?.id],
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
    [formatMessageForDisplay],
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
    [formatMessageForDisplay],
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
    [deriveParticipantName, hydrateMessages],
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
            payload?.conversation ?? activeConversation,
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
          error,
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
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
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
        </div>
      </Layout>
    );
  }

  const renderConsolePanel = (panelKey) => {
    if (panelKey === "control") {
      return (
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
      );
    }

    if (panelKey === "comms") {
      return (
        <ConversationPanel
          conversation={conversation}
          messages={messages}
          loading={loading}
          onBack={handleExit}
          currentUserId={user?.id}
          onSend={handleSendMessage}
          sending={sendingMessage}
          error={sendError}
        />
      );
    }

    if (panelKey === "intel") {
      return (
        <ContextGeneratorPanel
          insights={insights}
          loading={insightsLoading}
          error={insightsError}
          source={insightsSource}
          locked={Boolean(lockTimestamp)}
        />
      );
    }

    if (panelKey === "timeline") {
      return <ResponseTimelinePanel incident={incident} />;
    }

    return null;
  };

  const mobileEtaLabel =
    typeof mobileRouteMeta.etaMinutes === "number"
      ? `${mobileRouteMeta.etaMinutes} min`
      : "Calculating";
  const mobileDistanceLabel =
    typeof mobileRouteMeta.distanceKm === "number"
      ? `${mobileRouteMeta.distanceKm.toFixed(2)} km`
      : "--";

  return (
    <Layout hideTopbar={mobileNavActive}>
      <div className="h-full overflow-hidden">
        <div className="hidden md:flex h-full flex-col gap-4 p-4 overflow-hidden">
          <header className="flex-none flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                  Response Mode
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Incident #{incident?.id}
                </span>
              </div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                {incident?.type || "Active deployment"}
              </h1>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {incidentAddress || incident?.location}
              </p>
              {selectedHospital && (
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Stethoscope className="h-3 w-3 text-primary" />
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
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
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
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Exit Response Mode
              </button>
            </div>
          </header>

          <section className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-3 h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <LiveResponseMap
                incident={incident}
                hospitals={hospitals}
                selectedHospital={selectedHospital}
                onAutoAssignHospital={handleAutoAssignHospital}
                showSimulator={enableResponderSimulation}
              />
            </div>
            <div className="xl:col-span-2 h-full flex flex-col gap-4 overflow-hidden">
              <div className="flex-none rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
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
                        className={`flex-1 min-w-[80px] rounded-lg border px-2 py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-primary/40"
                        }`}
                      >
                        <span className="block text-xs font-bold">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                {renderConsolePanel(activeTab)}
              </div>
            </div>
          </section>
        </div>

        <div className="relative h-full md:hidden overflow-hidden bg-gray-900">
          <div className="absolute inset-0 z-0">
            <LiveResponseMap
              incident={incident}
              hospitals={hospitals}
              selectedHospital={selectedHospital}
              onAutoAssignHospital={handleAutoAssignHospital}
              onOpenComms={() => setMobileCommsOpen(true)}
              onMapIndicatorChange={setMobileMapIndicators}
              showHeader={false}
              showSimulator={enableResponderSimulation}
              containerClassName="h-full min-h-0 rounded-none border-none shadow-none"
              onRouteMetaChange={setMobileRouteMeta}
              onNavigationStateChange={setMobileNavActive}
            />
          </div>

          <div
            className={`pointer-events-none absolute left-3 right-3 z-[1100] transition-all duration-300 ${mobileNavActive ? "top-[120px]" : "top-4"}`}
          >
            <div className="pointer-events-auto rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    <Map className="h-3 w-3" />#{incident?.id}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700">
                    {incident?.status?.replace(/_/g, " ") || "unknown"}
                  </span>
                  {(mobileMapIndicators.hospitalsVisible ||
                    mobileMapIndicators.blockadesVisible) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-700 shadow-sm">
                      {mobileMapIndicators.hospitalsVisible && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Stethoscope className="h-3 w-3 text-emerald-600" />
                          {mobileMapIndicators.visibleHospitalCount}
                        </span>
                      )}
                      {mobileMapIndicators.hospitalsVisible &&
                        mobileMapIndicators.blockadesVisible && (
                          <span className="text-gray-300">•</span>
                        )}
                      {mobileMapIndicators.blockadesVisible && (
                        <span className="inline-flex items-center gap-1 text-orange-700">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          {mobileMapIndicators.visibleBlockadeCount}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExit}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <h1 className="text-sm font-black text-gray-900">
                {incident?.type || "Active deployment"}
              </h1>
              <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                {formatEmergencyAddress(incidentAddress || incident?.location)}
              </p>
            </div>
          </div>

          {mobileCommsOpen && (
            <div className="fixed inset-0 z-[1190] bg-black/55 p-3">
              <div className="flex h-full flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">Comms</p>
                  <button
                    type="button"
                    onClick={() => setMobileCommsOpen(false)}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                    aria-label="Close comms panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {renderConsolePanel("comms")}
                </div>
              </div>
            </div>
          )}

          <div
            className={`absolute bottom-0 left-0 right-0 z-[1110] rounded-t-3xl border-t border-gray-200 bg-white/95 backdrop-blur shadow-[0_-20px_40px_rgba(15,23,42,0.25)] transition-all duration-300 ${
              mobileSheetExpanded ? "max-h-[78vh]" : "max-h-[140px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setMobileSheetExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 px-4 pb-3 pt-2"
              aria-label="Toggle mission bottom sheet"
            >
              <div className="mx-auto h-1.5 w-14 rounded-full bg-gray-300" />
              <span className="sr-only">Toggle sheet</span>
              {mobileSheetExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              )}
            </button>

            <div className="px-4 pb-4">
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  ETA / Routing
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-700">
                  <span>
                    ETA: <strong>{mobileEtaLabel}</strong>
                  </span>
                  <span>
                    Distance: <strong>{mobileDistanceLabel}</strong>
                  </span>
                </div>
                {mobileRouteMeta.routeLoading && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Calculating route…
                  </p>
                )}
                {mobileRouteMeta.routeError && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {mobileRouteMeta.routeError}
                  </p>
                )}
              </div>

              {mobileSheetExpanded && (
                <div className="mt-3 min-h-0">
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {PANEL_TABS.filter((tab) => tab.key !== "comms").map(
                      (tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setMobileActiveTab(tab.key)}
                          className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                            mobileActiveTab === tab.key
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="max-h-[48vh] overflow-y-auto rounded-xl border border-gray-200 bg-white">
                    {renderConsolePanel(mobileActiveTab)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showResponseModeTestPanel && (
          <div className="fixed inset-0 z-[1260] bg-black/50 p-4">
            <div className="mx-auto flex h-full w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Hidden Tools
                  </p>
                  <h3 className="text-base font-black text-gray-900">
                    Test Panel
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResponseModeTestPanel(false)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <ResponseModeDemoPanel
                  incident={incident}
                  hospitals={hospitals}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
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

  const fetchHospitals = useCallback(async () => {
    if (!incidentId) {
      setHospitals([]);
      return [];
    }

    try {
      const result =
        await responseModeService.getHospitalRecommendations(incidentId);
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
    [userId],
  );

  const formatMessageForDisplay = useCallback(
    (rawMessage, fallbackName = "Patient") => {
      if (!rawMessage) {
        return null;
      }

      const normalized = normalizeMessage(
        rawMessage,
        fallbackName,
        userId ?? null,
      );

      return {
        ...normalized,
        body: normalized.text ?? normalized.body ?? "",
        createdAt: normalized.timestamp,
      };
    },
    [userId],
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
    [formatMessageForDisplay],
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
    [formatMessageForDisplay],
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
    [deriveParticipantName, hydrateMessages],
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
      (item) => String(item.id) === String(incidentId),
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
