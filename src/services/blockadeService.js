import api from "./api";
import {
  cachedFetch,
  preloadCache,
  invalidateCache,
  getCached,
  persistCache,
  loadPersistedCache,
} from "../lib/apiCache";

// Cache TTLs
const BLOCKADES_TTL_MS = 60 * 1000; // 1 minute - blockades don't change frequently
const BLOCKADES_BOUNDS_TTL_MS = 30 * 1000; // 30 seconds for bounded queries

// Cache keys
const CACHE_KEYS = {
  ALL: "blockades:all",
  bounded: (north, south, east, west) =>
    `blockades:${north.toFixed(3)}:${south.toFixed(3)}:${east.toFixed(
      3
    )}:${west.toFixed(3)}`,
};

const blockadeService = {
  /**
   * Get all blockades with caching
   * Uses persistent cache for instant load on page refresh
   */
  async getAll(options = {}) {
    const { forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.ALL;

    // Check persistent cache for instant data on first load
    if (!forceRefresh) {
      const persisted = loadPersistedCache(cacheKey);
      if (persisted) {
        // Return persisted, refresh in background
        preloadCache(
          cacheKey,
          async () => {
            const res = await api.get("/road-blockades");
            const data = Array.isArray(res.data) ? res.data : [];
            persistCache(cacheKey, data, BLOCKADES_TTL_MS);
            return data;
          },
          BLOCKADES_TTL_MS
        );
        return persisted;
      }
    }

    const { data } = await cachedFetch(
      cacheKey,
      async () => {
        const res = await api.get("/road-blockades");
        const blockades = Array.isArray(res.data) ? res.data : [];
        persistCache(cacheKey, blockades, BLOCKADES_TTL_MS);
        return blockades;
      },
      { ttlMs: BLOCKADES_TTL_MS, forceRefresh }
    );

    return data;
  },

  /**
   * Get blockades within map bounds with caching
   * Uses coarse bounds key for cache efficiency
   */
  async getByBounds(bounds, options = {}) {
    const { forceRefresh = false } = options;
    const { north, south, east, west } = bounds;

    // Round bounds for better cache hits
    const cacheKey = CACHE_KEYS.bounded(north, south, east, west);

    const { data } = await cachedFetch(
      cacheKey,
      async () => {
        const params = new URLSearchParams({
          north: north.toString(),
          south: south.toString(),
          east: east.toString(),
          west: west.toString(),
        });
        const res = await api.get(`/road-blockades?${params}`);
        return Array.isArray(res.data) ? res.data : [];
      },
      {
        ttlMs: BLOCKADES_BOUNDS_TTL_MS,
        forceRefresh,
        staleWhileRevalidate: true,
      }
    );

    return data;
  },

  /**
   * Get cached blockades instantly (for optimistic UI)
   */
  getCached() {
    return getCached(CACHE_KEYS.ALL) ?? loadPersistedCache(CACHE_KEYS.ALL);
  },

  /**
   * Create blockade - invalidates cache
   */
  async create(data) {
    const res = await api.post("/road-blockades", data);
    invalidateCache("blockades:*");
    return res.data;
  },

  /**
   * Update blockade - invalidates cache
   */
  async update(id, data) {
    const res = await api.put(`/road-blockades/${id}`, data);
    invalidateCache("blockades:*");
    return res.data;
  },

  /**
   * Delete/remove blockade - invalidates cache
   */
  async remove(id) {
    const res = await api.patch(`/road-blockades/${id}/remove`);
    invalidateCache("blockades:*");
    return res.data;
  },

  /**
   * Get blockades affecting a route
   */
  async getRouteBlockades(routeCoordinates) {
    const res = await api.post("/road-blockades/route", {
      route: routeCoordinates,
    });
    return res.data;
  },

  /**
   * Preload blockades into cache (fire-and-forget)
   */
  preload() {
    preloadCache(
      CACHE_KEYS.ALL,
      async () => {
        const res = await api.get("/road-blockades");
        const data = Array.isArray(res.data) ? res.data : [];
        persistCache(CACHE_KEYS.ALL, data, BLOCKADES_TTL_MS);
        return data;
      },
      BLOCKADES_TTL_MS
    );
  },
};

export default blockadeService;
