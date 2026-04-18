/**
 * RescueDetailPanel — Responsive rescue details container.
 *
 * • Mobile  (< 768 px) → collapsible bottom sheet (minimised = ETA + status bar)
 * • Desktop (≥ 768 px) → collapsible left sidebar with chevron toggle
 *
 * Both views share the same underlying state passed via props.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Hospital,
  Truck,
} from "lucide-react";

// ── Status maps ──────────────────────────────────────────────────────────────

export const STATUS_LABELS = {
  acknowledged: "Dispatch Confirmed",
  en_route: "Responder En Route",
  transporting: "En Route to Hospital",
  hospital_transfer: "Transferring to Hospital",
  on_scene: "Responder Arrived",
  needs_support: "Additional Support",
  resolved: "Rescue Complete",
  cancelled: "Cancelled",
};

export const STATUS_COLORS = {
  acknowledged: "bg-yellow-500",
  en_route: "bg-blue-500",
  transporting: "bg-cyan-500",
  hospital_transfer: "bg-cyan-500",
  on_scene: "bg-green-500",
  needs_support: "bg-orange-500",
  resolved: "bg-gray-500",
  cancelled: "bg-gray-400",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export const formatETA = (minutes) => {
  if (!minutes || minutes <= 0) return "Calculating...";
  if (minutes < 1) return "Arriving now";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export const formatDistance = (km) => {
  if (!km || km <= 0) return "--";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export const formatRelativeUpdate = (lastUpdatedAt, nowMs = Date.now()) => {
  if (!lastUpdatedAt) return "Updated just now";

  const updatedMs = new Date(lastUpdatedAt).getTime();
  if (Number.isNaN(updatedMs)) return "Updated just now";

  const seconds = Math.max(0, Math.floor((nowMs - updatedMs) / 1000));

  if (seconds <= 1) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "Updated 1 minute ago";
  if (minutes < 60) return `Updated ${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Updated 1 hour ago";
  return `Updated ${hours} hours ago`;
};

// ── Progress Tracker ─────────────────────────────────────────────────────────

const STATUS_STEPS = [
  {
    id: 1,
    label: "En Route",
    matchStatuses: ["acknowledged", "en_route"],
    completedAfter: [
      "on_scene",
      "transporting",
      "hospital_transfer",
      "resolved",
    ],
  },
  {
    id: 2,
    label: "At Location",
    matchStatuses: ["on_scene"],
    completedAfter: ["transporting", "hospital_transfer", "resolved"],
  },
  {
    id: 3,
    label: "To Hospital",
    matchStatuses: ["transporting", "hospital_transfer", "resolved"],
    completedAfter: ["resolved"],
  },
];

function ProgressTracker({ status, hospitalName }) {
  const steps = STATUS_STEPS.map((step) => ({
    ...step,
    active: step.matchStatuses.includes(status),
    completed: step.completedAfter.includes(status),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / (steps.length - 1)) * 100;

  return (
    <div className="w-full px-2">
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 top-4 w-full h-1 bg-gray-200 -z-10 rounded-full" />
        {/* Active line */}
        <div
          className="absolute left-0 top-4 h-1 bg-green-500 -z-10 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
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
            <div className="mt-2 text-center absolute top-8 left-1/2 -translate-x-1/2 w-28">
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
                <p className="text-[10px] font-bold text-gray-900 mt-0.5 leading-tight">
                  {hospitalName}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared detail content (used in both mobile & desktop) ────────────────────

function DetailContent({
  eta,
  distance,
  responder,
  vehicle,
  status,
  hospitalName,
  lastUpdatedAt,
}) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isToHospital = [
    "transporting",
    "hospital_transfer",
    "resolved",
  ].includes(status);

  const updatedLabel = useMemo(
    () => formatRelativeUpdate(lastUpdatedAt, nowMs),
    [lastUpdatedAt, nowMs],
  );

  const isSignalDelayed = useMemo(() => {
    if (!lastUpdatedAt) return false;
    const updatedMs = new Date(lastUpdatedAt).getTime();
    if (Number.isNaN(updatedMs)) return false;
    return nowMs - updatedMs > 20000;
  }, [lastUpdatedAt, nowMs]);

  return (
    <div className="space-y-4">
      {/* Progress Tracker */}
      <div className="mb-8">
        <ProgressTracker status={status} hospitalName={hospitalName} />
      </div>

      {/* ETA / Distance */}
      <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between border border-gray-200">
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
            DISTANCE
          </p>
          <p className="text-3xl font-black text-gray-900 leading-none">
            {distance}
          </p>
        </div>
      </div>

      {/* Responder */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-2 border-blue-200 flex-shrink-0">
          <Truck size={24} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
            Responding Team
          </p>
          <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">
            {responder?.name || "Ambulance Team"}
          </h3>
          <p className="text-sm font-medium text-gray-600">
            {vehicle?.plate_number || "Plate No: ---"}
          </p>
        </div>
      </div>

      {/* Hospital destination (visible during transport) */}
      {isToHospital && hospitalName && (
        <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <Hospital size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
              Destination Hospital
            </p>
            <p className="text-sm font-bold text-emerald-900">{hospitalName}</p>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            STATUS_COLORS[status] || "bg-gray-400"
          } animate-pulse`}
        />
        <span className="text-sm font-semibold text-gray-700">
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Realtime indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 pt-1">
        <Clock size={14} />
        <span>{updatedLabel}</span>
        {isSignalDelayed && (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Signal delayed
          </span>
        )}
      </div>
    </div>
  );
}

// ── Mobile Bottom Sheet ──────────────────────────────────────────────────────

function MobileBottomSheet(props) {
  const { eta, distance, status } = props;
  const [expanded, setExpanded] = useState(false);

  const isToHospital = [
    "transporting",
    "hospital_transfer",
    "resolved",
  ].includes(status);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ease-in-out md:hidden ${
        expanded
          ? "max-h-[85vh] overflow-y-auto"
          : "max-h-[140px] overflow-hidden"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex flex-col items-center pt-3 pb-1 cursor-pointer active:bg-gray-50 transition-colors"
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-1.5" />
        <div className="flex items-center gap-1 text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {expanded ? "Collapse" : "Details"}
          </span>
        </div>
      </button>

      {/* Collapsed mini-summary */}
      {!expanded && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  STATUS_COLORS[status] || "bg-gray-400"
                } animate-pulse`}
              />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {isToHospital ? "TO HOSPITAL" : "ETA"}
                </p>
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {eta}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                DISTANCE
              </p>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {distance}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded full details */}
      {expanded && (
        <div className="px-5 pb-6">
          <DetailContent {...props} />
        </div>
      )}
    </div>
  );
}

// ── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar(props) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Sidebar panel */}
      <div
        className={`hidden md:flex flex-col h-full bg-white shadow-xl z-[1000] transition-all duration-300 ease-in-out relative ${
          open ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Rescue Details
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          <DetailContent {...props} />
        </div>
      </div>

      {/* Collapsed toggle tab (visible only when sidebar is closed) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[1001] bg-white shadow-lg rounded-r-xl px-1.5 py-6 items-center justify-center hover:bg-gray-50 transition-colors border border-l-0 border-gray-200"
          aria-label="Expand rescue details"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      )}
    </>
  );
}

// ── Public wrapper ───────────────────────────────────────────────────────────

export default function RescueDetailPanel({
  eta,
  distance,
  responder,
  vehicle,
  status,
  hospitalName,
  lastUpdatedAt,
}) {
  const sharedProps = {
    eta,
    distance,
    responder,
    vehicle,
    status,
    hospitalName,
    lastUpdatedAt,
  };

  return (
    <>
      <MobileBottomSheet {...sharedProps} />
      <DesktopSidebar {...sharedProps} />
    </>
  );
}
