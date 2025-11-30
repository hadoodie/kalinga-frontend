import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation2,
  Phone,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavbarB } from "../components/Navbar_2";
import PatientSidebar from "../components/patients/Sidebar";
import EmergencyFab from "../components/patients/EmergencyFab";
import { useAuth } from "../context/AuthContext";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import { KALINGA_CONFIG } from "../constants/mapConfig";
import api from "../services/api";

const DEFAULT_POSITION = [
  KALINGA_CONFIG.DEFAULT_LOCATION.lat,
  KALINGA_CONFIG.DEFAULT_LOCATION.lng,
];

// Custom marker icons
const createResponderIcon = (heading = 0) =>
  L.divIcon({
    className: "responder-marker",
    html: `
      <div style="
        width: 48px;
        height: 48px;
        transform: rotate(${heading}deg);
        transition: transform 0.3s ease;
      ">
        <div style="
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid #2563eb;
        "></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const patientIcon = L.divIcon({
  className: "patient-marker",
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Map auto-center component
const MapController = ({ responderPosition, patientPosition, shouldCenter }) => {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!shouldCenter || hasCenteredRef.current) return;
    
    if (responderPosition && patientPosition) {
      const bounds = L.latLngBounds([responderPosition, patientPosition]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      hasCenteredRef.current = true;
    } else if (responderPosition) {
      map.flyTo(responderPosition, 15, { duration: 1 });
      hasCenteredRef.current = true;
    } else if (patientPosition) {
      map.flyTo(patientPosition, 15, { duration: 1 });
      hasCenteredRef.current = true;
    }
  }, [map, responderPosition, patientPosition, shouldCenter]);

  return null;
};

// Format helpers
const formatETA = (minutes) => {
  if (!minutes || minutes <= 0) return "Calculating...";
  if (minutes < 1) return "Arriving now";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

const formatDistance = (km) => {
  if (!km || km <= 0) return "--";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const STATUS_LABELS = {
  acknowledged: "Dispatch Confirmed",
  en_route: "Responder En Route",
  on_scene: "Responder Arrived",
  needs_support: "Additional Support",
  resolved: "Rescue Complete",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  acknowledged: "bg-yellow-500",
  en_route: "bg-blue-500",
  on_scene: "bg-green-500",
  needs_support: "bg-orange-500",
  resolved: "bg-gray-500",
  cancelled: "bg-gray-400",
};

export const RescueTracker = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rescueData, setRescueData] = useState(null);
  const [responderLocation, setResponderLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const channelRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch active rescue status
  const fetchRescueStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await api.get("/rescue/active");
      const data = response.data;

      if (!data.has_active_rescue) {
        setRescueData(null);
        setResponderLocation(null);
        setRoutePoints(null);
        return;
      }

      setRescueData(data.data);

      if (data.data.responder_location) {
        const loc = data.data.responder_location;
        setResponderLocation({
          lat: loc.latitude,
          lng: loc.longitude,
          heading: loc.heading,
          eta: loc.eta_minutes,
          distance: loc.distance_remaining_km,
          updatedAt: loc.updated_at,
        });
        setLastUpdate(new Date(loc.updated_at));
      }
    } catch (err) {
      console.error("Failed to fetch rescue status:", err);
      if (!silent) {
        setError(err.response?.data?.message || "Failed to load rescue status");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch route between responder and patient
  const fetchRoute = useCallback(async () => {
    if (!responderLocation || !rescueData?.incident?.coordinates) return;

    try {
      const { lat: respLat, lng: respLng } = responderLocation;
      const { latitude: patLat, longitude: patLng } = rescueData.incident.coordinates;

      const params = new URLSearchParams({
        overview: "full",
        geometries: "geojson",
      });

      const response = await fetch(
        `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${respLng},${respLat};${patLng},${patLat}?${params}`
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.code === "Ok" && data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);
        setRoutePoints(coords);
      }
    } catch (err) {
      console.error("Failed to fetch route:", err);
    }
  }, [responderLocation, rescueData?.incident?.coordinates]);

  // Subscribe to WebSocket for real-time location updates
  useEffect(() => {
    if (!rescueData?.incident?.id || !user?.id) return;

    const echo = getEchoInstance?.();
    if (!echo) return;

    reconnectEcho();

    const channelName = `incident.${rescueData.incident.id}.tracking`;

    try {
      const channel = echo.private(channelName);
      channel.listen(".ResponderLocationUpdated", (payload) => {
        if (payload?.responder?.location) {
          const loc = payload.responder.location;
          setResponderLocation({
            lat: loc.latitude,
            lng: loc.longitude,
            heading: loc.heading,
            eta: payload.responder.eta_minutes,
            distance: payload.responder.distance_remaining_km,
            updatedAt: payload.timestamp,
          });
          setLastUpdate(new Date(payload.timestamp));

          // Update status if changed
          if (payload.responder.status && rescueData?.incident) {
            setRescueData((prev) =>
              prev
                ? {
                    ...prev,
                    incident: {
                      ...prev.incident,
                      status: payload.responder.status,
                    },
                  }
                : prev
            );
          }
        }
      });

      channelRef.current = channel;
    } catch (err) {
      console.error("Failed to subscribe to tracking channel:", err);
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening(".ResponderLocationUpdated");
          echo.leave(channelName);
        } catch (e) {
          // Ignore
        }
        channelRef.current = null;
      }
    };
  }, [rescueData?.incident?.id, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchRescueStatus();
  }, [fetchRescueStatus]);

  // Polling fallback (every 10 seconds)
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchRescueStatus(true);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchRescueStatus]);

  // Fetch route when locations change
  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Derived values
  const patientPosition = useMemo(() => {
    if (!rescueData?.incident?.coordinates) return null;
    return [
      rescueData.incident.coordinates.latitude,
      rescueData.incident.coordinates.longitude,
    ];
  }, [rescueData?.incident?.coordinates]);

  const responderPosition = useMemo(() => {
    if (!responderLocation) return null;
    return [responderLocation.lat, responderLocation.lng];
  }, [responderLocation]);

  const responderIcon = useMemo(() => {
    return createResponderIcon(responderLocation?.heading || 0);
  }, [responderLocation?.heading]);

  const statusLabel = rescueData?.incident?.status
    ? STATUS_LABELS[rescueData.incident.status] || rescueData.incident.status
    : "Unknown";

  const statusColor = rescueData?.incident?.status
    ? STATUS_COLORS[rescueData.incident.status] || "bg-gray-500"
    : "bg-gray-500";

  // No active rescue
  if (!loading && !rescueData) {
    return (
      <div className="h-screen flex bg-background text-foreground overflow-hidden">
        <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div
          className={`flex flex-col flex-1 transition-all duration-300 ${
            collapsed ? "wl-16" : "wl-64"
          }`}
        >
          <div className="sticky z-10 bg-background">
            <NavbarB />
          </div>
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation2 className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                No Active Rescue
              </h2>
              <p className="text-gray-600 mb-6">
                You don&apos;t have any active emergency responses at the
                moment. If you need help, please use the Emergency SOS button.
              </p>
              <button
                type="button"
                onClick={() => navigate("/patient/messages")}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to Messages
              </button>
            </div>
          </main>
        </div>
        <EmergencyFab />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchRescueStatus()}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {statusLabel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rescueData?.incident?.type || "Emergency Response"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchRescueStatus()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 relative">
                <MapContainer
                  center={patientPosition || responderPosition || DEFAULT_POSITION}
                  zoom={14}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  <MapController
                    responderPosition={responderPosition}
                    patientPosition={patientPosition}
                    shouldCenter={true}
                  />

                  {/* Route line */}
                  {routePoints && routePoints.length > 1 && (
                    <Polyline
                      positions={routePoints}
                      color="#2563eb"
                      weight={5}
                      opacity={0.8}
                    />
                  )}

                  {/* Patient marker */}
                  {patientPosition && (
                    <Marker position={patientPosition} icon={patientIcon}>
                      <Tooltip direction="top" offset={[0, -20]} permanent>
                        <span className="font-semibold">Your Location</span>
                      </Tooltip>
                    </Marker>
                  )}

                  {/* Responder marker */}
                  {responderPosition && (
                    <Marker position={responderPosition} icon={responderIcon}>
                      <Tooltip direction="top" offset={[0, -20]}>
                        <span className="font-semibold">
                          {rescueData?.responder?.name || "Responder"}
                        </span>
                      </Tooltip>
                    </Marker>
                  )}
                </MapContainer>

                {/* ETA Card Overlay */}
                <div className="absolute top-4 left-4 right-4 pointer-events-none">
                  <div className="pointer-events-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-sm">
                    {/* Responder Info */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {rescueData?.responder?.profile_image ? (
                            <img
                              src={rescueData.responder.profile_image}
                              alt={rescueData.responder.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {rescueData?.responder?.name || "Responder"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Emergency Responder
                          </p>
                        </div>
                        {rescueData?.responder?.phone && (
                          <a
                            href={`tel:${rescueData.responder.phone}`}
                            className="p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200 transition-colors"
                          >
                            <Phone className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ETA & Distance */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Arriving In
                          </p>
                          <p className="text-2xl font-black text-blue-900">
                            {formatETA(responderLocation?.eta)}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-blue-200" />
                        <div className="text-center flex-1">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Distance
                          </p>
                          <p className="text-2xl font-black text-blue-900">
                            {formatDistance(responderLocation?.distance)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Last Update */}
                    {lastUpdate && (
                      <div className="px-4 py-2 bg-gray-50 text-center">
                        <p className="text-xs text-gray-500">
                          Last update:{" "}
                          {lastUpdate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                  <div className="pointer-events-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/patient/messages")}
                      className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        Message Responder
                      </span>
                    </button>
                    {rescueData?.responder?.phone && (
                      <a
                        href={`tel:${rescueData.responder.phone}`}
                        className="bg-green-600 rounded-xl shadow-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-5 w-5 text-white" />
                        <span className="font-semibold text-white">Call</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <EmergencyFab />
    </div>
  );
};

export default RescueTracker;
