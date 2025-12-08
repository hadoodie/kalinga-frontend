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
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation2,
  Phone,
  RefreshCw,
  Truck,
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
  en_route: "Responder En Route to Incident",
  transporting: "Responder En Route to Hospital",
  hospital_transfer: "Transferring to Hospital",
  on_scene: "Responder Arrived",
  needs_support: "Additional Support",
  resolved: "Rescue Complete",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  acknowledged: "bg-yellow-500",
  en_route: "bg-blue-500",
  transporting: "bg-cyan-500",
  hospital_transfer: "bg-cyan-500",
  on_scene: "bg-green-500",
  needs_support: "bg-orange-500",
  resolved: "bg-gray-500",
  cancelled: "bg-gray-400",
};

const RescueProgressTracker = ({ status, hospitalName }) => {
  const steps = [
    {
      id: 1,
      label: "En Route",
      active: ["acknowledged", "en_route"].includes(status),
      completed: [
        "on_scene",
        "transporting",
        "hospital_transfer",
        "resolved",
      ].includes(status),
    },
    {
      id: 2,
      label: "At Location",
      active: status === "on_scene",
      completed: ["transporting", "hospital_transfer", "resolved"].includes(
        status
      ),
    },
    {
      id: 3,
      label: "To Hospital",
      active: ["transporting", "hospital_transfer", "resolved"].includes(
        status
      ),
      completed: status === "resolved",
    },
  ];

  // Calculate progress percentage
  const progress =
    (steps.filter((s) => s.completed).length / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-6 px-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-4 w-full h-1 bg-gray-200 -z-10 rounded-full" />

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-4 h-1 bg-green-500 -z-10 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />

        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-colors duration-300 z-10 bg-white ${
                step.completed
                  ? "border-green-500 bg-green-500 text-white"
                  : step.active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 text-gray-300"
              }`}
            >
              {step.completed ? (
                <CheckCircle size={16} strokeWidth={3} />
              ) : (
                <span className="text-xs font-black">{step.id}</span>
              )}
            </div>
            <div className="mt-2 text-center absolute top-8 left-1/2 transform -translate-x-1/2 w-32">
              <p
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  step.active
                    ? "text-blue-600"
                    : step.completed
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {step.id === 3 && step.active && hospitalName && (
                <p className="text-xs font-bold text-gray-900 mt-0.5 leading-tight">
                  {hospitalName}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RescueStatusCard = ({
  eta,
  distance,
  responder,
  vehicle,
  status,
  hospitalName,
}) => {
  const isToHospital = [
    "transporting",
    "hospital_transfer",
    "resolved",
  ].includes(status);

  return (
    <div className="relative md:absolute md:bottom-6 md:left-6 md:w-[400px] bg-white rounded-t-3xl md:rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:shadow-2xl z-[1000] overflow-hidden transition-all duration-300">
      {/* Drag Handle for Mobile */}
      <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="p-5 pt-2 md:pt-5">
        {/* Progress Tracker */}
        <div className="mb-8">
          <RescueProgressTracker status={status} hospitalName={hospitalName} />
        </div>

        {/* High-Contrast Data Block */}
        <div className="bg-gray-100 rounded-xl p-4 mb-5 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              {isToHospital ? "TIME TO HOSPITAL" : "EST. ARRIVAL"}
            </p>
            <h2 className="text-3xl font-black text-gray-900 leading-none">
              {eta}
            </h2>
          </div>
          <div className="h-10 w-px bg-gray-300 mx-4" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              {isToHospital ? "DISTANCE" : "DISTANCE"}
            </p>
            <p className="text-3xl font-black text-gray-900 leading-none">
              {distance}
            </p>
          </div>
        </div>

        {/* Actionable Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-2 border-blue-200">
              <Truck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Responding Team
              </p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {responder?.name || "Ambulance Team"}
              </h3>
              <p className="text-sm font-medium text-gray-600">
                {vehicle?.plate_number || "Plate No: ---"}
              </p>
            </div>
          </div>

          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            onClick={() => (window.location.href = "tel:911")}
          >
            <Phone size={20} strokeWidth={2.5} />
            <span>CALL DISPATCH</span>
          </button>
        </div>
      </div>
    </div>
  );
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex flex-col flex-1 transition-all duration-300">
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>

        <main className="flex-1 flex flex-col relative min-h-[calc(100vh-64px)]">
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
              {/* Map */}
              <div className="flex-1 relative h-[60vh] md:h-auto">
                <MapContainer
                  center={
                    responderPosition || patientPosition || DEFAULT_POSITION
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

                  {/* Patient marker - Hide when transporting to hospital */}
                  {patientPosition &&
                    !["transporting", "hospital_transfer", "resolved"].includes(
                      rescueData?.incident?.status
                    ) && (
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

                {/* Status Card Overlay */}
                <RescueStatusCard
                  key={rescueData?.incident?.status}
                  eta={formatETA(responderLocation?.eta)}
                  distance={formatDistance(responderLocation?.distance)}
                  responder={rescueData?.responder}
                  vehicle={rescueData?.vehicle}
                  status={rescueData?.incident?.status}
                  hospitalName={rescueData?.hospital?.name}
                />
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
