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
 *   populateCache(data)  — write-back from a successful fetchAll
 *   invalidateCache()    — reset to idle (forces next fetch to re-hit API)
 *   getCacheStatus()     — "idle" | "fetching" | "ready" | "error"
 */

import forecastService from "./forecastService";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = {
  summary: null,
  riskData: null,
  demandData: null,
  narrative: null,
  timestamp: null,
  status: "idle", // "idle" | "fetching" | "ready" | "error"
  promise: null, // in-flight Promise (deduplication)
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
 * Uses the same forecastService methods that ForecastDashboard uses,
 * so endpoint paths and response unwrapping are guaranteed identical.
 *
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
    forecastService.getSummary(),
    forecastService.getRiskForecasts(),
    forecastService.getDemandForecasts(),
    forecastService.getNarrative(),
  ])
    .then(([summaryRes, riskRes, demandRes, narrativeRes]) => {
      const val = (res) =>
        res.status === "fulfilled" ? res.value : null;

      _cache = {
        summary: val(summaryRes),
        riskData: val(riskRes),
        demandData: val(demandRes),
        narrative: val(narrativeRes),
        timestamp: Date.now(),
        status: "ready",
        promise: null,
      };
    })
    .catch(() => {
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
 * Write-back: after a successful fetchAll in ForecastDashboard,
 * populate the module-level cache so subsequent tab switches render instantly.
 *
 * @param {{ summary, riskData, demandData, narrative }} data
 */
export function populateCache({ summary, riskData, demandData, narrative }) {
  _cache = {
    summary,
    riskData,
    demandData,
    narrative,
    timestamp: Date.now(),
    status: "ready",
    promise: null,
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
