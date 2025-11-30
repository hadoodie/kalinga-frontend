import { useCallback, useEffect, useRef, useState } from "react";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/**
 * Hook to manage blockade data with real-time WebSocket updates.
 * Falls back to polling with a configurable interval for areas with poor connectivity.
 *
 * @param {Object} options
 * @param {number} options.pollingInterval - Fallback polling interval in ms (default: 120000)
 * @param {boolean} options.enabled - Whether to enable the hook (default: true)
 * @returns {Object} - { blockades, loading, error, refetch }
 */
export const useBlockades = ({ pollingInterval = 120000, enabled = true } = {}) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [blockades, setBlockades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subscriptionRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch blockades from API
  const fetchBlockades = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || authLoading) {
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await api.get("/blockades");
        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        if (isMountedRef.current) {
          setBlockades(data);
        }
      } catch (err) {
        console.error("Failed to fetch blockades:", err);
        if (isMountedRef.current) {
          setError(err?.message || "Failed to load blockade data");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [isAuthenticated, authLoading]
  );

  // Update a single blockade from WebSocket event
  const updateBlockade = useCallback((blockade) => {
    if (!blockade?.id) return;

    setBlockades((prev) => {
      const index = prev.findIndex((b) => b.id === blockade.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...blockade };
        return updated;
      }
      // New blockade, add to list
      return [...prev, blockade];
    });
  }, []);

  // Remove a blockade (when cleared)
  const removeBlockade = useCallback((blockadeId) => {
    setBlockades((prev) => prev.filter((b) => b.id !== blockadeId));
  }, []);

  // Handle incoming WebSocket blockade update
  const handleRealtimeBlockadeUpdate = useCallback(
    (payload) => {
      if (payload?.blockade) {
        if (payload.blockade.status === "cleared" || payload.action === "removed") {
          removeBlockade(payload.blockade.id);
        } else {
          updateBlockade(payload.blockade);
        }
      }
      if (payload?.removed_blockade_id) {
        removeBlockade(payload.removed_blockade_id);
      }
    },
    [updateBlockade, removeBlockade]
  );

  // Initial fetch and polling setup
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchBlockades();

    // Setup polling as fallback
    if (pollingInterval > 0) {
      pollingTimerRef.current = setInterval(() => {
        fetchBlockades({ silent: true });
      }, pollingInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [enabled, authLoading, isAuthenticated, fetchBlockades, pollingInterval]);

  // Subscribe to WebSocket channel for real-time blockade updates
  useEffect(() => {
    if (!enabled || !isAuthenticated || authLoading || !user?.id) {
      return;
    }

    const echo = getEchoInstance?.();
    if (!echo) {
      return;
    }

    reconnectEcho();

    // Subscribe to blockades channel (presence channel since it's shared data)
    const channelName = "blockades";
    let channel;

    try {
      channel = echo.join(channelName);
      channel.listen(".BlockadeUpdated", handleRealtimeBlockadeUpdate);
      channel.listen(".BlockadeCreated", handleRealtimeBlockadeUpdate);
      channel.listen(".BlockadeCleared", handleRealtimeBlockadeUpdate);
      subscriptionRef.current = channel;

      // Reduce polling frequency when WebSocket is active
      if (pollingTimerRef.current && pollingInterval > 0) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = setInterval(() => {
          fetchBlockades({ silent: true });
        }, pollingInterval * 3); // Much longer fallback when WS is active
      }
    } catch (subscriptionError) {
      console.error("Failed to subscribe to blockades channel", subscriptionError);
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.stopListening(".BlockadeUpdated");
          subscriptionRef.current.stopListening(".BlockadeCreated");
          subscriptionRef.current.stopListening(".BlockadeCleared");
        } catch (e) {
          // Ignore
        }
        try {
          echo.leave(channelName);
        } catch (e) {
          // Ignore
        }
        subscriptionRef.current = null;
      }
    };
  }, [
    enabled,
    isAuthenticated,
    authLoading,
    user?.id,
    handleRealtimeBlockadeUpdate,
    fetchBlockades,
    pollingInterval,
  ]);

  return {
    blockades,
    loading,
    error,
    refetch: fetchBlockades,
    updateBlockade,
    removeBlockade,
  };
};

export default useBlockades;
