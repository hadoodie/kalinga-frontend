import { useState, useEffect } from "react";

const NOMINATIM_HEADERS = {
  "User-Agent": "KalingaResponseMode/1.0 (support@kalinga.app)",
  Accept: "application/json",
};

const ADDRESS_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useReverseGeocode(lat, lng) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return undefined;

    const cacheKey = `${lat},${lng}`;
    const cachedEntry = ADDRESS_CACHE.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      setAddress(cachedEntry.value);
      return undefined;
    }

    const controller = new AbortController();

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: NOMINATIM_HEADERS,
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          throw new Error(`Reverse geocode failed: ${response.status}`);
        }
        const data = await response.json();
        if (data?.display_name) {
          ADDRESS_CACHE.set(cacheKey, {
            value: data.display_name,
            timestamp: Date.now(),
          });
          setAddress(data.display_name);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to reverse geocode:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAddress();

    return () => {
      controller.abort();
    };
  }, [lat, lng]);

  return { address, loading };
}
