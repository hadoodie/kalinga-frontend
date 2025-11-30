import api from "./api";
import {
  cachedFetch,
  preloadCache,
  invalidateCache,
  getCached,
  setCached,
} from "../lib/apiCache";

// Cache TTLs - incidents are more dynamic, shorter TTL
const INCIDENTS_TTL_MS = 10 * 1000; // 10 seconds
const INCIDENT_HISTORY_TTL_MS = 30 * 1000; // 30 seconds

// Cache keys
const CACHE_KEYS = {
  ALL: "incidents:all",
  history: (id) => `incidents:${id}:history`,
};

/**
 * Fetch incidents with caching and SWR pattern
 * Returns cached data instantly while refreshing in background
 */
export const fetchResponderIncidents = async (params = {}, options = {}) => {
  const { forceRefresh = false, silent = false } = options;
  const cacheKey = CACHE_KEYS.ALL;

  // For silent refreshes, use stale-while-revalidate
  const staleWhileRevalidate = silent;

  const result = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get("/incidents", { params });
      return response;
    },
    {
      ttlMs: INCIDENTS_TTL_MS,
      forceRefresh,
      staleWhileRevalidate,
    }
  );

  return result.data;
};

/**
 * Get incidents from cache without fetching (for instant UI)
 */
export const getCachedIncidents = () => {
  const cached = getCached(CACHE_KEYS.ALL);
  if (!cached) return null;

  const data = Array.isArray(cached.data?.data)
    ? cached.data.data
    : cached.data;
  return data ?? null;
};

/**
 * Merge a single incident update into cache (for realtime updates)
 */
export const mergeIncidentToCache = (incident) => {
  if (!incident?.id) return;

  const cached = getCached(CACHE_KEYS.ALL);
  if (!cached) return;

  const currentData = Array.isArray(cached.data?.data)
    ? cached.data.data
    : Array.isArray(cached.data)
    ? cached.data
    : [];

  const index = currentData.findIndex((item) => item.id === incident.id);
  let updated;

  if (index >= 0) {
    updated = [...currentData];
    updated[index] = { ...updated[index], ...incident };
  } else {
    updated = [incident, ...currentData];
  }

  // Update cache with merged data
  const newCached = cached.data?.data
    ? { ...cached, data: { ...cached.data, data: updated } }
    : { ...cached, data: updated };

  setCached(CACHE_KEYS.ALL, newCached, INCIDENTS_TTL_MS);
};

/**
 * Fetch incident history with caching
 */
export const fetchIncidentHistory = async (incidentId, options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = CACHE_KEYS.history(incidentId);

  const { data } = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get(`/incidents/${incidentId}/history`);
      return response.data;
    },
    { ttlMs: INCIDENT_HISTORY_TTL_MS, forceRefresh }
  );

  return data;
};

/**
 * Assign to incident - invalidates cache
 */
export const assignToIncident = async (incidentId, payload = {}) => {
  const response = await api.post(`/incidents/${incidentId}/assign`, payload);
  invalidateCache(CACHE_KEYS.ALL);
  invalidateCache(CACHE_KEYS.history(incidentId));
  return response;
};

/**
 * Update incident status - invalidates cache
 */
export const updateIncidentStatus = async (incidentId, payload) => {
  const response = await api.post(`/incidents/${incidentId}/status`, payload);
  invalidateCache(CACHE_KEYS.ALL);
  invalidateCache(CACHE_KEYS.history(incidentId));
  return response;
};

/**
 * Assign nearest incident
 */
export const assignNearestIncident = async (payload) => {
  const response = await api.post("/incidents/assign-nearest", payload);
  invalidateCache(CACHE_KEYS.ALL);
  return response;
};

/**
 * Preload incidents into cache (fire-and-forget)
 */
export const preloadIncidents = (params = {}) => {
  preloadCache(
    CACHE_KEYS.ALL,
    async () => {
      const response = await api.get("/incidents", { params });
      return response;
    },
    INCIDENTS_TTL_MS
  );
};
