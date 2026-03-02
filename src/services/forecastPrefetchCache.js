/**
 * Forecast Prefetch Cache
 *
 * Module-level (non-React) cache that pre-fetches forecast data
 * when LogisDash mounts, so ForecastDashboard renders instantly.
 *
 * - 5-minute TTL before stale
 * - Won't stack concurrent requests
 * - consumeCache() returns data or null (caller falls back to normal fetch)
 */

import forecastService from "./forecastService";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = {
  summary: null,
  riskData: null,
  demandData: null,
  narrative: null,

  timestamp: 0, // Date.now() when last fetched
  status: "idle", // idle | fetching | ready | stale
  promise: null, // in-flight promise (dedup guard)
};

/**
 * Fire off all four forecast fetches in parallel.
 * Safe to call multiple times — won't stack requests.
 * @returns {Promise<void>}
 */
export async function prefetchForecasts() {
  // Already fetching or fresh — skip
  if (_cache.status === "fetching") return _cache.promise;
  if (
    _cache.status === "ready" &&
    Date.now() - _cache.timestamp < CACHE_TTL_MS
  ) {
    return;
  }

  _cache.status = "fetching";

  const work = (async () => {
    try {
      const [summaryRes, riskRes, demandRes, narrativeRes] =
        await Promise.allSettled([
          forecastService.getSummary(),
          forecastService.getRiskForecasts(),
          forecastService.getDemandForecasts(),
          forecastService.getNarrative(),
        ]);

      _cache.summary =
        summaryRes.status === "fulfilled" ? summaryRes.value : null;
      _cache.riskData =
        riskRes.status === "fulfilled" ? riskRes.value : null;
      _cache.demandData =
        demandRes.status === "fulfilled" ? demandRes.value : null;
      _cache.narrative =
        narrativeRes.status === "fulfilled" ? narrativeRes.value : null;

      _cache.timestamp = Date.now();
      _cache.status = "ready";
    } catch {
      _cache.status = "stale";
    } finally {
      _cache.promise = null;
    }
  })();

  _cache.promise = work;
  return work;
}

/**
 * Consume the cached data if it's fresh.
 * Returns { summary, riskData, demandData, narrative } or null.
 */
export function consumeCache() {
  if (
    _cache.status === "ready" &&
    Date.now() - _cache.timestamp < CACHE_TTL_MS
  ) {
    return {
      summary: _cache.summary,
      riskData: _cache.riskData,
      demandData: _cache.demandData,
      narrative: _cache.narrative,
    };
  }
  return null;
}

/**
 * Force-invalidate the cache (e.g. after pipeline re-run).
 */
export function invalidateCache() {
  _cache.status = "stale";
  _cache.timestamp = 0;
  _cache.promise = null;
}

/**
 * Debug helper — returns current cache status.
 */
export function getCacheStatus() {
  return {
    status: _cache.status,
    age: _cache.timestamp ? Date.now() - _cache.timestamp : null,
    hasSummary: !!_cache.summary,
    hasRisk: !!_cache.riskData,
    hasDemand: !!_cache.demandData,
    hasNarrative: !!_cache.narrative,
  };
}
