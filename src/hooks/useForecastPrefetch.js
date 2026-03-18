import { useEffect, useRef } from "react";
import { prefetchForecasts } from "../services/forecastPrefetchCache";

/**
 * useForecastPrefetch
 *
 * Fire-and-forget hook — call at the top of LogisDash (or any parent)
 * to warm the forecast cache before the user clicks the AI Forecast tab.
 * Uses requestIdleCallback so it never blocks the main thread.
 * No returned state, no re-renders.
 */
export default function useForecastPrefetch() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1500);

    schedule(() => {
      prefetchForecasts().catch(() => {
        /* silent — ForecastDashboard will fetch normally if cache misses */
      });
    });
  }, []);
}
