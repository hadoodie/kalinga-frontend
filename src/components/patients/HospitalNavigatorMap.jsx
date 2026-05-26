import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Maximize,
  Minimize,
  Navigation2,
  Settings,
  Stethoscope,
  Target,
} from "lucide-react";
import { KALINGA_CONFIG } from "@/constants/mapConfig";
import hospitalService from "@/services/hospitalService";
import { useBlockades } from "@/hooks/useBlockades";
import TurnByTurnNavigation from "../responder/response-mode/TurnByTurnNavigation";

const DEFAULT_CENTER = [
  KALINGA_CONFIG.DEFAULT_LOCATION.lat,
  KALINGA_CONFIG.DEFAULT_LOCATION.lng,
];

const ROUTE_PROXIMITY_THRESHOLD_METERS = 45;
const MAX_ROUTE_SAMPLE_POINTS = 300;
const DETOUR_OFFSETS_METERS = [50, 100, 200, 300, 500];
const DETOUR_MAX_DISTANCE_MULTIPLIER = 1.3;
const DETOUR_MAX_CANDIDATES = 100;
const DETOUR_SNAP_DISTANCE_METERS = 600;
const DEGREE_IN_RADIANS = Math.PI / 180;
const EARTH_RADIUS_METERS = 6378137;

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

const iconFactory = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

const haversineKm = (a, b) => {
  if (!a || !b) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
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
    blockade.start_lat ?? blockade.latitude ?? blockade.lat,
  );
  const lng = normalizeCoordinate(
    blockade.start_lng ?? blockade.longitude ?? blockade.lng,
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
      normalizedBlockades,
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
    normalizedBlockades,
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
    (evaluation) => evaluation.conflicts.length === 0,
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

const normalizeBearing = (bearing) => {
  const normalized = bearing % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const bearingBetweenPoints = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  if (
    Math.abs(start.lat - end.lat) < 1e-6 &&
    Math.abs(start.lng - end.lng) < 1e-6
  ) {
    return 0;
  }

  const φ1 = start.lat * DEGREE_IN_RADIANS;
  const φ2 = end.lat * DEGREE_IN_RADIANS;
  const Δλ = (end.lng - start.lng) * DEGREE_IN_RADIANS;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return normalizeBearing(θ / DEGREE_IN_RADIANS);
};

const offsetPointByBearing = (origin, distanceMeters, bearingDegrees) => {
  const φ1 = origin.lat * DEGREE_IN_RADIANS;
  const λ1 = origin.lng * DEGREE_IN_RADIANS;
  const θ = bearingDegrees * DEGREE_IN_RADIANS;
  const δ = distanceMeters / EARTH_RADIUS_METERS;

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);

  const λ2Raw =
    λ1 + Math.atan2(Math.sin(θ) * sinδ * cosφ1, cosδ - sinφ1 * sinφ2);

  const λ2 = ((λ2Raw + Math.PI) % (2 * Math.PI)) - Math.PI;

  return {
    lat: φ2 / DEGREE_IN_RADIANS,
    lng: λ2 / DEGREE_IN_RADIANS,
  };
};

const generateDetourWaypoints = (start, end, blockade) => {
  if (!start || !end || !blockade) {
    return [];
  }

  const baseBearing = bearingBetweenPoints(start, end);
  const perpendicularBearings = [
    normalizeBearing(baseBearing + 90),
    normalizeBearing(baseBearing - 90),
    normalizeBearing(baseBearing + 135),
    normalizeBearing(baseBearing - 135),
  ];

  const candidatePoints = [];

  perpendicularBearings.forEach((bearing) => {
    DETOUR_OFFSETS_METERS.forEach((offset) => {
      const offsetPoint = offsetPointByBearing(blockade, offset, bearing);
      candidatePoints.push({
        lat: offsetPoint.lat,
        lng: offsetPoint.lng,
        bearing,
        offset,
      });
    });
  });

  DETOUR_OFFSETS_METERS.forEach((offset) => {
    const forward = offsetPointByBearing(blockade, offset, baseBearing);
    const backward = offsetPointByBearing(
      blockade,
      offset,
      normalizeBearing(baseBearing + 180),
    );
    candidatePoints.push({
      lat: forward.lat,
      lng: forward.lng,
      bearing: baseBearing,
      offset,
    });
    candidatePoints.push({
      lat: backward.lat,
      lng: backward.lng,
      bearing: normalizeBearing(baseBearing + 180),
      offset,
    });
  });

  const seen = new Set();
  const unique = [];

  candidatePoints.forEach((candidate) => {
    const key = `${candidate.lat.toFixed(5)}_${candidate.lng.toFixed(5)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(candidate);
    }
  });

  return unique.slice(0, DETOUR_MAX_CANDIDATES);
};

const snapWaypointToRoad = async (osrmServer, waypoint) => {
  try {
    const response = await fetch(
      `${osrmServer}/nearest/v1/driving/${waypoint.lng},${waypoint.lat}?number=1`,
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data?.waypoints?.length) {
      return null;
    }

    const nearest = data.waypoints[0];
    return {
      lat: nearest.location[1],
      lng: nearest.location[0],
      distance: nearest.distance ?? 0,
      meta: waypoint,
    };
  } catch (error) {
    console.warn("Failed snapping waypoint to road", error);
    return null;
  }
};

const requestOsrmRoute = async (osrmServer, coordinates, paramsString) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const coordinatePath = coordinates
    .map((coord) => `${coord.lng},${coord.lat}`)
    .join(";");

  const url = `${osrmServer}/route/v1/driving/${coordinatePath}?${paramsString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data?.routes?.length) {
      return null;
    }
    return data.routes;
  } catch (error) {
    console.warn("OSRM route request failed", error);
    return null;
  }
};

const tryResolveRouteWithDynamicDetours = async ({
  osrmServer,
  baseParamOptions,
  start,
  end,
  normalizedBlockades,
  currentSelection,
}) => {
  if (!currentSelection?.selected?.conflicts?.length || !start || !end) {
    return null;
  }

  const primaryConflict = currentSelection.selected.conflicts[0];
  const normalizedConflict = normalizeBlockade(primaryConflict?.blockade);

  if (!normalizedConflict) {
    return null;
  }

  const candidates = generateDetourWaypoints(start, end, normalizedConflict);

  if (!candidates.length) {
    return null;
  }

  const originalDistance =
    currentSelection.selected?.route?.distance ??
    currentSelection.original?.route?.distance ??
    null;

  let bestImproved = null;
  let bestValidDetour = null;

  for (const candidate of candidates) {
    const snapped = await snapWaypointToRoad(osrmServer, candidate);
    if (!snapped) {
      continue;
    }

    if (snapped.distance > DETOUR_SNAP_DISTANCE_METERS) {
      continue;
    }

    const detourParams = {
      ...baseParamOptions,
      alternatives: "1",
    };

    const paramString = new URLSearchParams(detourParams).toString();
    const routes = await requestOsrmRoute(
      osrmServer,
      [start, snapped, end],
      paramString,
    );

    if (!routes || !routes.length) {
      continue;
    }

    const evaluationEntry = evaluateRoutesAgainstBlockades(
      [routes[0]],
      normalizedBlockades,
    )[0];

    if (!evaluationEntry) {
      continue;
    }

    if (
      originalDistance &&
      evaluationEntry.route?.distance &&
      evaluationEntry.route.distance >
        originalDistance * DETOUR_MAX_DISTANCE_MULTIPLIER
    ) {
      continue;
    }

    if (evaluationEntry.conflicts.length === 0) {
      if (
        !bestValidDetour ||
        evaluationEntry.route.distance <
          bestValidDetour.evaluation.route.distance
      ) {
        bestValidDetour = {
          evaluation: evaluationEntry,
          snapped,
          label: normalizedConflict.descriptor,
        };
      }
      continue;
    }

    if (
      !bestImproved ||
      evaluationEntry.closestDistance > bestImproved.evaluation.closestDistance
    ) {
      bestImproved = {
        evaluation: evaluationEntry,
        snapped,
      };
    }
  }

  if (bestValidDetour) {
    return {
      selected: bestValidDetour.evaluation,
      original: currentSelection.original,
      rerouted: true,
      blockadesPresent: true,
      alternativesAvailable: currentSelection.alternativesAvailable,
      detourMeta: {
        label: bestValidDetour.label,
        waypoint: bestValidDetour.snapped,
        strategy: "dynamic",
      },
    };
  }

  if (
    bestImproved &&
    bestImproved.evaluation.closestDistance >
      (currentSelection.selected?.closestDistance ?? 0) + 10
  ) {
    return {
      selected: bestImproved.evaluation,
      original: currentSelection.original,
      rerouted: true,
      blockadesPresent: true,
      alternativesAvailable: currentSelection.alternativesAvailable,
      detourMeta: {
        label: normalizedConflict.descriptor,
        waypoint: bestImproved.snapped,
        strategy: "dynamic-improved",
      },
    };
  }

  return null;
};

const deriveRouteAlert = (selection) => {
  if (!selection || !selection.blockadesPresent) {
    return null;
  }

  const { selected, original, rerouted, alternativesAvailable } = selection;
  const selectedConflicts = selected?.conflicts ?? [];
  const originalConflicts = original?.conflicts ?? [];

  const detourDescriptor = selection.detourMeta?.label;
  const conflictSource =
    (rerouted && originalConflicts.length > 0 ? originalConflicts[0] : null) ||
    (selectedConflicts.length > 0 ? selectedConflicts[0] : null);

  const descriptor =
    conflictSource?.label || detourDescriptor || "the reported blockade";

  if (selection.detourMeta && selectedConflicts.length === 0) {
    return {
      type: "info",
      icon: "✅",
      message: `Detour plotted to keep you clear of ${descriptor}.`,
    };
  }

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

const normalizeHospitals = (payload) => {
  const data = Array.isArray(payload?.data) ? payload.data : payload;
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const lat = Number(item.latitude ?? item.lat ?? item.coords?.lat);
      const lng = Number(item.longitude ?? item.lng ?? item.coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: item.id ?? item.code ?? `${lat}_${lng}`,
        name: item.name ?? item.label ?? "Hospital",
        address: item.address ?? item.full_address ?? "",
        distance_km: item.distance_km,
        capability_score: item.capability_score,
        latitude: lat,
        longitude: lng,
        raw: item,
      };
    })
    .filter(Boolean);
};

const getManeuverText = (step) => {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier;
  const roadName = step?.name || step?.ref || "the road";

  switch (type) {
    case "depart":
      return `Head ${modifier || "straight"} on ${roadName}`;
    case "turn":
      return `Turn ${modifier || "ahead"} onto ${roadName}`;
    case "merge":
      return `Merge ${modifier || "ahead"} onto ${roadName}`;
    case "roundabout":
    case "rotary":
      return `Take exit ${step?.maneuver?.exit || 1} at the roundabout`;
    case "arrive":
      return "You have arrived at the destination";
    default:
      return `Continue on ${roadName}`;
  }
};

const getManeuverGlyph = (step) => {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier || "";

  if (type === "arrive") return "🏁";
  if (type === "roundabout" || type === "rotary") return "🔄";
  if (type === "merge") return "🔀";
  if (type === "depart") return "🚀";
  if (type === "turn" && modifier.includes("left")) return "⬅️";
  if (type === "turn" && modifier.includes("right")) return "➡️";
  return "⬆️";
};

const processRouteInstructions = (steps = []) =>
  steps.map((step, index) => ({
    id: index,
    instruction: getManeuverText(step),
    icon: getManeuverGlyph(step),
    distance: Math.round(step?.distance || 0),
    duration: Math.round(step?.duration || 0),
    location: step?.maneuver?.location
      ? {
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
        }
      : null,
  }));

const formatMeters = (meters) => {
  if (!Number.isFinite(meters) || meters < 0) return "--";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return "< 1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatETA = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Recenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
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

const HospitalNavigatorMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [hospitalsError, setHospitalsError] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState(null);
  const [routeSelection, setRouteSelection] = useState(null);
  const [routeAlert, setRouteAlert] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockades, setShowBlockades] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [navigationEnabled, setNavigationEnabled] = useState(false);
  const [desktopActionsOpen, setDesktopActionsOpen] = useState(false);
  const [mobilePanelExpanded, setMobilePanelExpanded] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(null);
  const [totalDistanceRemaining, setTotalDistanceRemaining] = useState(null);
  const [totalDurationRemaining, setTotalDurationRemaining] = useState(null);
  const [isRerouting, setIsRerouting] = useState(false);
  const mapRef = useRef(null);

  const userIcon = useMemo(() => iconFactory("blue"), []);
  const hospitalIcon = useMemo(() => iconFactory("green"), []);

  const {
    blockades,
    loading: blockadesLoading,
    error: blockadesError,
  } = useBlockades({ pollingInterval: 120000 });

  const normalizedBlockades = useMemo(
    () => blockades.map(normalizeBlockade).filter(Boolean),
    [blockades],
  );

  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId],
  );

  const sortedHospitals = useMemo(() => {
    return hospitals
      .map((h) => {
        const distance = userLocation
          ? haversineKm(userLocation, { lat: h.latitude, lng: h.longitude })
          : (h.distance_km ?? Infinity);
        return { ...h, distance_km: distance };
      })
      .sort(
        (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
      );
  }, [hospitals, userLocation]);

  const fetchHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    setHospitalsError(null);
    try {
      const response = await hospitalService.getAll();
      const normalized = normalizeHospitals(response);
      if (normalized.length) {
        setHospitals(normalized);
        setSelectedHospitalId((prev) => prev ?? normalized[0].id);
        return;
      }
      setHospitals([]);
      setHospitalsError("No hospitals available yet.");
    } catch (err) {
      console.warn("Failed to load hospitals from database", err);
      setHospitals([]);
      setHospitalsError("Failed to load hospitals from database.");
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!userLocation || !selectedHospital) return;
    setLoadingRoute(true);
    setError(null);
    const start = { lat: userLocation.lat, lng: userLocation.lng };
    const end = {
      lat: selectedHospital.latitude,
      lng: selectedHospital.longitude,
    };
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      alternatives: "true",
      steps: "true",
      annotations: "true",
      continue_straight: "true",
    });

    try {
      const res = await fetch(
        `${
          KALINGA_CONFIG.OSRM_SERVER || "https://router.project-osrm.org"
        }/route/v1/driving/${start.lng},${start.lat};${end.lng},${
          end.lat
        }?${params.toString()}`,
      );

      if (!res.ok) {
        throw new Error(`Route request failed: ${res.status}`);
      }

      const data = await res.json();
      let selection = selectBestRouteVariant(
        data?.routes ?? [],
        normalizedBlockades,
      );

      if (selection?.selected?.conflicts?.length) {
        const detour = await tryResolveRouteWithDynamicDetours({
          osrmServer:
            KALINGA_CONFIG.OSRM_SERVER || "https://router.project-osrm.org",
          baseParamOptions: {
            overview: "full",
            geometries: "geojson",
            continue_straight: "true",
          },
          start,
          end,
          normalizedBlockades,
          currentSelection: selection,
        });

        if (detour) {
          selection = detour;
        }
      }

      if (selection?.selected?.coords?.length) {
        setRouteCoords(selection.selected.coords);
      } else {
        const fallback =
          data?.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [
            lat,
            lng,
          ]) ?? [];
        setRouteCoords(fallback);
      }

      const selectedRoute = selection?.selected?.route ?? data?.routes?.[0];
      const nextInstructions = processRouteInstructions(
        selectedRoute?.legs?.[0]?.steps || [],
      );
      setRouteInstructions(nextInstructions);
      setCurrentInstructionIndex(0);
      setDistanceToNextManeuver(nextInstructions[0]?.distance ?? null);
      setTotalDistanceRemaining(selectedRoute?.distance ?? null);
      setTotalDurationRemaining(selectedRoute?.duration ?? null);

      setRouteSelection(selection);
      setRouteAlert(deriveRouteAlert(selection));
    } catch (err) {
      console.error("Failed to fetch route", err);
      setError("Unable to fetch driving route. Please try again.");
      setRouteCoords([]);
      setRouteInstructions([]);
      setCurrentInstructionIndex(0);
      setDistanceToNextManeuver(null);
      setTotalDistanceRemaining(null);
      setTotalDurationRemaining(null);
      setRouteSelection(null);
      setRouteAlert(null);
    } finally {
      setLoadingRoute(false);
      setIsRerouting(false);
    }
  }, [normalizedBlockades, selectedHospital, userLocation]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    if (navigator?.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(next);
        },
        () => {
          setError(
            (prev) => prev ?? "Location unavailable. Using default center.",
          );
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
    setError(
      (prev) => prev ?? "Geolocation not supported. Using default center.",
    );
  }, []);

  useEffect(() => {
    if (selectedHospital && userLocation) {
      fetchRoute();
    }
  }, [selectedHospital, userLocation, fetchRoute]);

  useEffect(() => {
    if (!userLocation || !routeInstructions.length) return;

    let nearestIndex = -1;
    let nearestDistance = Infinity;

    routeInstructions.forEach((instruction, index) => {
      if (!instruction.location) return;
      const distance = haversineMeters(
        userLocation.lat,
        userLocation.lng,
        instruction.location.lat,
        instruction.location.lng,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex >= 0) {
      setCurrentInstructionIndex((prev) => Math.max(prev, nearestIndex));
    }
  }, [routeInstructions, userLocation]);

  useEffect(() => {
    const currentInstruction =
      routeInstructions[currentInstructionIndex] ?? null;
    setDistanceToNextManeuver(currentInstruction?.distance ?? null);

    if (!routeInstructions.length || !Number.isFinite(totalDistanceRemaining))
      return;

    const traveled = routeInstructions
      .slice(0, currentInstructionIndex)
      .reduce((sum, instruction) => sum + (instruction.distance || 0), 0);

    const remainingDistance = Math.max(0, totalDistanceRemaining - traveled);
    setTotalDistanceRemaining(remainingDistance);

    if (Number.isFinite(totalDurationRemaining) && totalDistanceRemaining > 0) {
      const remainingRatio = remainingDistance / totalDistanceRemaining;
      setTotalDurationRemaining((prev) => {
        if (!Number.isFinite(prev)) return prev;
        return Math.max(0, prev * remainingRatio);
      });
    }
  }, [currentInstructionIndex, routeInstructions]);

  const checkOffRoute = useCallback(() => {
    if (!routeCoords.length || !userLocation) return false;

    let minDistance = Infinity;
    const stride = Math.max(1, Math.floor(routeCoords.length / 60));
    for (let i = 0; i < routeCoords.length; i += stride) {
      const [lat, lng] = routeCoords[i];
      const distance = haversineMeters(
        userLocation.lat,
        userLocation.lng,
        lat,
        lng,
      );
      if (distance < minDistance) minDistance = distance;
    }

    return minDistance > 50;
  }, [routeCoords, userLocation]);

  useEffect(() => {
    if (!navigationEnabled || loadingRoute || isRerouting) return;
    if (!userLocation || !selectedHospital || !routeCoords.length) return;

    if (checkOffRoute()) {
      setIsRerouting(true);
      fetchRoute();
    }
  }, [
    checkOffRoute,
    fetchRoute,
    isRerouting,
    loadingRoute,
    navigationEnabled,
    routeCoords.length,
    selectedHospital,
    userLocation,
  ]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // ignore
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  const currentCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (selectedHospital)
      return [selectedHospital.latitude, selectedHospital.longitude];
    return DEFAULT_CENTER;
  }, [selectedHospital, userLocation]);

  const handleCenterOnUser = useCallback(() => {
    if (!mapRef.current) return;
    const target =
      (userLocation && [userLocation.lat, userLocation.lng]) || DEFAULT_CENTER;
    const currentZoom = mapRef.current.getZoom?.() ?? 13;
    mapRef.current.flyTo(target, Math.max(currentZoom, 14), { duration: 0.6 });
  }, [userLocation]);

  const bestHospital = sortedHospitals[0] ?? null;
  const currentInstruction = routeInstructions[currentInstructionIndex] ?? null;
  const upcomingInstructions = routeInstructions.slice(
    currentInstructionIndex + 1,
    currentInstructionIndex + 4,
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white p-4 shadow-sm md:block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-600">
              Best option
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              {hospitalsLoading
                ? "Loading hospitals..."
                : (bestHospital?.name ?? "Hospitals near you")}
            </h2>
            <p className="text-sm text-slate-600">
              {hospitalsLoading
                ? "Fetching hospitals from database"
                : (bestHospital?.address ??
                  "Select a hospital to begin navigation")}
            </p>
            {bestHospital && (
              <p className="text-sm text-slate-500">
                {(bestHospital.distance_km ?? 0).toFixed(2)} km away
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              onClick={fetchHospitals}
              disabled={hospitalsLoading}
            >
              {hospitalsLoading ? "Loading..." : "Refresh hospitals"}
            </button>
            <button
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              onClick={() =>
                bestHospital && setSelectedHospitalId(bestHospital.id)
              }
              disabled={!bestHospital}
            >
              Navigate to best
            </button>
          </div>
        </div>
        {hospitalsError && (
          <p className="mt-2 text-sm text-amber-600">{hospitalsError}</p>
        )}
        {error && <p className="mt-2 text-sm text-amber-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
        <p className="text-[10px] uppercase tracking-wide text-emerald-600">
          Best option
        </p>
        <p className="truncate text-base font-semibold text-slate-900">
          {hospitalsLoading
            ? "Loading hospitals..."
            : (bestHospital?.name ?? "Hospitals near you")}
        </p>
        {bestHospital && (
          <p className="mt-0.5 text-xs text-slate-500">
            {(bestHospital.distance_km ?? 0).toFixed(2)} km away
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
            onClick={fetchHospitals}
            disabled={hospitalsLoading}
          >
            {hospitalsLoading ? "Loading..." : "Refresh"}
          </button>
          <button
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
            onClick={() =>
              bestHospital && setSelectedHospitalId(bestHospital.id)
            }
            disabled={!bestHospital}
          >
            Navigate to best
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1 lg:flex lg:h-[520px] lg:flex-col lg:overflow-hidden">
          <p className="text-sm font-semibold text-slate-800">
            Hospitals nearby
          </p>
          <div className="mt-2 max-h-[300px] space-y-2 overflow-auto pr-1 lg:flex-1 lg:min-h-[220px] lg:max-h-none">
            {hospitalsLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading hospitals from database...
              </div>
            )}
            {!hospitalsLoading &&
              sortedHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => setSelectedHospitalId(hospital.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    hospital.id === selectedHospitalId
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{hospital.name}</span>
                    <span className="text-xs text-slate-500">
                      {(hospital.distance_km ?? 0).toFixed(2)} km
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {hospital.address || ""}
                  </p>
                </button>
              ))}
            {!hospitalsLoading && !sortedHospitals.length && (
              <p className="text-xs text-slate-500">No hospitals available.</p>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:mt-2 lg:max-h-[260px] lg:shrink-0 lg:overflow-hidden lg:flex lg:flex-col">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Turn-by-turn
            </p>
            <div className="mt-2 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-1">
              {loadingRoute ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating route instructions...
                </div>
              ) : currentInstruction ? (
                <div className="space-y-2">
                  <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Current step
                    </p>
                    <p className="mt-1 text-lg leading-none">
                      {currentInstruction.icon}
                    </p>
                    <p className="mt-1 text-sm font-black uppercase tracking-wide text-slate-900">
                      {currentInstruction.instruction}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatMeters(currentInstruction.distance)} to next turn
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[10px] uppercase text-slate-500">
                        Next turn
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {formatMeters(distanceToNextManeuver)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[10px] uppercase text-slate-500">
                        Remaining
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {formatMeters(totalDistanceRemaining)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[10px] uppercase text-slate-500">
                        ETA
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {formatETA(totalDurationRemaining)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-[10px] uppercase text-slate-500">
                      Travel time left
                    </p>
                    <p className="text-base font-black leading-none text-slate-800">
                      {formatDuration(totalDurationRemaining)}
                    </p>
                    {isRerouting && (
                      <p className="mt-1 text-[11px] font-medium text-amber-600">
                        Re-routing to keep navigation smooth...
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    {upcomingInstructions.map((instruction) => (
                      <div
                        key={instruction.id}
                        className="border-b border-slate-100 py-1 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {instruction.icon} {instruction.instruction}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatMeters(instruction.distance)} ahead
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Start or recalculate a route to view turn-by-turn guidance.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="relative h-[520px] w-full overflow-hidden rounded-2xl">
            <MapContainer
              center={currentCenter}
              zoom={13}
              minZoom={5}
              maxZoom={19}
              className={`h-full w-full ${
                isFullscreen ? "!h-[100vh] !w-screen" : ""
              }`}
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

              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userIcon}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    You are here
                  </Tooltip>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {showHospitals &&
                hospitals.map((hospital) => (
                  <Marker
                    key={hospital.id}
                    position={[hospital.latitude, hospital.longitude]}
                    icon={hospitalIcon}
                    eventHandlers={{
                      click: () => setSelectedHospitalId(hospital.id),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      {hospital.name}
                      {hospital.id === selectedHospitalId ? " • Selected" : ""}
                    </Tooltip>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{hospital.name}</p>
                        {hospital.address && (
                          <p className="text-slate-600">{hospital.address}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {(hospital.distance_km ?? 0).toFixed(2)} km away
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {showBlockades &&
                normalizedBlockades.map((blockade) => (
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

              {routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{
                    color:
                      routeAlert?.type === "danger"
                        ? "#dc2626"
                        : routeAlert?.type === "warning"
                          ? "#f97316"
                          : "#059669",
                    weight: 5,
                    opacity: 0.85,
                  }}
                />
              )}

              <Recenter
                center={
                  userLocation
                    ? [userLocation.lat, userLocation.lng]
                    : selectedHospital
                      ? [selectedHospital.latitude, selectedHospital.longitude]
                      : DEFAULT_CENTER
                }
                zoom={13}
              />
            </MapContainer>

            <div
              className={`absolute right-4 top-4 z-[1100] flex flex-col items-end gap-3 lg:hidden ${
                navigationEnabled ? "hidden" : ""
              }`}
            >
              <div
                className={`absolute right-0 top-16 flex flex-col items-start space-y-2 transition-all duration-300 ${
                  actionsOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <button
                  onClick={() => {
                    handleCenterOnUser();
                    setActionsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-lg transition-transform active:scale-95"
                  title="Center on you"
                >
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Center
                  </span>
                </button>
                <button
                  onClick={() => setShowHospitals((s) => !s)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-3 shadow-lg transition-all active:scale-95 ${
                    showHospitals
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                  title={showHospitals ? "Hide hospitals" : "Show hospitals"}
                >
                  <Stethoscope
                    className={`h-5 w-5 ${
                      showHospitals ? "text-emerald-600" : "text-slate-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      showHospitals ? "text-emerald-700" : "text-slate-700"
                    }`}
                  >
                    Hospitals
                  </span>
                </button>
                <button
                  onClick={() => setShowBlockades((s) => !s)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-3 shadow-lg transition-all active:scale-95 ${
                    showBlockades
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-200 bg-white"
                  }`}
                  title={
                    showBlockades ? "Hide road alerts" : "Show road alerts"
                  }
                >
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      showBlockades ? "text-orange-600" : "text-slate-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      showBlockades ? "text-orange-700" : "text-slate-700"
                    }`}
                  >
                    Road alerts
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionsOpen((s) => !s)}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white shadow-xl transition-all active:scale-95 ${
                    actionsOpen
                      ? "rotate-45 border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-slate-700"
                  }`}
                  title="Quick actions"
                >
                  <Settings className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div
              className={`hidden lg:block absolute top-4 right-4 z-[1200] ${
                navigationEnabled ? "hidden" : ""
              }`}
            >
              <div className="relative">
                {desktopActionsOpen && (
                  <div className="absolute right-0 top-full z-[1210] mt-2 w-56 space-y-2 rounded-2xl bg-white p-3 text-sm font-medium text-slate-700 shadow-[0_25px_45px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
                    <button
                      onClick={() => setShowHospitals((s) => !s)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50"
                      title={
                        showHospitals ? "Hide hospitals" : "Show hospitals"
                      }
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          showHospitals
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-slate-500"
                        }`}
                      >
                        <Stethoscope className="h-4 w-4" />
                      </span>
                      Hospitals
                      <span className="ml-auto text-xs text-gray-400">
                        {hospitals.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setShowBlockades((s) => !s)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50"
                      title={
                        showBlockades ? "Hide road alerts" : "Show road alerts"
                      }
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          showBlockades
                            ? "border-orange-200 bg-orange-50 text-orange-600"
                            : "border-gray-200 text-slate-500"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      Road alerts
                      <span className="ml-auto text-xs text-gray-400">
                        {normalizedBlockades.length}
                      </span>
                    </button>
                    <button
                      onClick={handleCenterOnUser}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50"
                      title="Center on you"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600">
                        <Target className="h-4 w-4" />
                      </span>
                      Center map
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDesktopActionsOpen((open) => !open)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white text-slate-700 shadow-xl transition hover:shadow-2xl ${
                      desktopActionsOpen ? "border-blue-600" : "border-gray-200"
                    }`}
                    title={
                      desktopActionsOpen
                        ? "Hide map controls"
                        : "Show map controls"
                    }
                  >
                    <Settings
                      className={`h-6 w-6 transition-transform ${
                        desktopActionsOpen ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setIsFullscreen((f) => !f)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-slate-700 shadow-xl transition hover:shadow-2xl"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-6 w-6" />
                    ) : (
                      <Maximize className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {isFullscreen && (
              <div
                onClick={() => setIsFullscreen(false)}
                className="fixed inset-0 z-[1050] bg-black/30 lg:hidden"
                aria-hidden
              />
            )}

            {routeAlert && !loadingRoute && !navigationEnabled && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[320px] rounded-xl bg-white px-4 py-2 text-sm shadow-lg">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="text-lg" aria-hidden>
                    {routeAlert.icon}
                  </span>
                  <span className="text-left text-sm">
                    {routeAlert.message}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile bottom sheet (responder-style) keeps map visible while exposing controls/details */}
            {!navigationEnabled && (
              <div className="absolute inset-x-0 bottom-0 z-[1110] rounded-t-2xl border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobilePanelExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {mobilePanelExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                  {mobilePanelExpanded
                    ? "Collapse details"
                    : "Show hospitals & directions"}
                </button>

                {!mobilePanelExpanded && (
                  <div className="px-4 pb-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Current best
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {bestHospital?.name ?? "Waiting for hospitals"}
                      </p>
                      {currentInstruction && (
                        <p className="text-xs text-slate-600">
                          {currentInstruction.icon}{" "}
                          {currentInstruction.instruction}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {mobilePanelExpanded && (
                  <div className="max-h-[62vh] space-y-3 overflow-y-auto px-4 pb-4">
                    {userLocation && selectedHospital && (
                      <button
                        onClick={() => setNavigationEnabled(true)}
                        className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                      >
                        Start Navigation
                      </button>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Hospitals nearby
                      </p>
                      <div className="mt-2 max-h-[220px] space-y-2 overflow-auto pr-1">
                        {sortedHospitals.map((hospital) => (
                          <button
                            key={`mobile_${hospital.id}`}
                            onClick={() => {
                              setSelectedHospitalId(hospital.id);
                              setMobilePanelExpanded(false);
                            }}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                              hospital.id === selectedHospitalId
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {hospital.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {(hospital.distance_km ?? 0).toFixed(2)} km
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {hospital.address || ""}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Turn-by-turn
                      </p>
                      {currentInstruction ? (
                        <div className="mt-2 space-y-2">
                          <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              Current step
                            </p>
                            <p className="mt-1 text-lg leading-none">
                              {currentInstruction.icon}
                            </p>
                            <p className="mt-1 text-sm font-black uppercase tracking-wide text-slate-900">
                              {currentInstruction.instruction}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatMeters(currentInstruction.distance)} to
                              next turn
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-white p-2">
                              <p className="text-[10px] uppercase text-slate-500">
                                Next
                              </p>
                              <p className="text-xs font-semibold text-slate-800">
                                {formatMeters(distanceToNextManeuver)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white p-2">
                              <p className="text-[10px] uppercase text-slate-500">
                                Remaining
                              </p>
                              <p className="text-xs font-semibold text-slate-800">
                                {formatMeters(totalDistanceRemaining)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white p-2">
                              <p className="text-[10px] uppercase text-slate-500">
                                ETA
                              </p>
                              <p className="text-xs font-semibold text-slate-800">
                                {formatETA(totalDurationRemaining)}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-white p-2">
                            <p className="text-[10px] uppercase text-slate-500">
                              Travel time left
                            </p>
                            <p className="text-base font-black leading-none text-slate-800">
                              {formatDuration(totalDurationRemaining)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-2">
                            {upcomingInstructions.map((instruction) => (
                              <div
                                key={`mobile_upcoming_${instruction.id}`}
                                className="border-b border-slate-100 py-1 last:border-b-0"
                              >
                                <p className="text-sm font-medium text-slate-800">
                                  {instruction.icon} {instruction.instruction}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {formatMeters(instruction.distance)} ahead
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">
                          Select a hospital to view turn-by-turn details.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {routeCoords.length > 0 &&
              navigationEnabled &&
              userLocation &&
              selectedHospital && (
                <TurnByTurnNavigation
                  isActive={navigationEnabled}
                  destination={[
                    selectedHospital.latitude,
                    selectedHospital.longitude,
                  ]}
                  destinationName={selectedHospital.name || "Hospital"}
                  currentPosition={[userLocation.lat, userLocation.lng]}
                  heading={null}
                  incident={null}
                  onClose={() => setNavigationEnabled(false)}
                  onRouteUpdate={(route) => {
                    if (route?.geometry?.coordinates) {
                      const coords = route.geometry.coordinates.map(
                        ([lng, lat]) => [lat, lng],
                      );
                      setRouteCoords(coords);
                    }
                  }}
                  onLocationBroadcast={() => {}}
                />
              )}

            {!navigationEnabled && userLocation && selectedHospital && (
              <button
                onClick={() => setNavigationEnabled(true)}
                className={`absolute left-1/2 z-[1120] flex -translate-x-1/2 items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95 ${
                  mobilePanelExpanded ? "hidden lg:flex" : "flex"
                } bottom-6 lg:bottom-6`}
              >
                <Navigation2 className="h-5 w-5" />
                Start Navigation
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
            <div className="space-x-2">
              <span className="font-semibold">Navigation</span>
              {selectedHospital ? (
                <span>
                  Routing to {selectedHospital.name}
                  {userLocation && selectedHospital
                    ? ` · ${haversineKm(userLocation, {
                        lat: selectedHospital.latitude,
                        lng: selectedHospital.longitude,
                      }).toFixed(2)} km`
                    : ""}
                </span>
              ) : (
                <span>Select a hospital to navigate</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {blockadesLoading
                  ? "Checking road issues…"
                  : blockadesError
                    ? "Road issues offline"
                    : `${normalizedBlockades.length} road alerts`}
              </span>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={fetchRoute}
                disabled={loadingRoute || !selectedHospital || !userLocation}
              >
                {loadingRoute ? "Calculating…" : "Recalculate route"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalNavigatorMap;
