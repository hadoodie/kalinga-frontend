import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

/**
 * Hook for responders to broadcast their location during active response.
 * Handles continuous location tracking and server updates.
 *
 * @param {Object} options
 * @param {number|string} options.incidentId - The active incident ID
 * @param {boolean} options.enabled - Whether broadcasting is enabled
 * @param {number} options.broadcastInterval - How often to send updates (ms), default 3000
 * @returns {Object} - { position, heading, speed, accuracy, error, isTracking }
 */
export function useResponderLocationBroadcast({
  incidentId,
  enabled = false,
  broadcastInterval = 3000,
} = {}) {
  const [position, setPosition] = useState(null);
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const watchIdRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const pendingBroadcastRef = useRef(null);
  const isMountedRef = useRef(true);

  // Broadcast location to server
  const broadcastLocation = useCallback(
    async (locationData) => {
      if (!incidentId || !enabled) return;

      const now = Date.now();
      if (now - lastBroadcastRef.current < broadcastInterval) {
        // Queue for later
        pendingBroadcastRef.current = locationData;
        return;
      }

      lastBroadcastRef.current = now;
      pendingBroadcastRef.current = null;

      try {
        await api.post(`/incidents/${incidentId}/responder-location`, {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          heading: locationData.heading,
          speed: locationData.speed,
          accuracy: locationData.accuracy,
          eta_minutes: locationData.eta,
          distance_remaining_km: locationData.distance,
        });
      } catch (err) {
        console.error("Failed to broadcast location:", err);
        // Don't set error state for broadcast failures - they're recoverable
      }
    },
    [incidentId, enabled, broadcastInterval]
  );

  // Handle position update from geolocation
  const handlePositionUpdate = useCallback(
    (geoPosition) => {
      if (!isMountedRef.current) return;

      const {
        latitude,
        longitude,
        heading: geoHeading,
        speed: geoSpeed,
        accuracy: geoAccuracy,
      } = geoPosition.coords;

      setPosition([latitude, longitude]);
      setHeading(geoHeading);
      setSpeed(geoSpeed);
      setAccuracy(geoAccuracy);
      setError(null);
      setIsTracking(true);

      // Broadcast to server
      broadcastLocation({
        latitude,
        longitude,
        heading: geoHeading,
        speed: geoSpeed,
        accuracy: geoAccuracy,
      });
    },
    [broadcastLocation]
  );

  // Handle geolocation error
  const handlePositionError = useCallback((geoError) => {
    if (!isMountedRef.current) return;

    console.error("Geolocation error:", geoError);
    setError(geoError.message || "Failed to get location");
    setIsTracking(false);
  }, []);

  // Start/stop watching position
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !incidentId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    // Start high-accuracy tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, incidentId, handlePositionUpdate, handlePositionError]);

  // Process pending broadcasts on interval
  useEffect(() => {
    if (!enabled || !incidentId) return;

    const intervalId = setInterval(() => {
      if (pendingBroadcastRef.current) {
        broadcastLocation(pendingBroadcastRef.current);
      }
    }, broadcastInterval);

    return () => clearInterval(intervalId);
  }, [enabled, incidentId, broadcastInterval, broadcastLocation]);

  // Manual broadcast with ETA/distance
  const broadcast = useCallback(
    (extraData = {}) => {
      if (!position) return;

      broadcastLocation({
        latitude: position[0],
        longitude: position[1],
        heading,
        speed,
        accuracy,
        ...extraData,
      });
    },
    [position, heading, speed, accuracy, broadcastLocation]
  );

  return {
    position,
    heading,
    speed,
    accuracy,
    error,
    isTracking,
    broadcast,
  };
}

export default useResponderLocationBroadcast;
