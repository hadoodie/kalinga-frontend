/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import EchoClient, { reconnectEcho, getEchoInstance } from "../services/echo";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const RealtimeContext = createContext({
  presenceStatus: "idle",
  presenceError: null,
  onlineUsers: [],
  ensureConnected: async () => ({ ok: false }),
});

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};

const buildErrorMessage = (error) => {
  if (!error) return "Unable to join realtime channel.";
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.error?.message === "string") return error.error.message;
  return "Unable to join realtime channel.";
};

export const RealtimeProvider = ({ children }) => {
  const { token } = useAuth();
  const [presenceStatus, setPresenceStatus] = useState("idle");
  const [presenceError, setPresenceError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const presenceActiveRef = useRef(false);
  const connectingPromiseRef = useRef(null);
  const heartbeatRef = useRef(null);

  const resetState = useCallback((status = "idle") => {
    presenceActiveRef.current = false;
    connectingPromiseRef.current = null;
    setOnlineUsers([]);
    setPresenceError(null);
    setPresenceStatus(status);
  }, []);

  const sendPresenceHeartbeat = useCallback(async () => {
    if (!token) return;
    try {
      await api.post("/presence/heartbeat");
    } catch (error) {
      console.warn("Presence heartbeat failed", error);
    }
  }, [token]);

  const sendPresenceOffline = useCallback(async () => {
    if (!token) return;
    try {
      await api.post("/presence/offline");
    } catch (error) {
      console.warn("Presence offline update failed", error);
    }
  }, [token]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      return;
    }

    sendPresenceHeartbeat();
    heartbeatRef.current = setInterval(sendPresenceHeartbeat, 30000);
  }, [sendPresenceHeartbeat]);

  const leaveChannel = useCallback(() => {
    const echoInstance = getEchoInstance?.() || EchoClient;
    if (!echoInstance) {
      stopHeartbeat();
      sendPresenceOffline();
      return;
    }

    try {
      echoInstance.leave("online");
    } catch (error) {
      console.warn("Failed to leave realtime presence channel", error);
    }

    presenceActiveRef.current = false;
    stopHeartbeat();
    sendPresenceOffline();
  }, [sendPresenceOffline, stopHeartbeat]);

  const ensureConnected = useCallback(() => {
    if (!token) {
      resetState("unauthenticated");
      return Promise.resolve({ ok: false, reason: "unauthenticated" });
    }

    if (presenceActiveRef.current && presenceStatus === "connected") {
      return Promise.resolve({ ok: true });
    }

    if (connectingPromiseRef.current) {
      return connectingPromiseRef.current;
    }

    const echoInstance = getEchoInstance?.() || EchoClient;
    if (!echoInstance) {
      resetState("error");
      setPresenceError("Realtime client is not available in this session.");
      return Promise.resolve({ ok: false, reason: "unavailable" });
    }

    reconnectEcho();

    try {
      echoInstance.leave("online");
    } catch (error) {
      console.warn("Failed to reset presence channel", error);
    }

    setPresenceStatus("connecting");
    setPresenceError(null);

    connectingPromiseRef.current = new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        if (connectingPromiseRef.current) {
          presenceActiveRef.current = false;
          connectingPromiseRef.current = null;
          setPresenceStatus("error");
          setPresenceError("Presence auth timed out. Check token/CORS.");
          console.warn("Realtime presence timeout: likely auth/cors issue");
          resolve({ ok: false, reason: "timeout" });
        }
      }, 8000);

      const channel = echoInstance
        .join("online")
        .here((users) => {
          clearTimeout(timeoutId);
          presenceActiveRef.current = true;
          connectingPromiseRef.current = null;
          setOnlineUsers(Array.isArray(users) ? [...users] : []);
          setPresenceStatus("connected");
          setPresenceError(null);
          resolve({ ok: true });
        })
        .joining((user) => {
          setOnlineUsers((prev) => {
            if (!user || typeof user !== "object") {
              return prev;
            }

            if (prev.some((existing) => existing?.id === user?.id)) {
              return prev;
            }

            return [...prev, user];
          });
        })
        .leaving((user) => {
          setOnlineUsers((prev) =>
            prev.filter((existing) => existing?.id !== user?.id)
          );
        })
        .error((error) => {
          clearTimeout(timeoutId);
          presenceActiveRef.current = false;
          connectingPromiseRef.current = null;
          setOnlineUsers([]);
          setPresenceStatus("error");
          setPresenceError(buildErrorMessage(error));
          console.error("Realtime presence error", error);
          resolve({ ok: false, reason: "error", error });
        });

      // In case join throws synchronously
      if (!channel) {
        clearTimeout(timeoutId);
        presenceActiveRef.current = false;
        connectingPromiseRef.current = null;
        setOnlineUsers([]);
        setPresenceStatus("error");
        setPresenceError("Failed to join realtime presence channel.");
        resolve({ ok: false, reason: "join_failed" });
      }
    });

    return connectingPromiseRef.current;
  }, [token, presenceStatus, resetState]);

  useEffect(() => {
    if (!token) {
      leaveChannel();
      resetState("unauthenticated");
      return;
    }

    let isSubscribed = true;

    ensureConnected().catch((error) => {
      if (!isSubscribed) return;
      console.error("Failed to establish realtime presence", error);
    });

    return () => {
      isSubscribed = false;
    };
  }, [token, ensureConnected, leaveChannel, resetState]);

  useEffect(() => () => {
    leaveChannel();
    resetState("idle");
  }, [leaveChannel, resetState]);

  useEffect(() => {
    if (presenceStatus === "connected") {
      startHeartbeat();
      return undefined;
    }

    stopHeartbeat();
    if (presenceStatus !== "idle" && presenceStatus !== "connecting") {
      sendPresenceOffline();
    }

    return undefined;
  }, [presenceStatus, sendPresenceOffline, startHeartbeat, stopHeartbeat]);

  const contextValue = {
    presenceStatus,
    presenceError,
    onlineUsers,
    ensureConnected,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

