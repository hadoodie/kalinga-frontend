import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Clock,
  History,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
} from "../../constants/incidentStatus";
import { updateIncidentStatus } from "../../services/incidents";

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

const IncidentCard = ({
  incident,
  assignment,
  statusValue,
  onStatusChange,
  noteValue,
  onNoteChange,
  respondersRequired,
  onRespondersChange,
  onUpdate,
  updating,
}) => {
  const statusBadge =
    INCIDENT_STATUS_COLORS[incident.status] ||
    "bg-gray-100 text-gray-600 border border-gray-200";

  const historyEntries = Array.isArray(incident.history)
    ? incident.history.slice(0, 4)
    : [];

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="border-b border-gray-100 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-gray-900">{incident.type}</h3>
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            Assigned {formatDateTime(assignment?.assigned_at)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full ${statusBadge}`}
        >
          {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Users className="h-5 w-5 text-primary" /> Responders
            </div>
            <p className="mt-2 text-base font-semibold text-gray-900">
              {incident.responders_assigned ?? 0} of{" "}
              {incident.responders_required ?? 1} assigned
            </p>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Required count
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={respondersRequired ?? ""}
              onChange={(event) => onRespondersChange(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="font-semibold text-gray-600">Location</dt>
                <dd className="text-right text-gray-900 font-medium">
                  {incident.location || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="font-semibold text-gray-600">Reported</dt>
                <dd className="text-right text-gray-900 font-medium">
                  {incident.reported_at_human || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="font-semibold text-gray-600">Last updated</dt>
                <dd className="text-right text-gray-900 font-medium">
                  {incident.latest_update?.created_at_human || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            Update status
          </label>
          <select
            value={statusValue ?? ""}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {INCIDENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <textarea
            value={noteValue ?? ""}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Add notes about this status update (optional)"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            rows={3}
          />

          <button
            type="button"
            onClick={onUpdate}
            disabled={updating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Save Update"
            )}
          </button>
        </div>

        {historyEntries.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700 flex items-center gap-2 hover:text-primary">
              <History className="h-4 w-4" />
              Status history ({historyEntries.length})
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border-l-2 border-primary/30 pl-3 text-xs text-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {INCIDENT_STATUS_LABELS[entry.status] ?? entry.status}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{entry.created_at_human}</span>
                  </div>
                  <p className="mt-0.5">
                    {entry.user?.name ?? "System"}
                    {entry.notes ? ` — ${entry.notes}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
};

const AssignedIncidentStatusPanel = ({
  incidents = [],
  loading = false,
  error = null,
  onRefresh,
  onIncidentUpdated,
  currentUserId,
}) => {
  const [selectedStatus, setSelectedStatus] = useState({});
  const [notesDraft, setNotesDraft] = useState({});
  const [respondersDraft, setRespondersDraft] = useState({});
  const [updating, setUpdating] = useState({});

  const assignedIncidents = useMemo(() => {
    if (!currentUserId) return [];
    return incidents.filter((incident) =>
      Array.isArray(incident.assignments)
        ? incident.assignments.some(
            (assignment) => assignment?.responder?.id === currentUserId
          )
        : false
    );
  }, [incidents, currentUserId]);

  useEffect(() => {
    setSelectedStatus((prev) => {
      const next = { ...prev };
      assignedIncidents.forEach((incident) => {
        next[incident.id] = prev[incident.id] ?? incident.status;
      });
      return next;
    });

    setRespondersDraft((prev) => {
      const next = { ...prev };
      assignedIncidents.forEach((incident) => {
        next[incident.id] =
          prev[incident.id] ?? incident.responders_required ?? 1;
      });
      return next;
    });
  }, [assignedIncidents]);

  const handleStatusUpdate = useCallback(
    async (incident) => {
      const status = selectedStatus[incident.id];
      if (!status) {
        window.alert("Please select a status to continue.");
        return;
      }

      const rawValue = respondersDraft[incident.id];
      const respondersRequiredValue =
        rawValue === undefined || rawValue === null || rawValue === ""
          ? incident.responders_required ?? 1
          : Number(rawValue);

      if (
        !Number.isFinite(respondersRequiredValue) ||
        respondersRequiredValue < 1
      ) {
        window.alert("Responders required must be at least 1.");
        return;
      }

      setUpdating((prev) => ({ ...prev, [incident.id]: true }));
      try {
        const payload = {
          status,
          notes: notesDraft[incident.id] || undefined,
          responders_required: Math.max(1, Math.round(respondersRequiredValue)),
        };

        const response = await updateIncidentStatus(incident.id, payload);
        const updatedIncident = response.data?.data ?? response.data;
        if (updatedIncident) {
          onIncidentUpdated?.(updatedIncident);
          setSelectedStatus((prev) => ({
            ...prev,
            [incident.id]: updatedIncident.status,
          }));
          setRespondersDraft((prev) => ({
            ...prev,
            [incident.id]:
              updatedIncident.responders_required ??
              Math.max(1, Math.round(respondersRequiredValue)),
          }));
          setNotesDraft((prev) => ({ ...prev, [incident.id]: "" }));
        }
      } catch (error) {
        console.error("Failed to update incident status", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to update status right now.";
        window.alert(message);
      } finally {
        setUpdating((prev) => ({ ...prev, [incident.id]: false }));
      }
    },
    [notesDraft, onIncidentUpdated, respondersDraft, selectedStatus]
  );

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Your assignments
          </p>
          <h2 className="text-xl font-bold text-gray-900">
            Incident Status Management
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading incidents…
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
          </div>
        ) : assignedIncidents.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-gray-500">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="text-base font-medium">No active assignments</p>
            <p className="text-sm text-gray-400">
              You are not currently assigned to any incidents.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {assignedIncidents.map((incident) => {
              const assignment = incident.assignments?.find(
                (record) => record?.responder?.id === currentUserId
              );

              return (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  assignment={assignment}
                  statusValue={selectedStatus[incident.id]}
                  onStatusChange={(value) =>
                    setSelectedStatus((prev) => ({
                      ...prev,
                      [incident.id]: value,
                    }))
                  }
                  noteValue={notesDraft[incident.id]}
                  onNoteChange={(value) =>
                    setNotesDraft((prev) => ({ ...prev, [incident.id]: value }))
                  }
                  respondersRequired={respondersDraft[incident.id]}
                  onRespondersChange={(value) =>
                    setRespondersDraft((prev) => ({
                      ...prev,
                      [incident.id]: value,
                    }))
                  }
                  onUpdate={() => handleStatusUpdate(incident)}
                  updating={!!updating[incident.id]}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssignedIncidentStatusPanel;
