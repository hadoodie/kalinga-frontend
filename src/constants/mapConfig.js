// Global constants for the mapping and pathfinding system
export const KALINGA_CONFIG = {
  // Default fallback location (TUP Manila)
  DEFAULT_LOCATION: {
    lat: 14.5875,
    lng: 120.9844,
    zoom: 16,
  },

  // Philippines bounds for map restriction
  PHILIPPINES_BOUNDS: [
    [4.5, 116.0], // Southwest
    [21.0, 127.0], // Northeast
  ],

  // Default map settings
  DEFAULT_ZOOM: 13,
  FALLBACK_ZOOM: 13,
  USER_LOCATION_ZOOM: 15,

  // Location storage settings
  LOCATION_STORAGE_KEY: "responder_lastLocation",
  LOCATION_EXPIRY_HOURS: 24,

  // API endpoints
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  OSRM_SERVER:
    import.meta.env.VITE_OSRM_SERVER || "https://router.project-osrm.org",
};

export default KALINGA_CONFIG;
