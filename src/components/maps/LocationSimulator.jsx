import { useEffect, useMemo, useRef, useState } from "react";

const metersToLatDelta = (meters) => meters / 111320;
const metersToLngDelta = (meters, latitude) => {
  const denominator = 111320 * Math.cos((latitude * Math.PI) / 180);
  if (!Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return meters / denominator;
};

export default function LocationSimulator({
  onLocationChange,
  onStopSimulation,
  currentLocation,
  isActive = false,
  buttonLabel = "Simulate Location",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lat, setLat] = useState(currentLocation?.lat ?? 14.6);
  const [lng, setLng] = useState(currentLocation?.lng ?? 121.0);
  const [stepMeters, setStepMeters] = useState(100);
  const [direction, setDirection] = useState("north");
  const [autoMove, setAutoMove] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1500);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (typeof currentLocation?.lat === "number") {
      setLat(currentLocation.lat);
    }
    if (typeof currentLocation?.lng === "number") {
      setLng(currentLocation.lng);
    }
  }, [currentLocation?.lat, currentLocation?.lng]);

  const emitLocation = (coords, options = {}) => {
    if (!coords || !onLocationChange) return;
    onLocationChange(coords, options);
  };

  const applyLocation = (options = {}) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return;
    }
    emitLocation(
      { lat: parsedLat, lng: parsedLng },
      { centerMap: options.centerMap ?? false, reason: "manual" }
    );
  };

  const nudge = (dir) => {
    const latDelta = metersToLatDelta(stepMeters);
    const lngDelta = metersToLngDelta(stepMeters, lat);

    const updates = {
      north: { lat: lat + latDelta, lng },
      south: { lat: lat - latDelta, lng },
      east: { lat, lng: lng + lngDelta },
      west: { lat, lng: lng - lngDelta },
    };

    const next = updates[dir];
    if (!next) return;

    setLat(next.lat);
    setLng(next.lng);
    emitLocation(next, { reason: "nudge" });
  };

  useEffect(() => {
    if (!autoMove) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return () => {};
    }

    intervalRef.current = setInterval(() => {
      nudge(direction);
    }, Math.max(intervalMs, 400));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoMove, direction, intervalMs, stepMeters, lat]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const directionButtons = useMemo(
    () => [
      { label: "↑", value: "north" },
      { label: "→", value: "east" },
      { label: "↓", value: "south" },
      { label: "←", value: "west" },
    ],
    []
  );

  return (
    <div
      className={`pointer-events-auto fixed z-[9999] flex flex-col items-end gap-2 ${className}`}
      style={{ top: "1rem", right: "1rem" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`rounded-full px-4 py-2 text-sm font-medium shadow-lg transition focus:outline-none focus:ring ${
          isActive
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-white text-gray-800 hover:bg-gray-100"
        }`}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="w-80 rounded-xl bg-white p-4 text-sm shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Location Simulator</p>
              <p className="text-xs text-gray-500">
                {isActive ? "Simulation active" : "Live GPS"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-gray-500">
              Latitude
              <input
                type="number"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Longitude
              <input
                type="number"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
            <label className="font-medium">
              Step (meters)
              <input
                type="number"
                min={5}
                step={5}
                value={stepMeters}
                onChange={(e) =>
                  setStepMeters(Math.max(5, Number(e.target.value)))
                }
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="font-medium">
              Auto interval (ms)
              <input
                type="number"
                min={300}
                step={100}
                value={intervalMs}
                onChange={(e) =>
                  setIntervalMs(Math.max(300, Number(e.target.value)))
                }
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
            Direction
            <div className="flex gap-1">
              {directionButtons.map((btn) => (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => setDirection(btn.value)}
                  className={`h-8 w-8 rounded border text-base ${
                    direction === btn.value
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => nudge(direction)}
              className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-center text-white hover:bg-amber-700"
            >
              Move {direction}
            </button>
            <button
              type="button"
              onClick={() => nudge(direction === "north" ? "south" : direction)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center hover:bg-gray-50"
            >
              Quick nudge
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 font-medium text-gray-500">
              <input
                type="checkbox"
                checked={autoMove}
                onChange={(e) => setAutoMove(e.target.checked)}
              />
              Auto-move loop
            </label>
            {autoMove && (
              <span className="text-amber-600">Simulating drift…</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => applyLocation({ centerMap: true })}
              className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
            >
              Apply & center map
            </button>
            <button
              type="button"
              onClick={() => applyLocation({ centerMap: false })}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              Apply without centering
            </button>
            {onStopSimulation && (
              <button
                type="button"
                onClick={onStopSimulation}
                className="rounded-lg border border-amber-200 px-3 py-2 text-amber-700 hover:bg-amber-50"
              >
                Return to live GPS
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
