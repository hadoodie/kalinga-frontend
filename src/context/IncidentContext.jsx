import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../config/routes";
import {
  fetchResponderIncidents,
  getCachedIncidents,
  mergeIncidentToCache,
  assignNearestIncident,
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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const subscriptionRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const incidentsRef = useRef([]);
  const lastFetchedRef = useRef(null);
  const autoAssignInProgressRef = useRef(false);
  const knownIncidentIdsRef = useRef(new Set());

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

  // Track user geolocation for auto-assignment
  useEffect(() => {
    if (!isAuthenticated || !autoAssignEnabled) {
      return;
    }

    let watchId = null;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isAuthenticated, autoAssignEnabled]);

  // Auto-assign nearest incident handler
  const attemptAutoAssign = useCallback(
    async (newIncident) => {
      if (!autoAssignEnabled || !userLocation || !user?.id) {
        return;
      }

      // Check if user is already assigned to an active incident
      const userHasActiveAssignment = incidentsRef.current.some((incident) => {
        if (["resolved", "cancelled"].includes(incident.status)) {
          return false;
        }
        return incident.assignments?.some(
          (assignment) =>
            assignment?.responder?.id === user.id &&
            !["completed", "cancelled"].includes(assignment.status)
        );
      });

      if (userHasActiveAssignment) {
        console.log(
          "User already has an active assignment, skipping auto-assign"
        );
        return;
      }

      if (autoAssignInProgressRef.current) {
        return;
      }

      autoAssignInProgressRef.current = true;

      try {
        const response = await assignNearestIncident({
          responder_lat: userLocation.lat,
          responder_lng: userLocation.lng,
          responder_id: user.id,
        });

        const assignedIncident = response?.data?.incident;
        if (assignedIncident) {
          mergeIncident(assignedIncident);

          // Navigate to response mode
          const responseModePath = ROUTES.RESPONDER.RESPONSE_MODE.replace(
            ":incidentId",
            assignedIncident.id
          );
          navigate(responseModePath, {
            state: { incident: assignedIncident, autoAssigned: true },
          });
        }
      } catch (err) {
        // 404 means no available incidents - not an error
        if (err?.response?.status !== 404) {
          console.error("Auto-assign failed:", err);
        }
      } finally {
        autoAssignInProgressRef.current = false;
      }
    },
    [autoAssignEnabled, userLocation, user?.id, mergeIncident, navigate]
  );

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

            const incomingIncident = payload.incident;
            const isNewIncident = !knownIncidentIdsRef.current.has(
              incomingIncident.id
            );

            // Track known incidents
            knownIncidentIdsRef.current.add(incomingIncident.id);

            mergeIncident(incomingIncident);

            // Auto-assign if this is a NEW incident in "reported" status
            if (
              isNewIncident &&
              incomingIncident.status === "reported" &&
              autoAssignEnabled
            ) {
              attemptAutoAssign(incomingIncident);
            }

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
    autoAssignEnabled,
    attemptAutoAssign,
  ]);

  // Initialize known incident IDs from initial load
  useEffect(() => {
    incidentsRef.current.forEach((incident) => {
      knownIncidentIdsRef.current.add(incident.id);
    });
  }, [incidents]);

  const value = useMemo(
    () => ({
      incidents,
      loading,
      refreshing,
      error,
      lastFetchedAt,
      refresh: (options) => loadIncidents({ force: true, ...(options ?? {}) }),
      mergeIncident,
      autoAssignEnabled,
      setAutoAssignEnabled,
      userLocation,
    }),
    [
      incidents,
      loading,
      refreshing,
      error,
      lastFetchedAt,
      loadIncidents,
      mergeIncident,
      autoAssignEnabled,
      userLocation,
    ]
  );

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  );
};

export default IncidentContext;
