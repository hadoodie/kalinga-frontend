/**
 * API Response Cache with Stale-While-Revalidate (SWR) pattern
 *
 * Features:
 * - In-memory LRU cache for fast access
 * - Configurable TTL per cache entry
 * - Request deduplication (concurrent requests share same promise)
 * - Stale-while-revalidate: return cached data instantly, refresh in background
 * - LocalStorage persistence for critical data across page loads
 */

const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds default
const MAX_CACHE_SIZE = 100;

// In-memory cache store
const memoryCache = new Map();
const inflightRequests = new Map();

// Cache entry structure
const createEntry = (data, ttlMs = DEFAULT_TTL_MS) => ({
  data,
  timestamp: Date.now(),
  expiresAt: Date.now() + ttlMs,
});

// Check if entry is fresh
const isFresh = (entry) => entry && Date.now() < entry.expiresAt;

// Check if entry is stale but usable (within 5x TTL for SWR)
const isUsable = (entry) =>
  entry && Date.now() < entry.timestamp + (entry.expiresAt - entry.timestamp) * 5;

// LRU eviction when cache is full
const evictOldest = () => {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {*} Cached data or null
 */
export const getCached = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  // Move to end for LRU
  memoryCache.delete(key);
  memoryCache.set(key, entry);

  return entry.data;
};

/**
 * Get cache entry metadata
 * @param {string} key - Cache key
 * @returns {{ fresh: boolean, stale: boolean, age: number } | null}
 */
export const getCacheStatus = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  return {
    fresh: isFresh(entry),
    stale: !isFresh(entry) && isUsable(entry),
    age: Date.now() - entry.timestamp,
  };
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttlMs - Time to live in milliseconds
 */
export const setCached = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  evictOldest();
  memoryCache.set(key, createEntry(data, ttlMs));
};

/**
 * Invalidate cache entry
 * @param {string} key - Cache key or prefix (if ends with *)
 */
export const invalidateCache = (key) => {
  if (key.endsWith("*")) {
    const prefix = key.slice(0, -1);
    for (const k of memoryCache.keys()) {
      if (k.startsWith(prefix)) {
        memoryCache.delete(k);
      }
    }
  } else {
    memoryCache.delete(key);
  }
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  memoryCache.clear();
  inflightRequests.clear();
};

/**
 * Cached fetch with SWR pattern and request deduplication
 *
 * @param {string} key - Unique cache key for this request
 * @param {Function} fetcher - Async function that returns data
 * @param {Object} options - Configuration options
 * @param {number} options.ttlMs - Cache TTL in milliseconds
 * @param {boolean} options.forceRefresh - Skip cache, fetch fresh
 * @param {boolean} options.staleWhileRevalidate - Return stale data while refreshing
 * @param {Function} options.onBackground - Callback when background refresh completes
 * @returns {Promise<{ data: *, fromCache: boolean, stale: boolean }>}
 */
export const cachedFetch = async (key, fetcher, options = {}) => {
  const {
    ttlMs = DEFAULT_TTL_MS,
    forceRefresh = false,
    staleWhileRevalidate = true,
    onBackground = null,
  } = options;

  // Check for cached data first
  const entry = memoryCache.get(key);
  const hasFreshData = isFresh(entry);
  const hasStaleData = !hasFreshData && isUsable(entry);

  // Return fresh cached data immediately
  if (hasFreshData && !forceRefresh) {
    return { data: entry.data, fromCache: true, stale: false };
  }

  // Stale-while-revalidate: return stale data and refresh in background
  if (hasStaleData && staleWhileRevalidate && !forceRefresh) {
    // Trigger background refresh if not already in progress
    if (!inflightRequests.has(key)) {
      const backgroundFetch = fetcher()
        .then((data) => {
          setCached(key, data, ttlMs);
          onBackground?.(data);
          return data;
        })
        .catch((err) => {
          console.warn(`Background refresh failed for ${key}:`, err.message);
        })
        .finally(() => {
          inflightRequests.delete(key);
        });

      inflightRequests.set(key, backgroundFetch);
    }

    return { data: entry.data, fromCache: true, stale: true };
  }

  // Request deduplication: reuse in-flight request
  if (inflightRequests.has(key)) {
    const data = await inflightRequests.get(key);
    return { data, fromCache: false, stale: false };
  }

  // Fresh fetch
  const fetchPromise = fetcher()
    .then((data) => {
      setCached(key, data, ttlMs);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, fetchPromise);
  const data = await fetchPromise;

  return { data, fromCache: false, stale: false };
};

/**
 * Preload data into cache (fire-and-forget)
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns data
 * @param {number} ttlMs - Cache TTL
 */
export const preloadCache = (key, fetcher, ttlMs = DEFAULT_TTL_MS) => {
  // Don't preload if we have fresh data
  if (isFresh(memoryCache.get(key))) return;

  // Don't duplicate in-flight requests
  if (inflightRequests.has(key)) return;

  const fetchPromise = fetcher()
    .then((data) => {
      setCached(key, data, ttlMs);
      return data;
    })
    .catch((err) => {
      console.warn(`Preload failed for ${key}:`, err.message);
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, fetchPromise);
};

// Persistent cache for critical data (survives page reload)
const PERSISTENT_PREFIX = "kalinga_cache_";

/**
 * Save to persistent storage
 * @param {string} key - Storage key
 * @param {*} data - Data to persist
 * @param {number} ttlMs - TTL for expiration check
 */
export const persistCache = (key, data, ttlMs = 5 * 60 * 1000) => {
  try {
    const entry = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(PERSISTENT_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to persist cache:", e.message);
  }
};

/**
 * Load from persistent storage
 * @param {string} key - Storage key
 * @returns {*} Cached data or null
 */
export const loadPersistedCache = (key) => {
  try {
    const raw = localStorage.getItem(PERSISTENT_PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(PERSISTENT_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch (e) {
    return null;
  }
};

/**
 * Clear persisted cache
 * @param {string} key - Specific key or null for all
 */
export const clearPersistedCache = (key = null) => {
  try {
    if (key) {
      localStorage.removeItem(PERSISTENT_PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PERSISTENT_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn("Failed to clear persisted cache:", e.message);
  }
};

export default {
  getCached,
  getCacheStatus,
  setCached,
  invalidateCache,
  clearCache,
  cachedFetch,
  preloadCache,
  persistCache,
  loadPersistedCache,
  clearPersistedCache,
};
