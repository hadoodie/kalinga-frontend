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
  Loader2,
  Navigation2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavbarB } from "../components/Navbar_2";
import PatientSidebar from "../components/patients/Sidebar";
import EmergencyFab from "../components/patients/EmergencyFab";
import RescueDetailPanel, {
  formatETA,
  formatDistance,
} from "../components/patients/rescue/RescueDetailPanel";
import RescueChatFab from "../components/patients/rescue/RescueChatFab";
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

const hospitalIcon = L.divIcon({
  className: "hospital-marker",
  html: `
    <div style="
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #10b981;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"></path>
        <path d="M5 21V7l8-4 8 4v14"></path>
        <path d="M13 21v-8h-2v8"></path>
      </svg>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Map auto-center component
const MapController = ({
  responderPosition,
  patientPosition,
  shouldCenter,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!shouldCenter) return;

    // Always prioritize centering on responder if available
    if (responderPosition) {
      map.setView(responderPosition, 16, { animate: true });
    } else if (patientPosition) {
      map.setView(patientPosition, 16, { animate: true });
    }
  }, [map, responderPosition, patientPosition, shouldCenter]);

  return null;
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

  // Fetch route between responder and destination (patient or hospital)
  const fetchRoute = useCallback(async () => {
    if (!responderLocation || !rescueData?.incident) return;

    try {
      const { lat: respLat, lng: respLng } = responderLocation;
      let destLat, destLng;

      // Determine destination based on status
      // If transporting, destination is Hospital. Otherwise, it's the Patient.
      if (
        ["transporting", "hospital_transfer", "resolved"].includes(
          rescueData.incident.status
        ) &&
        rescueData.hospital?.coordinates
      ) {
        destLat = rescueData.hospital.coordinates.latitude;
        destLng = rescueData.hospital.coordinates.longitude;
      } else if (rescueData.incident.coordinates) {
        destLat = rescueData.incident.coordinates.latitude;
        destLng = rescueData.incident.coordinates.longitude;
      } else {
        return;
      }

      const params = new URLSearchParams({
        overview: "full",
        geometries: "geojson",
      });

      const response = await fetch(
        `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${respLng},${respLat};${destLng},${destLat}?${params}`
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
  }, [
    responderLocation,
    rescueData?.incident?.coordinates,
    rescueData?.incident?.status,
    rescueData?.hospital?.coordinates,
  ]);

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
  const isTransporting = ["transporting", "hospital_transfer"].includes(
    rescueData?.incident?.status
  );

  // Feature 3: When "En Route to Hospital", the patient is WITH the responder.
  // So the patient's map reference point becomes the responder's live location.
  const patientPosition = useMemo(() => {
    if (!rescueData?.incident?.coordinates) return null;
    return [
      rescueData.incident.coordinates.latitude,
      rescueData.incident.coordinates.longitude,
    ];
  }, [rescueData?.incident?.coordinates]);

  // The effective patient position for map centering: follows responder during transport
  const effectivePatientPosition = useMemo(() => {
    if (isTransporting && responderLocation) {
      return [responderLocation.lat, responderLocation.lng];
    }
    return patientPosition;
  }, [isTransporting, responderLocation, patientPosition]);

  const responderPosition = useMemo(() => {
    if (!responderLocation) return null;
    return [responderLocation.lat, responderLocation.lng];
  }, [responderLocation]);

  const responderIcon = useMemo(() => {
    return createResponderIcon(responderLocation?.heading || 0);
  }, [responderLocation?.heading]);

  // No active rescue — show the default EmergencyFab (not the Chat FAB)
  if (!loading && !rescueData) {
    return (
      <div className="h-screen flex bg-background text-foreground overflow-hidden">
        <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex flex-col flex-1 transition-all duration-300">
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

  // --- Active rescue view ---
  // Detail panel props shared between mobile bottom sheet & desktop sidebar
  const detailProps = {
    eta: formatETA(responderLocation?.eta),
    distance: formatDistance(responderLocation?.distance),
    responder: rescueData?.responder,
    vehicle: rescueData?.vehicle,
    status: rescueData?.incident?.status,
    hospitalName: rescueData?.hospital?.name,
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>

        <main className="flex-1 flex relative overflow-hidden">
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
              {/* RescueDetailPanel renders:
                  • Desktop (≥ 768 px): collapsible left sidebar (flex sibling of map)
                  • Mobile  (< 768 px): fixed bottom sheet (overlays map) */}
              <RescueDetailPanel {...detailProps} />

              {/* Map fills remaining space */}
              <div className="flex-1 relative">
                <MapContainer
                  center={
                    responderPosition ||
                    effectivePatientPosition ||
                    DEFAULT_POSITION
                  }
                  zoom={16}
                  className="h-full w-full absolute inset-0"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  <MapController
                    responderPosition={responderPosition}
                    patientPosition={effectivePatientPosition}
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

                  {/* Patient marker — hidden during transport (patient is with responder) */}
                  {patientPosition && !isTransporting && (
                    <Marker position={patientPosition} icon={patientIcon}>
                      <Tooltip direction="top" offset={[0, -20]} permanent>
                        <span className="font-semibold">Your Location</span>
                      </Tooltip>
                    </Marker>
                  )}

                  {/* Responder / ambulance marker */}
                  {responderPosition && (
                    <Marker position={responderPosition} icon={responderIcon}>
                      <Tooltip direction="top" offset={[0, -20]}>
                        <span className="font-semibold">
                          {isTransporting
                            ? "You & Responder"
                            : rescueData?.responder?.name || "Responder"}
                        </span>
                      </Tooltip>
                    </Marker>
                  )}

                  {/* Hospital marker */}
                  {rescueData?.hospital?.coordinates && (
                    <Marker
                      position={[
                        rescueData.hospital.coordinates.latitude,
                        rescueData.hospital.coordinates.longitude,
                      ]}
                      icon={hospitalIcon}
                    >
                      <Tooltip direction="top" offset={[0, -20]} permanent>
                        <span className="font-semibold">
                          {rescueData.hospital.name}
                        </span>
                      </Tooltip>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Feature 2: Replace EmergencyFab with Chat FAB during active rescue */}
      {rescueData?.incident?.id ? (
        <RescueChatFab incidentId={rescueData.incident.id} />
      ) : (
        <EmergencyFab />
      )}
    </div>
  );
};

export default RescueTracker;
