import { useCallback, useEffect, useRef } from "react";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import { useRealtime } from "../context/RealtimeContext";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to subscribe to real-time incident updates via WebSocket.
 * Components can use this to receive live incident updates without polling.
 *
 * @param {Object} options
 * @param {Function} options.onIncidentUpdate - Callback when an incident is updated
 * @param {boolean} options.enabled - Whether the subscription is enabled (default: true)
 * @returns {Object} - { isSubscribed, subscriptionError }
 */
export const useIncidentEvents = ({ onIncidentUpdate, enabled = true } = {}) => {
  const { ensureConnected } = useRealtime();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const errorRef = useRef(null);

  const handleIncidentUpdate = useCallback(
    (payload) => {
      if (!payload?.incident) return;
      onIncidentUpdate?.(payload.incident);
    },
    [onIncidentUpdate]
  );

  useEffect(() => {
    if (!enabled || authLoading || !isAuthenticated) {
      return;
    }

    let isMounted = true;

    const subscribe = async () => {
      try {
        const result = await ensureConnected();
        if (!result?.ok || !isMounted) return;

        const echo = getEchoInstance?.();
        if (!echo) {
          errorRef.current = "Echo instance not available";
          return;
        }

        reconnectEcho();

        // Leave existing channel before rejoining
        try {
          echo.leave("incidents");
        } catch (leaveError) {
          // Ignore leave errors
        }

        subscriptionRef.current = echo
          .join("incidents")
          .listen(".IncidentUpdated", handleIncidentUpdate);

        isSubscribedRef.current = true;
        errorRef.current = null;
      } catch (error) {
        console.error("Failed to subscribe to incidents channel", error);
        errorRef.current = error?.message || "Subscription failed";
        isSubscribedRef.current = false;
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        try {
          const echo = getEchoInstance?.();
          echo?.leave("incidents");
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [enabled, authLoading, isAuthenticated, ensureConnected, handleIncidentUpdate]);

  return {
    isSubscribed: isSubscribedRef.current,
    subscriptionError: errorRef.current,
  };
};

export default useIncidentEvents;
