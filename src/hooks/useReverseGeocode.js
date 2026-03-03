import { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export function useReverseGeocode(lat, lng) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/geocode/reverse?lat=${lat}&lon=${lng}`,
          {
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (error) {
        console.error("Failed to reverse geocode:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [lat, lng]);

  return { address, loading };
}
