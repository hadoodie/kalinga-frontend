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
import LocationSimulator from "../../maps/LocationSimulator";
import { useBlockades } from "../../../hooks/useBlockades";

const DEFAULT_POSITION = [
  KALINGA_CONFIG.DEFAULT_LOCATION.lat,
  KALINGA_CONFIG.DEFAULT_LOCATION.lng,
];

const ROUTE_PROXIMITY_THRESHOLD_METERS = 45;
const MAX_ROUTE_SAMPLE_POINTS = 220;

const BLOCKADE_SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#f97316",
  high: "#ea580c",
  critical: "#dc2626",
};

const BLOCKADE_ICON_CACHE = {};

const getBlockadeIcon = (severity = "medium") => {
  if (BLOCKADE_ICON_CACHE[severity]) {
    return BLOCKADE_ICON_CACHE[severity];
  }

  const background = BLOCKADE_SEVERITY_COLORS[severity] || "#f97316";
  BLOCKADE_ICON_CACHE[severity] = L.divIcon({
    className: "blockade-marker",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 2px solid #fff;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.3);
        background:${background};
        color:#fff;
      ">
        🚧
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
  });

  return BLOCKADE_ICON_CACHE[severity];
};

const normalizeCoordinate = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toLatLngTuple = (coordinate) => {
  if (!Array.isArray(coordinate) || coordinate.length !== 2) {
    return null;
  }
  const [lat, lng] = coordinate;
  const normalizedLat = normalizeCoordinate(lat);
  const normalizedLng = normalizeCoordinate(lng);
  if (!Number.isFinite(normalizedLat) || !Number.isFinite(normalizedLng)) {
    return null;
  }
  return [normalizedLat, normalizedLng];
};

const normalizeBlockade = (blockade) => {
  if (!blockade) return null;
  const lat = normalizeCoordinate(
    blockade.start_lat ?? blockade.latitude ?? blockade.lat
  );
  const lng = normalizeCoordinate(
    blockade.start_lng ?? blockade.longitude ?? blockade.lng
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const descriptor =
    (typeof blockade.title === "string" && blockade.title.trim()) ||
    (typeof blockade.road_name === "string" && blockade.road_name.trim()) ||
    "Reported blockade";

  return {
    id: blockade.id ?? `${lat}_${lng}`,
    lat,
    lng,
    severity: blockade.severity || "medium",
    descriptor,
    raw: blockade,
  };
};

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
};

const sampleRouteCoordinates = (coords) => {
  if (!Array.isArray(coords) || !coords.length) {
    return [];
  }

  if (coords.length <= MAX_ROUTE_SAMPLE_POINTS) {
    return coords;
  }

  const step = Math.ceil(coords.length / MAX_ROUTE_SAMPLE_POINTS);
  const sampled = [];
  for (let i = 0; i < coords.length; i += step) {
    sampled.push(coords[i]);
  }

  const last = coords[coords.length - 1];
  const lastSample = sampled[sampled.length - 1];
  if (!lastSample || lastSample[0] !== last[0] || lastSample[1] !== last[1]) {
    sampled.push(last);
  }

  return sampled;
};

const analyzeRouteAgainstBlockades = (coords, normalizedBlockades) => {
  if (!coords.length || !normalizedBlockades.length) {
    return { closestDistance: Infinity, conflicts: [] };
  }

  let closestDistance = Infinity;
  const conflicts = [];

  normalizedBlockades.forEach((blockade) => {
    let nearest = Infinity;

    coords.forEach(([lat, lng]) => {
      const distance = haversineMeters(blockade.lat, blockade.lng, lat, lng);
      if (distance < nearest) {
        nearest = distance;
      }
      if (nearest <= ROUTE_PROXIMITY_THRESHOLD_METERS) {
        return;
      }
    });

    if (nearest < closestDistance) {
      closestDistance = nearest;
    }

    if (nearest <= ROUTE_PROXIMITY_THRESHOLD_METERS) {
      conflicts.push({
        blockade: blockade.raw,
        label: blockade.descriptor,
        distance: nearest,
      });
    }
  });

  return { closestDistance, conflicts };
};

const evaluateRoutesAgainstBlockades = (routes, normalizedBlockades) =>
  routes.map((route, index) => {
    const coords = Array.isArray(route?.geometry?.coordinates)
      ? route.geometry.coordinates
          .map(([lng, lat]) => toLatLngTuple([lat, lng]))
          .filter(Boolean)
      : [];

    const analysis = analyzeRouteAgainstBlockades(
      sampleRouteCoordinates(coords),
      normalizedBlockades
    );

    return {
      index,
      route,
      coords,
      closestDistance: analysis.closestDistance,
      conflicts: analysis.conflicts,
    };
  });

const selectBestRouteVariant = (routes, normalizedBlockades) => {
  if (!Array.isArray(routes) || !routes.length) {
    return null;
  }

  const evaluations = evaluateRoutesAgainstBlockades(
    routes,
    normalizedBlockades
  );
  const original = evaluations[0];
  const blockadesPresent = normalizedBlockades.length > 0;

  if (!blockadesPresent) {
    return {
      selected: original,
      original,
      rerouted: false,
      blockadesPresent,
      alternativesAvailable: evaluations.length > 1,
    };
  }

  const blockadeFreeRoutes = evaluations.filter(
    (evaluation) => evaluation.conflicts.length === 0
  );

  if (blockadeFreeRoutes.length) {
    const best = blockadeFreeRoutes.reduce((current, candidate) => {
      if (!current) return candidate;
      const candidateDistance = candidate.route?.distance ?? Infinity;
      const currentDistance = current.route?.distance ?? Infinity;
      return candidateDistance < currentDistance ? candidate : current;
    }, null);

    return {
      selected: best,
      original,
      rerouted: best.index !== original.index,
      blockadesPresent,
      alternativesAvailable: evaluations.length > 1,
    };
  }

  const bestAvailable = evaluations.reduce((current, candidate) => {
    if (!current) return candidate;
    if (candidate.closestDistance === current.closestDistance) {
      const candidateDistance = candidate.route?.distance ?? Infinity;
      const currentDistance = current.route?.distance ?? Infinity;
      return candidateDistance < currentDistance ? candidate : current;
    }
    return candidate.closestDistance > current.closestDistance
      ? candidate
      : current;
  }, null);

  return {
    selected: bestAvailable,
    original,
    rerouted: bestAvailable.index !== original.index,
    blockadesPresent,
    alternativesAvailable: evaluations.length > 1,
  };
};

const deriveRouteAlert = (selection) => {
  if (!selection || !selection.blockadesPresent) {
    return null;
  }

  const { selected, original, rerouted, alternativesAvailable } = selection;
  const selectedConflicts = selected?.conflicts ?? [];
  const originalConflicts = original?.conflicts ?? [];
  const descriptor =
    selectedConflicts[0]?.label ||
    originalConflicts[0]?.label ||
    "the reported blockade";

  if (selectedConflicts.length === 0 && rerouted) {
    return {
      type: "info",
      icon: "✅",
      message: `Alternate route selected to avoid ${descriptor}.`,
    };
  }

  if (selectedConflicts.length > 0) {
    const severity =
      selected.closestDistance <= ROUTE_PROXIMITY_THRESHOLD_METERS / 2
        ? "danger"
        : "warning";

    const intro = rerouted
      ? "Limited detours available."
      : alternativesAvailable
      ? "No clear detour available."
      : "Blockade ahead.";

    return {
      type: severity,
      icon: severity === "danger" ? "⛔" : "⚠️",
      message: `${intro} Blockade near ${descriptor}. Proceed with caution.`,
    };
  }

  if (originalConflicts.length > 0) {
    return {
      type: "warning",
      icon: "⚠️",
      message: `Blockade reported near ${descriptor}. Showing best available path.`,
    };
  }

  return null;
};

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
  const [isSimulatingResponder, setIsSimulatingResponder] = useState(false);
  const liveResponderRef = useRef(null);
  const isSimulatingRef = useRef(false);
  const [routePoints, setRoutePoints] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeSelection, setRouteSelection] = useState(null);
  const [routeAlert, setRouteAlert] = useState(null);
  const trackingWatchId = useRef(null);
  const mapRef = useRef(null);

  // Use the real-time blockades hook (WebSocket + polling fallback every 2 mins)
  const {
    blockades,
    loading: blockadesLoading,
    error: blockadesError,
  } = useBlockades({ pollingInterval: 120000 });

  useEffect(() => {
    isSimulatingRef.current = isSimulatingResponder;
  }, [isSimulatingResponder]);

  const normalizedBlockades = useMemo(
    () => blockades.map(normalizeBlockade).filter(Boolean),
    [blockades]
  );

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
  const isOnScene = incident?.status === "on_scene";

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
        const coords = [latitude, longitude];
        liveResponderRef.current = coords;
        if (isSimulatingRef.current) {
          return;
        }
        setResponderPosition(coords);
      },
      () => {
        if (!responderPosition && !isSimulatingRef.current) {
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
    if (mode === "hospital") {
      if (isOnScene && responderPosition) {
        return responderPosition;
      }
      if (incidentPosition) {
        return incidentPosition;
      }
    }
    return responderPosition ?? incidentPosition;
  }, [incidentPosition, isOnScene, mode, responderPosition]);

  const activeDestination = useMemo(() => {
    if (mode === "hospital") {
      return hospitalPosition ?? incidentPosition;
    }
    return incidentPosition;
  }, [hospitalPosition, incidentPosition, mode]);

  const routingKey = useMemo(() => {
    if (!activeStart || !activeDestination) return null;
    const startKey = `${activeStart[0].toFixed(4)},${activeStart[1].toFixed(
      4
    )}`;
    const destKey = `${activeDestination[0].toFixed(
      4
    )},${activeDestination[1].toFixed(4)}`;
    return `${startKey}|${destKey}`;
  }, [activeStart, activeDestination]);

  useEffect(() => {
    if (!routingKey) {
      setRoutePoints(null);
      setRouteSelection(null);
      setRouteAlert(null);
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

        const params = new URLSearchParams({
          overview: "full",
          geometries: "geojson",
          alternatives: "true",
          continue_straight: "true",
        });

        const response = await fetch(
          `${
            KALINGA_CONFIG.OSRM_SERVER
          }/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Route request failed: ${response.status}`);
        }

        const data = await response.json();
        const selection = selectBestRouteVariant(
          data?.routes ?? [],
          normalizedBlockades
        );

        if (!cancelled) {
          if (selection?.selected?.coords?.length) {
            setRoutePoints(selection.selected.coords);
          } else {
            const fallback =
              data?.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [
                lat,
                lng,
              ]) ?? null;
            setRoutePoints(fallback);
          }

          setRouteSelection(selection);
          setRouteAlert(deriveRouteAlert(selection));
        }
      } catch (error) {
        console.error("Failed to fetch route", error);
        if (!cancelled) {
          setRouteError("Unable to compute route.");
          setRoutePoints(null);
          setRouteSelection(null);
          setRouteAlert(null);
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
  }, [routingKey, normalizedBlockades]);

  const currentCenter = useMemo(() => {
    if (mode === "hospital") {
      if (isOnScene && responderPosition) {
        return responderPosition;
      }
      if (incidentPosition) {
        return incidentPosition;
      }
    }
    if (responderPosition) {
      return responderPosition;
    }
    return incidentPosition;
  }, [incidentPosition, isOnScene, mode, responderPosition]);

  const handleSimulatedLocationChange = (coords, options = {}) => {
    if (!coords) return;
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    const next = [lat, lng];
    setIsSimulatingResponder(true);
    setResponderPosition(next);

    if (options.centerMap !== false && mapRef.current) {
      mapRef.current.flyTo(next, Math.max(13, mapRef.current.getZoom()), {
        duration: 0.6,
      });
    }
  };

  const handleStopSimulatedLocation = () => {
    setIsSimulatingResponder(false);
    const fallback = liveResponderRef.current || responderPosition;
    if (fallback) {
      setResponderPosition(fallback);
      if (mapRef.current) {
        mapRef.current.flyTo(fallback, Math.max(13, mapRef.current.getZoom()), {
          duration: 0.6,
        });
      }
    }
  };

  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 ${
              mode === "hospital" ? "bg-emerald-50" : "bg-blue-50"
            }`}
          >
            {mode === "hospital" ? (
              <Stethoscope className="h-6 w-6 text-emerald-600" />
            ) : (
              <Navigation2 className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {mode === "hospital"
                ? "Hospital transfer planning"
                : "Responder navigation"}
            </p>
            <h3 className="text-lg font-black text-gray-900">
              {mode === "hospital"
                ? selectedHospital?.name || "Awaiting hospital assignment"
                : incident?.type || "Active routing"}
            </h3>
            <p className="text-xs text-gray-500">
              {mode === "hospital"
                ? selectedHospital?.address ||
                  "Nearest capable facility auto-selected"
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
        <LocationSimulator
          currentLocation={
            responderPosition
              ? { lat: responderPosition[0], lng: responderPosition[1] }
              : incidentPosition
              ? { lat: incidentPosition[0], lng: incidentPosition[1] }
              : null
          }
          isActive={isSimulatingResponder}
          onLocationChange={handleSimulatedLocationChange}
          onStopSimulation={handleStopSimulatedLocation}
          buttonLabel="Simulate responder"
        />
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
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
            subdomains="abcd"
            maxZoom={19}
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

          {normalizedBlockades.map((blockade) => (
            <Marker
              key={blockade.id}
              position={[blockade.lat, blockade.lng]}
              icon={getBlockadeIcon(blockade.severity)}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs font-semibold text-slate-800">
                  {blockade.descriptor}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  {blockade.severity} road issue
                </div>
              </Tooltip>
            </Marker>
          ))}

          {routePoints && routePoints.length > 1 && (
            <Polyline
              positions={routePoints}
              color={
                routeAlert?.type === "danger"
                  ? "#dc2626"
                  : routeAlert?.type === "warning"
                  ? "#f97316"
                  : mode === "hospital"
                  ? "#059669"
                  : "#2563eb"
              }
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

        {(routeAlert || routeError) && !routeLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[320px] rounded-xl bg-white px-4 py-2 text-sm shadow-lg">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              {routeAlert ? (
                <span className="text-lg" aria-hidden>
                  {routeAlert.icon}
                </span>
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-left text-sm">
                {routeAlert?.message || routeError}
              </span>
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
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span>
            {blockadesLoading
              ? "Checking road issues…"
              : blockadesError
              ? "Road issues offline"
              : `${normalizedBlockades.length} road alerts nearby`}
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
