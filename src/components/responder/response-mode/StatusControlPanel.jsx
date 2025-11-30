import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Route,
  ShieldCheck,
} from "lucide-react";

const STATUS_FLOW = [
  {
    value: "reported",
    label: "Reported",
    description: "Incident created by caller",
    actionable: false,
  },
  {
    value: "acknowledged",
    label: "Acknowledged",
    description: "Responder accepted the incident",
  },
  {
    value: "en_route",
    label: "En Route",
    description: "Heading to the scene",
  },
  {
    value: "on_scene",
    label: "On Scene",
    description: "Arrival confirmed, begin triage",
  },
  {
    value: "needs_support",
    label: "Needs Support",
    description: "Request additional responders or supplies",
  },
  {
    value: "resolved",
    label: "Resolved",
    description: "Turned over or incident closed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Call cancelled or false alarm",
    tone: "warning",
  },
];

const statusOrder = STATUS_FLOW.reduce((acc, item, index) => {
  acc[item.value] = index;
  return acc;
}, {});

const formatStatusText = (status) =>
  status ? status.replace(/_/g, " ") : "unknown";

const formatDistance = (value) =>
  typeof value === "number" ? `${value.toFixed(2)} km` : "—";

const formatScore = (value, digits = 2) =>
  typeof value === "number" ? value.toFixed(digits) : "—";

const formatQuantity = (value) =>
  typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : "—";

export default function StatusControlPanel({
  incident,
  hospitals = [],
  nearestHospital = null,
  selectedHospitalId = null,
  selectedHospital = null,
  onHospitalChange,
  onStatusChange,
  statusUpdating = false,
  statusError = null,
}) {
  const [noteDraft, setNoteDraft] = useState("");

  const currentStatus = incident?.status ?? "reported";
  const currentIndex = statusOrder[currentStatus] ?? -1;

  const hospitalOptions = useMemo(() => {
    return hospitals.map((hospital) => ({
      id: hospital.id,
      label: hospital.name,
      distance: hospital.distance_km,
      priority: hospital.priority_score,
    }));
  }, [hospitals]);

  const handleStatusClick = async (value) => {
    if (!onStatusChange || value === currentStatus || statusUpdating) {
      return;
    }

    if (value === "cancelled") {
      const confirmed = window.confirm(
        "Mark incident as cancelled? This action notifies dispatch."
      );
      if (!confirmed) {
        return;
      }
    }

    const trimmedNote = noteDraft.trim();
    await Promise.resolve(
      onStatusChange(value, trimmedNote.length ? trimmedNote : undefined)
    );

    if (trimmedNote.length) {
      setNoteDraft("");
    }
  };

  const handleHospitalSelect = (event) => {
    const value = event.target.value;
    if (!onHospitalChange) return;
    if (!value) {
      onHospitalChange(null);
      return;
    }
    const numeric = Number(value);
    onHospitalChange(Number.isFinite(numeric) ? numeric : null);
  };

  const handleAssignNearest = () => {
    if (!nearestHospital || !onHospitalChange) return;
    onHospitalChange(nearestHospital.id);
  };

  const resourceProfile = selectedHospital?.resource_profile;
  const topResources = Array.isArray(resourceProfile?.top_resources)
    ? resourceProfile.top_resources
    : [];

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Operational controls
        </p>
        <div className="mt-1 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black text-gray-900">
            Manage incident workflow
          </h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Update responder status and lock the receiving facility once on scene.
        </p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status timeline
          </p>
          <div className="space-y-2">
            {STATUS_FLOW.map((option) => {
              const optionIndex = statusOrder[option.value] ?? 0;
              const isCurrent = option.value === currentStatus;
              const isCompleted = optionIndex < currentIndex;
              const disabled =
                statusUpdating || option.actionable === false || isCurrent;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusClick(option.value)}
                  disabled={disabled}
                  className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isCurrent
                      ? "border-primary/60 bg-primary/5 text-primary"
                      : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/5"
                  } ${
                    option.tone === "warning" && !isCurrent
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : ""
                  } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-current"></span>
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm font-semibold capitalize">
                        <span>{option.label}</span>
                        {isCurrent && !statusUpdating && (
                          <span className="text-xs uppercase tracking-wide text-primary">
                            Active
                          </span>
                        )}
                        {statusUpdating && isCurrent && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            Current status: <strong>{formatStatusText(currentStatus)}</strong>
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Destination hospital
            </p>
            {nearestHospital &&
              (selectedHospitalId === null ||
                String(selectedHospitalId) !== String(nearestHospital.id)) && (
                <button
                  type="button"
                  onClick={handleAssignNearest}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Auto-select nearest
                </button>
              )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            {selectedHospital ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedHospital.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedHospital.address || "No address provided"}
                    </p>
                  </div>
                  {selectedHospital.distance_km !== undefined && (
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-500">
                      {formatDistance(selectedHospital.distance_km)}
                    </span>
                  )}
                </div>
                {Array.isArray(selectedHospital.capabilities) &&
                  selectedHospital.capabilities.length > 0 && (
                    <p className="text-[11px] text-gray-500">
                      Capabilities: {selectedHospital.capabilities.join(", ")}
                    </p>
                  )}
                {selectedHospital.contact_number && (
                  <p className="text-[11px] text-gray-500">
                    Contact: {selectedHospital.contact_number}
                  </p>
                )}
                {(selectedHospital.priority_score !== undefined ||
                  resourceProfile) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-gray-500">
                    <div className="rounded-lg bg-white/70 p-2 text-center">
                      <p className="font-semibold text-gray-900">
                        {formatScore(selectedHospital.priority_score ?? null)}
                      </p>
                      <p className="uppercase tracking-wide">Priority</p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-2 text-center">
                      <p className="font-semibold text-gray-900">
                        {formatScore(selectedHospital.capability_score ?? null)}
                      </p>
                      <p className="uppercase tracking-wide">Capability</p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-2 text-center">
                      <p className="font-semibold text-gray-900">
                        {formatScore(selectedHospital.distance_score ?? null)}
                      </p>
                      <p className="uppercase tracking-wide">Distance</p>
                    </div>
                  </div>
                )}
                {topResources.length > 0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white/80 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Key resources on-hand
                    </p>
                    <ul className="mt-1 space-y-1 text-[11px]">
                      {topResources.map((resource) => (
                        <li
                          key={
                            resource.id ??
                            `${resource.name}-${resource.category}`
                          }
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-gray-600">
                            {resource.name}
                            {resource.category ? ` · ${resource.category}` : ""}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              resource.is_critical
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {formatQuantity(resource.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : nearestHospital ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Route className="h-4 w-4 flex-shrink-0" />
                <span>
                  No hospital locked. Nearest suggestion is{" "}
                  <strong className="text-gray-700">
                    {nearestHospital.name}
                  </strong>
                  .
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>No hospitals available near this incident.</span>
              </div>
            )}
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Choose facility
            <select
              value={selectedHospitalId ?? ""}
              onChange={handleHospitalSelect}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">-- No hospital selected --</option>
              {hospitalOptions.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.label}
                  {typeof hospital.priority === "number"
                    ? ` · score ${hospital.priority.toFixed(2)}`
                    : ""}
                  {hospital.distance !== undefined
                    ? ` (${hospital.distance.toFixed(2)} km)`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Optional note
          </p>
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Include quick context for the timeline (e.g., scene details, blockers)."
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Notes are attached to the next status update and shared with
            dispatch.
          </p>
        </div>

        {statusError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle className="h-4 w-4" />
            {statusError}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>
            Current: <strong>{formatStatusText(currentStatus)}</strong>
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          Updates post to the incident timeline in real time.
        </span>
      </footer>
    </section>
  );
}
