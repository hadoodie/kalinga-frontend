/**
 * useForecastPrefetch.js
 *
 * Drop-in hook that triggers a non-blocking background prefetch of the
 * AI logistics forecast data when the parent component mounts.
 *
 * Uses requestIdleCallback (3 s timeout) when available, falls back to a
 * 1500 ms setTimeout on browsers that do not support rIC (Safari < 16.4).
 *
 * Usage:
 *   import { useForecastPrefetch } from "../../hooks/useForecastPrefetch";
 *
 *   const LogisDash = () => {
 *     useForecastPrefetch();          // ← add this one line
 *     // … rest of component
 *   };
 */

import { useEffect } from "react";
import { prefetchForecasts } from "../services/forecastPrefetchCache";

export function useForecastPrefetch() {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(
        () => {
          prefetchForecasts();
        },
        { timeout: 3000 },
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: wait 1.5 s so the initial render has settled
      const timer = setTimeout(() => {
        prefetchForecasts();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []); // run once on mount
}
