import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchResponderIncidents,
  getCachedIncidents,
  mergeIncidentToCache,
} from "../services/incidents";
import { useRealtime } from "./RealtimeContext";
import { getEchoInstance } from "../services/echo";
import { INCIDENT_STATUS_PRIORITIES } from "../constants/incidentStatus";
import { useAuth } from "./AuthContext";

const IncidentContext = createContext(null);

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidents must be used within an IncidentProvider");
  }
  return context;
};

const INITIAL_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds fallback refresh

const sortIncidents = (list) => {
  return [...list].sort((a, b) => {
    const priorityA = INCIDENT_STATUS_PRIORITIES[a.status] ?? 99;
    const priorityB = INCIDENT_STATUS_PRIORITIES[b.status] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const createdA = a.reported_at ? new Date(a.reported_at).getTime() : 0;
    const createdB = b.reported_at ? new Date(b.reported_at).getTime() : 0;
    return createdB - createdA;
  });
};

export const IncidentProvider = ({ children }) => {
  const { ensureConnected } = useRealtime();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const subscriptionRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const incidentsRef = useRef([]);
  const lastFetchedRef = useRef(null);

  const mergeIncident = useCallback((incoming) => {
    if (!incoming) {
      return;
    }

    // Update cache as well as local state
    mergeIncidentToCache(incoming);

    setIncidents((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.id === incoming.id);
      if (index >= 0) {
        next[index] = { ...next[index], ...incoming };
      } else {
        next.unshift(incoming);
      }
      const sorted = sortIncidents(next);
      incidentsRef.current = sorted;
      return sorted;
    });
  }, []);

  const loadIncidents = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (authLoading || !isAuthenticated) {
        if (!authLoading) {
          setIncidents([]);
          incidentsRef.current = [];
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Try to use cached data first for instant display
      if (!force && incidentsRef.current.length === 0) {
        const cached = getCachedIncidents();
        if (cached) {
          const normalized = sortIncidents(cached);
          incidentsRef.current = normalized;
          setIncidents(normalized);
        }
      }

      if (!force && lastFetchedRef.current) {
        const elapsed = Date.now() - new Date(lastFetchedRef.current).getTime();
        if (
          elapsed < INITIAL_REFRESH_INTERVAL_MS &&
          incidentsRef.current.length > 0
        ) {
          return;
        }
      }

      const shouldShowSpinner = !silent && incidentsRef.current.length === 0;
      if (shouldShowSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const response = await fetchResponderIncidents({
          include_resolved: true,
        });
        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : response.data;
        const normalized = sortIncidents(data ?? []);
        incidentsRef.current = normalized;
        setIncidents(normalized);
        const timestamp = new Date().toISOString();
        lastFetchedRef.current = timestamp;
        setLastFetchedAt(timestamp);
      } catch (err) {
        console.error("Failed to load incidents", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load incidents right now."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);

        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = setTimeout(() => {
          loadIncidents({ silent: true });
        }, INITIAL_REFRESH_INTERVAL_MS);
      }
    },
    [authLoading, isAuthenticated]
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      return;
    }

    loadIncidents({ force: true });
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [authLoading, isAuthenticated, loadIncidents]);

  useEffect(() => {
    let isMounted = true;

    if (authLoading || !isAuthenticated) {
      return;
    }

    const subscribe = async () => {
      try {
        const result = await ensureConnected();
        if (!result?.ok || !isMounted) return;

        const echo = getEchoInstance?.();
        if (!echo) return;

        try {
          echo.leave("incidents");
        } catch (leaveError) {
          console.warn(
            "Unable to leave incidents channel before subscribing",
            leaveError
          );
        }

        subscriptionRef.current = echo
          .join("incidents")
          .listen(".IncidentUpdated", (payload) => {
            if (!payload?.incident) return;
            mergeIncident(payload.incident);
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
            }
            refreshTimerRef.current = setTimeout(() => {
              loadIncidents({ silent: true });
            }, INITIAL_REFRESH_INTERVAL_MS);
          });
      } catch (error) {
        console.error("Failed to subscribe to incidents channel", error);
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
          console.warn("Unable to cleanup incidents channel", cleanupError);
        }
        subscriptionRef.current = null;
      }
    };
  }, [
    authLoading,
    ensureConnected,
    isAuthenticated,
    mergeIncident,
    loadIncidents,
  ]);

  const value = useMemo(
    () => ({
      incidents,
      loading,
      refreshing,
      error,
      lastFetchedAt,
      refresh: (options) => loadIncidents({ force: true, ...(options ?? {}) }),
      mergeIncident,
    }),
    [
      incidents,
      loading,
      refreshing,
      error,
      lastFetchedAt,
      loadIncidents,
      mergeIncident,
    ]
  );

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  );
};

export default IncidentContext;
