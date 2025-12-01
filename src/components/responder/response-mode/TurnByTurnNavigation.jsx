import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  ChevronRight,
  Clock,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  Disc,
  MapPin,
  Navigation,
  Navigation2,
  Phone,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { KALINGA_CONFIG } from "../../../constants/mapConfig";

// Maneuver types from OSRM
const MANEUVER_ICONS = {
  turn: {
    left: CornerDownLeft,
    right: CornerDownRight,
    "slight left": CornerUpLeft,
    "slight right": CornerUpRight,
    "sharp left": CornerDownLeft,
    "sharp right": CornerDownRight,
    uturn: RotateCcw,
  },
  "new name": Navigation2,
  depart: Navigation,
  arrive: MapPin,
  merge: ArrowUp,
  "on ramp": ArrowUp,
  "off ramp": CornerDownRight,
  fork: ChevronRight,
  "end of road": CornerDownRight,
  continue: ArrowUp,
  roundabout: Disc,
  rotary: Disc,
  "roundabout turn": Disc,
  notification: AlertTriangle,
  "exit roundabout": CornerDownRight,
  "exit rotary": CornerDownRight,
};

const getManeuverIcon = (type, modifier) => {
  if (type === "turn" && modifier) {
    return MANEUVER_ICONS.turn[modifier] || Navigation2;
  }
  return MANEUVER_ICONS[type] || Navigation2;
};

const formatDistance = (meters) => {
  if (meters < 100) {
    return `${Math.round(meters)} m`;
  }
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (seconds < 60) {
    return "< 1 min";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const formatETA = (seconds) => {
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInstructionText = (step) => {
  const { maneuver, name, ref } = step;
  const { type, modifier } = maneuver || {};
  const roadName = name || ref || "the road";

  switch (type) {
    case "depart":
      return `Head ${modifier || "straight"} on ${roadName}`;
    case "arrive":
      return modifier === "left"
        ? "You have arrived, destination on left"
        : modifier === "right"
        ? "You have arrived, destination on right"
        : "You have arrived at your destination";
    case "turn":
      return `Turn ${modifier} onto ${roadName}`;
    case "new name":
      return `Continue onto ${roadName}`;
    case "merge":
      return `Merge ${modifier || ""} onto ${roadName}`.trim();
    case "on ramp":
      return `Take the ramp onto ${roadName}`;
    case "off ramp":
      return `Take the exit onto ${roadName}`;
    case "fork":
      return `Keep ${modifier} at the fork onto ${roadName}`;
    case "end of road":
      return `Turn ${modifier} onto ${roadName}`;
    case "continue":
      return `Continue on ${roadName}`;
    case "roundabout":
    case "rotary":
      const exit = maneuver.exit || 1;
      return `Take the ${getOrdinal(exit)} exit at the roundabout`;
    case "exit roundabout":
    case "exit rotary":
      return `Exit the roundabout onto ${roadName}`;
    default:
      return `Continue on ${roadName}`;
  }
};

const getOrdinal = (n) => {
  const ordinals = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
  ];
  return ordinals[n - 1] || `${n}th`;
};

// Haversine distance in meters
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function TurnByTurnNavigation({
  isActive,
  destination,
  destinationName = "Destination",
  currentPosition,
  heading,
  onClose,
  onRouteUpdate,
  onLocationBroadcast,
  incident,
}) {
  const [routeData, setRouteData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(null);
  const [totalDistanceRemaining, setTotalDistanceRemaining] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  const lastSpokenRef = useRef(null);
  const routeGeometryRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const speechSynthRef = useRef(null);

  // Process route steps from OSRM response
  const processRouteSteps = useCallback((route) => {
    if (!route?.legs?.[0]?.steps) return [];

    return route.legs[0].steps.map((step, index) => ({
      id: index,
      instruction: getInstructionText(step),
      distance: step.distance,
      duration: step.duration,
      maneuverType: step.maneuver?.type,
      maneuverModifier: step.maneuver?.modifier,
      roadName: step.name || step.ref || "Unknown road",
      coordinates: step.maneuver?.location
        ? [step.maneuver.location[1], step.maneuver.location[0]]
        : null,
      geometry: step.geometry?.coordinates?.map((c) => [c[1], c[0]]) || [],
    }));
  }, []);

  // Fetch route from OSRM
  const fetchRoute = useCallback(async () => {
    if (!currentPosition || !destination) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        overview: "full",
        geometries: "geojson",
        steps: "true",
        annotations: "true",
      });

      const response = await fetch(
        `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${currentPosition[1]},${currentPosition[0]};${destination[1]},${destination[0]}?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch route");
      }

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      const processedSteps = processRouteSteps(route);

      setRouteData(route);
      setSteps(processedSteps);
      setTotalDistanceRemaining(route.distance);
      setTotalDuration(route.duration);
      setCurrentStepIndex(0);

      if (processedSteps.length > 0) {
        setDistanceToNextManeuver(processedSteps[0].distance);
      }

      routeGeometryRef.current = route.geometry?.coordinates?.map((c) => [
        c[1],
        c[0],
      ]);

      onRouteUpdate?.(route);
    } catch (err) {
      console.error("Route fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRerouting(false);
    }
  }, [currentPosition, destination, processRouteSteps, onRouteUpdate]);

  // Initial route fetch
  useEffect(() => {
    if (isActive && destination && currentPosition) {
      fetchRoute();
    }
  }, [isActive, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if off route and needs rerouting
  const checkOffRoute = useCallback(() => {
    if (!routeGeometryRef.current || !currentPosition || isRerouting) {
      return false;
    }

    const routeCoords = routeGeometryRef.current;
    let minDistance = Infinity;

    // Sample route points to find closest
    for (
      let i = 0;
      i < routeCoords.length;
      i += Math.max(1, Math.floor(routeCoords.length / 50))
    ) {
      const dist = haversineDistance(
        currentPosition[0],
        currentPosition[1],
        routeCoords[i][0],
        routeCoords[i][1]
      );
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    // If more than 50m off route, trigger reroute
    return minDistance > 50;
  }, [currentPosition, isRerouting]);

  // Update navigation state based on position
  useEffect(() => {
    if (!isActive || !currentPosition || steps.length === 0) return;

    // Check if off route
    if (checkOffRoute()) {
      setIsRerouting(true);
      fetchRoute();
      return;
    }

    // Find current step based on position
    let closestStepIndex = currentStepIndex;
    let minDistance = Infinity;

    for (let i = currentStepIndex; i < steps.length; i++) {
      const step = steps[i];
      if (step.coordinates) {
        const dist = haversineDistance(
          currentPosition[0],
          currentPosition[1],
          step.coordinates[0],
          step.coordinates[1]
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestStepIndex = i;
        }
      }
    }

    // Update distance to next maneuver
    if (steps[closestStepIndex]?.coordinates) {
      const distToManeuver = haversineDistance(
        currentPosition[0],
        currentPosition[1],
        steps[closestStepIndex].coordinates[0],
        steps[closestStepIndex].coordinates[1]
      );
      setDistanceToNextManeuver(distToManeuver);

      // Move to next step if very close to current maneuver
      if (distToManeuver < 30 && closestStepIndex < steps.length - 1) {
        setCurrentStepIndex(closestStepIndex + 1);
      } else if (closestStepIndex !== currentStepIndex) {
        setCurrentStepIndex(closestStepIndex);
      }
    }

    // Calculate remaining distance
    let remaining = 0;
    for (let i = closestStepIndex; i < steps.length; i++) {
      remaining += steps[i].distance;
    }
    setTotalDistanceRemaining(remaining);

    // Estimate remaining duration
    const avgSpeed = 30; // km/h average for emergency response
    const remainingDuration = (remaining / 1000 / avgSpeed) * 3600;
    setTotalDuration(remainingDuration);
  }, [
    currentPosition,
    steps,
    currentStepIndex,
    isActive,
    checkOffRoute,
    fetchRoute,
  ]);

  // Voice navigation
  useEffect(() => {
    if (!voiceEnabled || !isActive || steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    // Announce at specific distances
    const announceDistances = [500, 200, 50];
    const shouldAnnounce = announceDistances.some(
      (d) =>
        distanceToNextManeuver &&
        distanceToNextManeuver <= d &&
        distanceToNextManeuver > d - 20 &&
        lastSpokenRef.current !== `${currentStepIndex}-${d}`
    );

    if (shouldAnnounce && "speechSynthesis" in window) {
      const distanceText =
        distanceToNextManeuver < 100
          ? `In ${Math.round(distanceToNextManeuver)} meters`
          : `In ${formatDistance(distanceToNextManeuver)}`;

      const text = `${distanceText}, ${currentStep.instruction}`;

      if (speechSynthRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      lastSpokenRef.current = `${currentStepIndex}-${announceDistances.find(
        (d) => distanceToNextManeuver <= d
      )}`;
    }
  }, [distanceToNextManeuver, currentStepIndex, steps, voiceEnabled, isActive]);

  // Broadcast location to server for patient tracking
  useEffect(() => {
    if (!isActive || !currentPosition || !incident?.id) return;

    const now = Date.now();
    // Broadcast every 3 seconds
    if (now - lastBroadcastRef.current < 3000) return;

    lastBroadcastRef.current = now;

    const etaMinutes = totalDuration ? Math.round(totalDuration / 60) : null;
    const distanceKm = totalDistanceRemaining
      ? totalDistanceRemaining / 1000
      : null;

    onLocationBroadcast?.({
      latitude: currentPosition[0],
      longitude: currentPosition[1],
      heading: heading ?? null,
      eta_minutes: etaMinutes,
      distance_remaining_km: distanceKm,
    });
  }, [
    currentPosition,
    heading,
    totalDuration,
    totalDistanceRemaining,
    incident?.id,
    isActive,
    onLocationBroadcast,
  ]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  const CurrentIcon = currentStep
    ? getManeuverIcon(currentStep.maneuverType, currentStep.maneuverModifier)
    : Navigation2;

  if (!isActive) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      {/* Main Navigation Card */}
      <div className="pointer-events-auto mx-4 mb-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Header with current instruction */}
        <div
          className={`px-4 py-3 ${
            isRerouting
              ? "bg-orange-500"
              : currentStep?.maneuverType === "arrive"
              ? "bg-green-600"
              : "bg-blue-600"
          } text-white`}
        >
          {isRerouting ? (
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 animate-spin" />
              <div>
                <p className="text-lg font-bold">Rerouting...</p>
                <p className="text-sm opacity-90">Finding new route</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-3">
              <Navigation2 className="h-8 w-8 animate-pulse" />
              <div>
                <p className="text-lg font-bold">Calculating route...</p>
                <p className="text-sm opacity-90">Please wait</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <p className="text-lg font-bold">Route Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          ) : currentStep ? (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <CurrentIcon className="h-10 w-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black tracking-tight">
                  {distanceToNextManeuver !== null
                    ? formatDistance(distanceToNextManeuver)
                    : "--"}
                </p>
                <p className="text-sm font-medium opacity-95 truncate">
                  {currentStep.instruction}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Next step preview */}
        {nextStep && !isRerouting && !loading && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-gray-600">
            <span className="text-xs font-semibold uppercase tracking-wide">
              Then
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-sm truncate">{nextStep.instruction}</span>
          </div>
        )}

        {/* Footer stats */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Distance
              </p>
              <p className="text-lg font-bold text-gray-900">
                {totalDistanceRemaining !== null
                  ? formatDistance(totalDistanceRemaining)
                  : "--"}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                ETA
              </p>
              <p className="text-lg font-bold text-gray-900">
                {totalDuration !== null ? formatETA(totalDuration) : "--"}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Time
              </p>
              <p className="text-lg font-bold text-gray-900">
                {totalDuration !== null ? formatDuration(totalDuration) : "--"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              }`}
              title={voiceEnabled ? "Mute voice" : "Enable voice"}
            >
              {voiceEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAllSteps((s) => !s)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Show all steps"
            >
              <Clock className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="End navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Destination info */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate font-medium">
            {destinationName}
          </span>
        </div>
      </div>

      {/* All steps overlay */}
      {showAllSteps && (
        <div className="pointer-events-auto fixed inset-0 bg-black/50 z-[60]">
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] bg-white rounded-t-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Route Steps</h3>
              <button
                type="button"
                onClick={() => setShowAllSteps(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {steps.map((step, index) => {
                const Icon = getManeuverIcon(
                  step.maneuverType,
                  step.maneuverModifier
                );
                const isCurrent = index === currentStepIndex;
                const isPast = index < currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`px-4 py-3 border-b border-gray-100 flex items-center gap-3 ${
                      isCurrent
                        ? "bg-blue-50"
                        : isPast
                        ? "bg-gray-50 opacity-60"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isPast
                          ? "bg-gray-300 text-gray-600"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isCurrent ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {step.instruction}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistance(step.distance)} •{" "}
                        {formatDuration(step.duration)}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        NOW
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
