import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
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
import {
  Activity,
  AlertTriangle,
  Loader2,
  Navigation2,
  Stethoscope,
  Maximize,
  Minimize,
  Settings,
  Target,
  X,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KALINGA_CONFIG } from "../../../constants/mapConfig";
import LocationSimulator from "../../maps/LocationSimulator";
import { useBlockades } from "../../../hooks/useBlockades";
import TurnByTurnNavigation from "./TurnByTurnNavigation";
import { useResponderLocationBroadcast } from "../../../hooks/useResponderLocationBroadcast";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import blockadeService from "../../../services/blockadeService";

const DEFAULT_POSITION = [
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

  // Add forward/backward offsets to encourage bypassing by overshooting blockade
  DETOUR_OFFSETS_METERS.forEach((offset) => {
    const forward = offsetPointByBearing(blockade, offset, baseBearing);
    const backward = offsetPointByBearing(
      blockade,
      offset,
      normalizeBearing(baseBearing + 180)
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
      `${osrmServer}/nearest/v1/driving/${waypoint.lng},${waypoint.lat}?number=1`
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
  // Use normalizeBlockade instead of normalizeBlockadePosition as it is named in this file
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
      paramString
    );

    if (!routes || !routes.length) {
      continue;
    }

    const evaluationEntry = evaluateRoutesAgainstBlockades(
      [routes[0]],
      normalizedBlockades
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

const buildResponderHeadingIcon = (heading) => {
  const normalized = Number.isFinite(heading)
    ? ((heading % 360) + 360) % 360
    : 0;

  // SVG-based arrow so we can rotate to match road orientation (drive-mode feel).
  return L.divIcon({
    className: "responder-heading-icon",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:46px;height:46px;">
        <svg width="46" height="46" viewBox="0 0 46 46" style="transform: rotate(${normalized}deg); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
          <g fill="#2563eb" stroke="#ffffff" stroke-width="2">
            <path d="M23 4 L33 34 L23 27 L13 34 Z" />
          </g>
        </svg>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 32], // tip of arrow sits on the coordinate
    tooltipAnchor: [0, -30],
  });
};

const responderIcon = buildResponderHeadingIcon(0);
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
  const [navigationEnabled, setNavigationEnabled] = useState(false);
  const [responderHeading, setResponderHeading] = useState(null);
  const trackingWatchId = useRef(null);
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockades, setShowBlockades] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [desktopFabOpen, setDesktopFabOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });
  const [reportCoords, setReportCoords] = useState(null);
  const [removingBlockadeId, setRemovingBlockadeId] = useState(null);
  const transportNavTriggeredRef = useRef(false);
  const { user } = useAuth();

  const canManageBlockades = useMemo(() => {
    const role = user?.role?.toLowerCase?.();
    return role === "admin" || role === "responder" || user?.is_admin;
  }, [user]);

  // Broadcast responder location to patient via WebSocket.
  // Enable while incident is active (responder en route or on scene) so patient can track.
  const {
    position: broadcastPosition,
    heading: broadcastHeading,
    isTracking: isBroadcasting,
    broadcast,
  } = useResponderLocationBroadcast({
    incidentId: incident?.id,
    enabled:
      !!incident &&
      ["acknowledged", "en_route", "on_scene", "transporting"].includes(
        incident?.status
      ),
    broadcastInterval: 5000,
  });

  // Keep map responder state in sync with the broadcast hook (if it produces a position)
  useEffect(() => {
    if (
      broadcastPosition &&
      Array.isArray(broadcastPosition) &&
      broadcastPosition.length === 2
    ) {
      setResponderPosition([broadcastPosition[0], broadcastPosition[1]]);
    }
    if (typeof broadcastHeading !== "undefined" && broadcastHeading !== null) {
      setResponderHeading(broadcastHeading);
    }
  }, [broadcastPosition, broadcastHeading]);

  // Use the real-time blockades hook (WebSocket + polling fallback every 2 mins)
  const {
    blockades,
    loading: blockadesLoading,
    error: blockadesError,
    refetch: refetchBlockades,
    updateBlockade: updateBlockadeLocal,
    removeBlockade: removeBlockadeLocal,
  } = useBlockades({ pollingInterval: 120000 });

  useEffect(() => {
    isSimulatingRef.current = isSimulatingResponder;
  }, [isSimulatingResponder]);

  const normalizedBlockades = useMemo(
    () => blockades.map(normalizeBlockade).filter(Boolean),
    [blockades]
  );

  const responderMarkerIcon = useMemo(
    () => buildResponderHeadingIcon(responderHeading),
    [responderHeading]
  );

  const incidentPosition = useMemo(
    () => getIncidentPosition(incident) || DEFAULT_POSITION,
    [incident]
  );

  const nearestHospital = hospitals?.[0] ?? null;

  const hospitalPosition = useMemo(
    () => getHospitalPosition(selectedHospital ?? nearestHospital),
    [selectedHospital, nearestHospital]
  );

  const hospitalMarkers = useMemo(() => {
    if (!Array.isArray(hospitals)) {
      return [];
    }
    return hospitals
      .map((hospital) => {
        const lat = normalizeCoordinate(hospital.latitude);
        const lng = normalizeCoordinate(hospital.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return {
          id: hospital.id ?? `${lat}_${lng}`,
          hospital,
          position: [lat, lng],
          isSelected:
            selectedHospital &&
            String(selectedHospital.id) === String(hospital.id),
        };
      })
      .filter(Boolean);
  }, [hospitals, selectedHospital]);

  const visibleHospitalCount = hospitalMarkers.length;

  const mode = determineMode(incident?.status);
  const isOnScene = incident?.status === "on_scene";

  useEffect(() => {
    const shouldLockHospital = ["on_scene", "transporting"].includes(
      incident?.status
    );
    if (
      autoAssignmentEnabled &&
      shouldLockHospital &&
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
    const isTransporting = incident?.status === "transporting";
    if (isTransporting && !transportNavTriggeredRef.current) {
      transportNavTriggeredRef.current = true;
      if (
        autoAssignmentEnabled &&
        !selectedHospital &&
        nearestHospital &&
        onAutoAssignHospital
      ) {
        onAutoAssignHospital(nearestHospital);
      }
      if (!navigationEnabled) {
        setNavigationEnabled(true);
      }
    } else if (!isTransporting) {
      transportNavTriggeredRef.current = false;
    }
  }, [
    autoAssignmentEnabled,
    incident?.status,
    navigationEnabled,
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
        // Prefer the broadcast hook's position when available (keeps what we send to server as source of truth)
        if (
          broadcastPosition &&
          Array.isArray(broadcastPosition) &&
          broadcastPosition.length === 2
        ) {
          setResponderPosition([broadcastPosition[0], broadcastPosition[1]]);
        } else {
          setResponderPosition(coords);
        }
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

  // When fullscreen toggles, invalidate map size so Leaflet renders correctly
  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // slight delay to allow DOM to settle when entering fullscreen
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // ignore
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isFullscreen]);

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
        let selection = selectBestRouteVariant(
          data?.routes ?? [],
          normalizedBlockades
        );

        // Try dynamic detour if conflicts exist
        if (selection?.selected?.conflicts?.length > 0) {
          const detour = await tryResolveRouteWithDynamicDetours({
            osrmServer: KALINGA_CONFIG.OSRM_SERVER,
            baseParamOptions: {
              overview: "full",
              geometries: "geojson",
              continue_straight: "true",
            },
            start: { lat: startLat, lng: startLng },
            end: { lat: endLat, lng: endLng },
            normalizedBlockades,
            currentSelection: selection,
          });

          if (detour) {
            selection = detour;
          }
        }

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

  // If we have a selected route and broadcasting is active, send ETA and distance
  useEffect(() => {
    if (!routeSelection || !isBroadcasting) return;

    const selected =
      routeSelection.selected?.original || routeSelection.selected || null;
    if (!selected) return;

    const durationSec =
      selected.duration ?? selected?.legs?.[0]?.duration ?? null;
    const distanceMeters =
      selected.distance ?? selected?.legs?.[0]?.distance ?? null;

    if (typeof broadcast === "function") {
      try {
        const etaMinutes = durationSec ? Math.round(durationSec / 60) : null;
        const distanceKm = distanceMeters
          ? Number((distanceMeters / 1000).toFixed(3))
          : null;
        // Fire a manual broadcast to include ETA and remaining distance
        broadcast({ eta: etaMinutes, distance: distanceKm });
      } catch (e) {
        console.warn("Failed to broadcast ETA/distance", e);
      }
    }
  }, [routeSelection, isBroadcasting, broadcast]);

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

  const handleCenterOnResponder = useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    const target =
      currentCenter ||
      responderPosition ||
      incidentPosition ||
      DEFAULT_POSITION;
    const currentZoom = mapRef.current.getZoom?.() ?? 13;
    mapRef.current.flyTo(target, Math.max(currentZoom, 14), {
      duration: 0.6,
    });
  }, [currentCenter, incidentPosition, responderPosition]);

  const openReportModal = useCallback(() => {
    const coords =
      responderPosition ||
      incidentPosition ||
      currentCenter ||
      DEFAULT_POSITION;

    setReportCoords(coords);
    setReportError(null);
    setReportForm((prev) => ({
      ...prev,
      title: prev.title || "Road blockade",
    }));
    setReportModalOpen(true);
    setDesktopFabOpen(false);
  }, [currentCenter, incidentPosition, responderPosition]);

  // Auto-populate title with nearest road when modal opens
  useEffect(() => {
    const fetchRoadName = async () => {
      const coords =
        reportCoords ||
        responderPosition ||
        incidentPosition ||
        currentCenter ||
        DEFAULT_POSITION;

      try {
        const [lat, lng] = coords;
        const response = await fetch(
          `${KALINGA_CONFIG.OSRM_SERVER}/nearest/v1/driving/${lng},${lat}?number=1`
        );
        const data = await response.json();
        const name = data?.waypoints?.[0]?.name;

        if (typeof name === "string" && name.trim()) {
          setReportForm((prev) => {
            const existing = prev.title?.trim();
            if (existing && existing !== "Road blockade") {
              return prev; // respect user input
            }
            return { ...prev, title: `Blockade on ${name.trim()}` };
          });
        }
      } catch (err) {
        // Silent failure; keep manual title
      }
    };

    if (reportModalOpen) {
      fetchRoadName();
    }
  }, [
    currentCenter,
    incidentPosition,
    reportCoords,
    reportModalOpen,
    responderPosition,
  ]);

  const handleSubmitBlockade = useCallback(async () => {
    if (!user?.id) {
      setReportError("Login required to report a blockade.");
      return;
    }

    const coords =
      reportCoords ||
      responderPosition ||
      incidentPosition ||
      currentCenter ||
      DEFAULT_POSITION;

    const payload = {
      title: reportForm.title.trim() || "Road blockade",
      description: reportForm.description.trim() || null,
      severity: reportForm.severity || "medium",
      start_lat: coords[0],
      start_lng: coords[1],
      reported_by: user.id,
    };

    setReportSubmitting(true);
    setReportError(null);
    try {
      const createdResponse = await blockadeService.create(payload);
      setReportModalOpen(false);
      setReportForm({ title: "", description: "", severity: "medium" });
      const createdBlockade =
        createdResponse?.data?.data ??
        createdResponse?.data ??
        createdResponse?.blockade ??
        createdResponse;
      if (createdBlockade?.id) {
        updateBlockadeLocal?.(createdBlockade);
      }
      refetchBlockades?.();
    } catch (err) {
      setReportError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to report blockade."
      );
    } finally {
      setReportSubmitting(false);
    }
  }, [
    currentCenter,
    incidentPosition,
    refetchBlockades,
    updateBlockadeLocal,
    reportCoords,
    reportForm.description,
    reportForm.severity,
    reportForm.title,
    responderPosition,
    user?.id,
  ]);

  const handleRemoveBlockade = useCallback(
    async (blockade) => {
      const id = blockade?.raw?.id ?? blockade?.id;
      if (!id) return;
      if (!canManageBlockades) {
        alert("You do not have permission to remove blockades.");
        return;
      }

      const descriptor = blockade?.descriptor || blockade?.raw?.title;
      const confirmed = window.confirm(
        `Remove ${
          descriptor || "this blockade"
        }? This helps clear the map for other responders.`
      );
      if (!confirmed) return;

      setRemovingBlockadeId(id);
      try {
        await blockadeService.remove(id, { removed_by: user?.id });
        removeBlockadeLocal?.(id);
        refetchBlockades?.();
        setRouteAlert({
          type: "info",
          icon: "✅",
          message: "Blockade removed. Recomputing route.",
        });
      } catch (err) {
        console.error("Failed to remove blockade", err);
        alert(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to remove blockade."
        );
      } finally {
        setRemovingBlockadeId(null);
      }
    },
    [canManageBlockades, refetchBlockades, removeBlockadeLocal, user?.id]
  );

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

    // Send simulated location to server so patient Emergency Mode receives the update.
    // We do this directly rather than relying on navigator.geolocation so that
    // the broadcasting endpoint receives the same payload as real devices.
    (async () => {
      try {
        if (!incident?.id) return;

        // If we have a selected route, derive ETA and distance to include in the simulated update
        let eta_minutes = null;
        let distance_remaining_km = null;

        try {
          const selected =
            routeSelection?.selected?.original ||
            routeSelection?.selected ||
            null;
          const durationSec =
            selected?.duration ?? selected?.legs?.[0]?.duration ?? null;
          const distanceMeters =
            selected?.distance ?? selected?.legs?.[0]?.distance ?? null;
          if (durationSec) eta_minutes = Math.round(durationSec / 60);
          if (distanceMeters)
            distance_remaining_km = Number((distanceMeters / 1000).toFixed(3));
        } catch (e) {
          // ignore route parse errors
        }

        await api.post(`/incidents/${incident.id}/responder-location`, {
          latitude: lat,
          longitude: lng,
          // simulation doesn't provide heading/speed/accuracy by default
          heading: null,
          speed: null,
          accuracy: null,
          eta_minutes,
          distance_remaining_km,
        });
      } catch (err) {
        // don't block the UI on API errors; log for diagnostics
        console.warn("Simulator: failed to post simulated location", err);
      }
    })();
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

  const effectiveReportCoords = useMemo(
    () =>
      reportCoords ||
      responderPosition ||
      incidentPosition ||
      currentCenter ||
      DEFAULT_POSITION,
    [currentCenter, incidentPosition, reportCoords, responderPosition]
  );

  return (
    <section
      className={`flex h-full ${
        isFullscreen
          ? "fixed inset-0 z-[1200] rounded-none border-none bg-white"
          : "min-h-[520px] rounded-2xl border border-gray-200 bg-white"
      } flex-col overflow-hidden shadow-sm`}
    >
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

      <div className={`relative flex-1 ${isFullscreen ? "" : ""}`}>
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
          position="bottom-right"
        />
        {/* Map (normal or fullscreen) */}
        <MapContainer
          center={currentCenter}
          zoom={13}
          minZoom={5}
          maxZoom={18}
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

          {responderPosition && (
            <Marker position={responderPosition} icon={responderMarkerIcon}>
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

          {showHospitals &&
            hospitalMarkers.map(({ id, position, hospital, isSelected }) => (
              <Marker key={id} position={position} icon={hospitalIcon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  {hospital?.name || "Hospital"}
                  {isSelected ? " • Locked" : ""}
                </Tooltip>
              </Marker>
            ))}

          {normalizedBlockades.map(
            (blockade) =>
              showBlockades && (
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
                  <Popup minWidth={240} autoPan={true}>
                    <div className="space-y-2 text-sm text-slate-800">
                      <div className="font-semibold leading-tight">
                        {blockade.descriptor}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">
                        Severity: {blockade.severity}
                      </div>
                      <div className="text-xs text-slate-500">
                        Lat {blockade.lat.toFixed(5)} · Lng{" "}
                        {blockade.lng.toFixed(5)}
                      </div>
                      {canManageBlockades && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockade(blockade)}
                          disabled={
                            removingBlockadeId ===
                            (blockade.raw?.id ?? blockade.id)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                        >
                          {removingBlockadeId ===
                            (blockade.raw?.id ?? blockade.id) && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Remove blockade
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
          )}

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

        {/* Quick action floating menu (mobile-first) */}
        <div className="absolute right-4 top-6 z-[1100] flex flex-col items-end gap-3 lg:hidden">
          <div
            className={`flex flex-col items-start space-y-2 transition-all duration-300 ${
              actionsOpen
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <button
              onClick={() => {
                handleCenterOnResponder();
                setActionsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-white shadow-lg border border-gray-200 active:scale-95 transition-transform"
              title="Center on responder"
            >
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Center</span>
            </button>
            <button
              onClick={() => setShowHospitals((s) => !s)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border active:scale-95 transition-all ${
                showHospitals
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-gray-200"
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
              {showHospitals && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => setShowBlockades((s) => !s)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border active:scale-95 transition-all ${
                showBlockades
                  ? "bg-orange-50 border-orange-300"
                  : "bg-white border-gray-200"
              }`}
              title={showBlockades ? "Hide road alerts" : "Show road alerts"}
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
              {showBlockades && (
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => {
                openReportModal();
                setActionsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border bg-white border-gray-200 active:scale-95 transition-all"
              title="Report a road blockade"
            >
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Report blockade
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActionsOpen((s) => !s)}
              className={`flex items-center justify-center h-14 w-14 rounded-full shadow-xl border-2 active:scale-95 transition-all ${
                actionsOpen
                  ? "bg-blue-600 border-blue-700 rotate-45"
                  : "bg-white border-gray-200"
              }`}
              title="Quick actions"
            >
              <Settings
                className={`h-6 w-6 transition-colors ${
                  actionsOpen ? "text-white" : "text-slate-700"
                }`}
              />
            </button>
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-xl border-2 border-gray-200 active:scale-95 transition-transform"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
            >
              {isFullscreen ? (
                <Minimize className="h-6 w-6 text-slate-700" />
              ) : (
                <Maximize className="h-6 w-6 text-slate-700" />
              )}
            </button>
          </div>

          {(showHospitals || showBlockades) && (
            <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                {showHospitals && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">
                      {visibleHospitalCount}
                    </span>
                  </span>
                )}
                {showHospitals && showBlockades && (
                  <span className="text-gray-400">•</span>
                )}
                {showBlockades && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    <span className="font-semibold text-orange-700">
                      {normalizedBlockades.length}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop retractable action menu (top-right, semicircle attached to map edge) */}
        <div className="hidden lg:block absolute top-4 right-4 z-[1200]">
          <div className="relative">
            {desktopFabOpen && (
              <div className="absolute right-0 top-full z-[1210] mt-2 w-56 space-y-2 rounded-2xl bg-white p-3 text-sm font-medium text-slate-700 shadow-[0_25px_45px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
                <button
                  onClick={() => setShowHospitals((s) => !s)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50"
                  title={showHospitals ? "Hide hospitals" : "Show hospitals"}
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
                    {visibleHospitalCount}
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
                  onClick={openReportModal}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50"
                  title="Report a blockade at your current map position"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
                    🚧
                  </span>
                  Report blockade
                  <span className="ml-auto text-[11px] uppercase tracking-wide text-red-500">
                    new
                  </span>
                </button>
              </div>
            )}
            <button
              onClick={() => setDesktopFabOpen((open) => !open)}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white text-slate-700 shadow-xl transition hover:shadow-2xl ${
                desktopFabOpen
                  ? "border-blue-600 text-blue-600"
                  : "border-gray-200"
              }`}
              title="Map controls"
            >
              <Settings
                className={`h-6 w-6 transition-transform ${
                  desktopFabOpen ? "rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Fullscreen overlay: when active, expand this section to cover viewport (mobile only) */}
        {isFullscreen && (
          <div
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-[1050] bg-black/30 lg:hidden"
            aria-hidden
          />
        )}

        {routeLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Calculating optimal route…
            </div>
          </div>
        )}

        {(routeAlert || routeError) && !routeLoading && !navigationEnabled && (
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

        {reportModalOpen && (
          <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Road issue
                  </p>
                  <h3 className="text-lg font-bold text-gray-900">
                    Report a blockade
                  </h3>
                  <p className="text-sm text-gray-600">
                    Pinned to your current map position. These reports help
                    reroute other responders.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportError(null);
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                  disabled={reportSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Title
                  </label>
                  <input
                    value={reportForm.title}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Fallen tree blocking main road"
                    disabled={reportSubmitting}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Description (optional)
                  </label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Add notes like lane closures, debris, or detour tips"
                    disabled={reportSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Severity
                    </label>
                    <select
                      value={reportForm.severity}
                      onChange={(e) =>
                        setReportForm((prev) => ({
                          ...prev,
                          severity: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      disabled={reportSubmitting}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Location
                    </label>
                    <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                      <div>
                        Lat:{" "}
                        <span className="font-semibold text-gray-800">
                          {Number(effectiveReportCoords?.[0]).toFixed(5)}
                        </span>
                      </div>
                      <div>
                        Lng:{" "}
                        <span className="font-semibold text-gray-800">
                          {Number(effectiveReportCoords?.[1]).toFixed(5)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Uses your location or the current map center.
                      </p>
                    </div>
                  </div>
                </div>

                {reportError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {reportError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setReportModalOpen(false);
                      setReportError(null);
                    }}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                    disabled={reportSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitBlockade}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Submit report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Turn-by-Turn Navigation Overlay */}
        {navigationEnabled && responderPosition && (
          <TurnByTurnNavigation
            isActive={navigationEnabled}
            destination={
              mode === "hospital" ? hospitalPosition : incidentPosition
            }
            destinationName={
              mode === "hospital"
                ? selectedHospital?.name || "Hospital"
                : incident?.location || "Incident Site"
            }
            currentPosition={responderPosition}
            heading={responderHeading}
            onClose={() => setNavigationEnabled(false)}
            onRouteUpdate={(route) => {
              // Optionally update the main map's route when navigation fetches a new route
              if (route?.geometry?.coordinates) {
                const coords = route.geometry.coordinates.map(([lng, lat]) => [
                  lat,
                  lng,
                ]);
                setRoutePoints(coords);
              }
            }}
            onLocationBroadcast={(payload) => {
              // Forward navigation's location/eta/distance updates to the responder broadcast hook
              try {
                if (typeof broadcast === "function") {
                  // TurnByTurnNavigation sends { latitude, longitude, heading, eta_minutes, distance_remaining_km }
                  broadcast({
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    heading: payload.heading ?? null,
                    eta: payload.eta_minutes ?? payload.eta ?? null,
                    distance:
                      payload.distance_remaining_km ?? payload.distance ?? null,
                  });
                }
              } catch (e) {
                console.warn("Failed to forward navigation broadcast", e);
              }
            }}
            incident={incident}
          />
        )}

        {/* Navigation Toggle Button */}
        {!navigationEnabled &&
          responderPosition &&
          (mode === "hospital" ? hospitalPosition : incidentPosition) && (
            <button
              onClick={() => setNavigationEnabled(true)}
              className="absolute bottom-20 right-4 z-[1000] flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
            >
              <Navigation2 className="h-5 w-5" />
              Start Navigation
            </button>
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
