import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Activity,
  AlertTriangle,
  Loader2,
  Navigation2,
  Stethoscope,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KALINGA_CONFIG } from "../../../constants/mapConfig";

const DEFAULT_POSITION = [
  KALINGA_CONFIG.DEFAULT_LOCATION.lat,
  KALINGA_CONFIG.DEFAULT_LOCATION.lng,
];

const STATUS_MODES = {
  hospital: ["on_scene", "transporting", "hospital_transfer", "resolved"],
};

const iconFactory = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

const responderIcon = iconFactory("blue");
const incidentIcon = iconFactory("red");
const hospitalIcon = iconFactory("green");

const normalizeCoordinate = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getIncidentPosition = (incident) => {
  if (!incident) return null;
  const lat =
    normalizeCoordinate(incident.latitude) ||
    normalizeCoordinate(incident.location_lat);
  const lng =
    normalizeCoordinate(incident.longitude) ||
    normalizeCoordinate(incident.location_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }
  if (Array.isArray(incident.latlng) && incident.latlng.length === 2) {
    const [storeLat, storeLng] = incident.latlng;
    const normalizedLat = normalizeCoordinate(storeLat);
    const normalizedLng = normalizeCoordinate(storeLng);
    if (Number.isFinite(normalizedLat) && Number.isFinite(normalizedLng)) {
      return [normalizedLat, normalizedLng];
    }
  }
  return null;
};

const getHospitalPosition = (hospital) => {
  if (!hospital) return null;
  const lat = normalizeCoordinate(hospital.latitude);
  const lng = normalizeCoordinate(hospital.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }
  return null;
};

const determineMode = (status) => {
  if (!status) return "route";
  if (STATUS_MODES.hospital.includes(status)) {
    return "hospital";
  }
  return "route";
};

const MapFlyTo = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    const [lat, lng] = target;
    map.flyTo([lat, lng], Math.max(13, map.getZoom()), {
      duration: 0.8,
    });
  }, [map, target]);

  return null;
};

export default function LiveResponseMap({
  incident,
  selectedHospital,
  hospitals = [],
  onAutoAssignHospital,
  autoAssignmentEnabled = true,
}) {
  const [responderPosition, setResponderPosition] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const trackingWatchId = useRef(null);
  const mapRef = useRef(null);

  const incidentPosition = useMemo(
    () => getIncidentPosition(incident) || DEFAULT_POSITION,
    [incident]
  );

  const hospitalPosition = useMemo(
    () => getHospitalPosition(selectedHospital),
    [selectedHospital]
  );

  const nearestHospital = hospitals?.[0] ?? null;

  const mode = determineMode(incident?.status);

  useEffect(() => {
    if (
      autoAssignmentEnabled &&
      incident?.status === "on_scene" &&
      !selectedHospital &&
      nearestHospital &&
      onAutoAssignHospital
    ) {
      onAutoAssignHospital(nearestHospital);
    }
  }, [
    autoAssignmentEnabled,
    incident?.status,
    nearestHospital,
    onAutoAssignHospital,
    selectedHospital,
  ]);

  useEffect(() => {
    if (trackingWatchId.current !== null) {
      navigator.geolocation.clearWatch(trackingWatchId.current);
    }

    if (!navigator.geolocation) {
      setResponderPosition(DEFAULT_POSITION);
      return;
    }

    trackingWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setResponderPosition([latitude, longitude]);
      },
      () => {
        if (!responderPosition) {
          setResponderPosition(DEFAULT_POSITION);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    );

    return () => {
      if (trackingWatchId.current !== null) {
        navigator.geolocation.clearWatch(trackingWatchId.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeStart = useMemo(() => {
    if (mode === "hospital" && incidentPosition) {
      return incidentPosition;
    }
    return responderPosition ?? incidentPosition;
  }, [incidentPosition, mode, responderPosition]);

  const activeDestination = useMemo(() => {
    if (mode === "hospital") {
      return hospitalPosition ?? incidentPosition;
    }
    return incidentPosition;
  }, [hospitalPosition, incidentPosition, mode]);

  const routingKey = useMemo(() => {
    if (!activeStart || !activeDestination) return null;
    const startKey = `${activeStart[0].toFixed(4)},${activeStart[1].toFixed(4)}`;
    const destKey = `${activeDestination[0].toFixed(4)},${activeDestination[1].toFixed(4)}`;
    return `${startKey}|${destKey}`;
  }, [activeStart, activeDestination]);

  useEffect(() => {
    if (!routingKey) {
      setRoutePoints(null);
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const [start, end] = routingKey.split("|");
        const [startLat, startLng] = start.split(",").map(Number);
        const [endLat, endLng] = end.split(",").map(Number);

        const response = await fetch(
          `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        if (!response.ok) {
          throw new Error(`Route request failed: ${response.status}`);
        }
        const data = await response.json();
        const coordinates =
          data?.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [
            lat,
            lng,
          ]) ?? null;

        if (!cancelled) {
          setRoutePoints(coordinates);
        }
      } catch (error) {
        console.error("Failed to fetch route", error);
        if (!cancelled) {
          setRouteError("Unable to compute route.");
          setRoutePoints(null);
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [routingKey]);

  const currentCenter = useMemo(() => {
    if (mode === "hospital" && incidentPosition) {
      return incidentPosition;
    }
    if (responderPosition) {
      return responderPosition;
    }
    return incidentPosition;
  }, [incidentPosition, mode, responderPosition]);

  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2 ${mode === "hospital" ? "bg-emerald-50" : "bg-blue-50"}`}>
            {mode === "hospital" ? (
              <Stethoscope className="h-6 w-6 text-emerald-600" />
            ) : (
              <Navigation2 className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {mode === "hospital" ? "Hospital transfer planning" : "Responder navigation"}
            </p>
            <h3 className="text-lg font-black text-gray-900">
              {mode === "hospital"
                ? selectedHospital?.name || "Awaiting hospital assignment"
                : incident?.type || "Active routing"}
            </h3>
            <p className="text-xs text-gray-500">
              {mode === "hospital"
                ? selectedHospital?.address || "Nearest capable facility auto-selected"
                : incident?.location || "Tracking live responder position"}
            </p>
          </div>
        </div>
        <div className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
          <span className="block text-[11px] text-gray-400">Status</span>
          <span className="text-sm text-gray-900">
            {incident?.status?.replace(/_/g, " ") || "unknown"}
          </span>
        </div>
      </header>

      <div className="relative flex-1">
        <MapContainer
          center={currentCenter}
          zoom={13}
          minZoom={5}
          maxZoom={18}
          className="h-full w-full"
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {currentCenter && <MapFlyTo target={currentCenter} />}

          {responderPosition && (
            <Marker position={responderPosition} icon={responderIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                Responder location
              </Tooltip>
            </Marker>
          )}

          {incidentPosition && (
            <Marker position={incidentPosition} icon={incidentIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {incident?.location || "Incident site"}
              </Tooltip>
            </Marker>
          )}

          {hospitalPosition && (
            <Marker position={hospitalPosition} icon={hospitalIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {selectedHospital?.name || "Destination hospital"}
              </Tooltip>
            </Marker>
          )}

          {routePoints && routePoints.length > 1 && (
            <Polyline
              positions={routePoints}
              color={mode === "hospital" ? "#059669" : "#2563eb"}
              weight={5}
              opacity={0.85}
            />
          )}
        </MapContainer>

        {routeLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Calculating optimal route…
            </div>
          </div>
        )}

        {routeError && !routeLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit rounded-lg bg-white px-4 py-2 text-sm text-red-600 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {routeError}
            </div>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span>
            {mode === "hospital"
              ? selectedHospital
                ? `Routing from incident to ${selectedHospital.name}`
                : "Select a hospital to plan handoff"
              : responderPosition
              ? "Live navigation synced with responder position"
              : "Enable location services for live tracking"}
          </span>
        </div>
        {selectedHospital?.distance_km !== undefined && (
          <span className="text-right text-[11px] font-semibold text-gray-500">
            {selectedHospital.distance_km?.toFixed(2)} km away
          </span>
        )}
      </footer>
    </section>
  );
}
