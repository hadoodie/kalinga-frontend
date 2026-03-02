/**
 * forecastPrefetchCache.js
 *
 * Module-level (outside React tree) cache for the AI logistics forecast.
 * Lives for the lifetime of the browser tab — survives React navigation.
 *
 * TTL: 5 minutes. After that, a fresh fetch is triggered automatically.
 *
 * Exports:
 *   prefetchForecasts()  — fire-and-forget: kick off background fetch
 *   consumeCache()       — return cached payload if warm, else null
 *   invalidateCache()    — reset to idle (forces next fetch to re-hit API)
 *   getCacheStatus()     — "idle" | "fetching" | "ready" | "error"
 */

import api from "../services/api";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = {
  summary: null,
  riskData: null,
  demandData: null,
  narrative: null,
  timestamp: null,
  status: "idle", // "idle" | "fetching" | "ready" | "error"
  promise: null,  // in-flight Promise (deduplication)
};

/** True if cache is populated and not stale */
function _isFresh() {
  return (
    _cache.status === "ready" &&
    _cache.timestamp !== null &&
    Date.now() - _cache.timestamp < CACHE_TTL_MS
  );
}

/**
 * Fire-and-forget background prefetch.
 * Safe to call multiple times — deduplicates in-flight requests.
 *
 * @returns {Promise<void>}
 */
export function prefetchForecasts() {
  // Already warm or in-flight — nothing to do
  if (_isFresh() || _cache.status === "fetching") {
    return _cache.promise || Promise.resolve();
  }

  _cache.status = "fetching";

  const p = Promise.allSettled([
    api.get("/forecast/summary"),
    api.get("/forecast/risk"),
    api.get("/forecast/demand"),
    api.get("/forecast/narrative"),
  ]).then(([summaryRes, riskRes, demandRes, narrativeRes]) => {
    const unwrap = (res) => {
      if (res.status === "fulfilled") {
        const d = res.value?.data;
        // handle { data: [...] } or { data: { data: [...] } } wrapping
        if (d && d.data !== undefined) return d.data;
        return d;
      }
      return null;
    };

    _cache = {
      summary: unwrap(summaryRes),
      riskData: unwrap(riskRes),
      demandData: unwrap(demandRes),
      narrative: unwrap(narrativeRes),
      timestamp: Date.now(),
      status: "ready",
      promise: null,
    };
  }).catch(() => {
    _cache.status = "error";
    _cache.promise = null;
  });

  _cache.promise = p;
  return p;
}

/**
 * Return the cached payload if it is fresh, otherwise return null.
 *
 * @returns {{ summary, riskData, demandData, narrative } | null}
 */
export function consumeCache() {
  if (!_isFresh()) return null;
  return {
    summary: _cache.summary,
    riskData: _cache.riskData,
    demandData: _cache.demandData,
    narrative: _cache.narrative,
  };
}

/**
 * Force the next prefetchForecasts() / fetchAll() to re-hit the API.
 */
export function invalidateCache() {
  _cache = {
    summary: null,
    riskData: null,
    demandData: null,
    narrative: null,
    timestamp: null,
    status: "idle",
    promise: null,
  };
}

/** Return the current cache status string */
export function getCacheStatus() {
  return _cache.status;
}
