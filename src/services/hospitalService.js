import api from "./api";
import {
  cachedFetch,
  preloadCache,
  invalidateCache,
  persistCache,
  loadPersistedCache,
} from "../lib/apiCache";

// Cache TTLs
const HOSPITALS_TTL_MS = 5 * 60 * 1000; // 5 minutes - hospitals rarely change
const HOSPITAL_DETAIL_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Cache keys
const CACHE_KEYS = {
  ALL: "hospitals:all",
  byId: (id) => `hospitals:${id}`,
};

const hospitalService = {
  /**
   * Get all hospitals with caching.
   * Uses persistent cache for instant load on page refresh.
   */
  getAll: async (params = {}, options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.ALL;

    // On first load, check persistent cache for instant data
    if (!forceRefresh) {
      const persisted = loadPersistedCache(cacheKey);
      if (persisted) {
        // Return persisted immediately, refresh in background
        preloadCache(
          cacheKey,
          async () => {
            const res = await api.get("/hospitals", { params });
            const data = res.data;
            persistCache(cacheKey, data, HOSPITALS_TTL_MS);
            return data;
          },
          HOSPITALS_TTL_MS
        );
        return persisted;
      }
    }

    const { data } = await cachedFetch(
      cacheKey,
      async () => {
        try {
          const res = await api.get("/hospitals", { params });
          persistCache(cacheKey, res.data, HOSPITALS_TTL_MS);
          return res.data;
        } catch (err) {
          // Fallback to test endpoint
          const res = await api.get("/test/hospitals", { params });
          return res.data;
        }
      },
      { ttlMs: HOSPITALS_TTL_MS, forceRefresh }
    );

    return data;
  },

  /**
   * Get hospital by ID with caching
   */
  getById: async (id, options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.byId(id);

    const { data } = await cachedFetch(
      cacheKey,
      async () => {
        const res = await api.get(`/hospitals/${id}`);
        return res.data;
      },
      { ttlMs: HOSPITAL_DETAIL_TTL_MS, forceRefresh }
    );

    return data;
  },

  /**
   * Create hospital - invalidates list cache
   */
  create: async (data) => {
    const res = await api.post("/hospitals", data);
    invalidateCache(CACHE_KEYS.ALL);
    return res.data;
  },

  /**
   * Update hospital - invalidates both list and detail cache
   */
  update: async (id, data) => {
    const res = await api.put(`/hospitals/${id}`, data);
    invalidateCache(CACHE_KEYS.ALL);
    invalidateCache(CACHE_KEYS.byId(id));
    return res.data;
  },

  /**
   * Delete hospital - invalidates caches
   */
  delete: async (id) => {
    const res = await api.delete(`/hospitals/${id}`);
    invalidateCache(CACHE_KEYS.ALL);
    invalidateCache(CACHE_KEYS.byId(id));
    return res.data;
  },

  /**
   * Preload hospitals into cache (fire-and-forget)
   * Call this on app init for faster initial loads
   */
  preload: () => {
    preloadCache(
      CACHE_KEYS.ALL,
      async () => {
        try {
          const res = await api.get("/hospitals");
          persistCache(CACHE_KEYS.ALL, res.data, HOSPITALS_TTL_MS);
          return res.data;
        } catch (err) {
          const res = await api.get("/test/hospitals");
          return res.data;
        }
      },
      HOSPITALS_TTL_MS
    );
  },
};

export default hospitalService;