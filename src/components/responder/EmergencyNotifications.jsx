import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  ShieldPlus,
  Users,
} from "lucide-react";
import { fetchResponderIncidents, assignToIncident, updateIncidentStatus } from "../../services/incidents";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../context/RealtimeContext";
import { getEchoInstance } from "../../services/echo";

const STATUS_OPTIONS = [
  { value: "reported", label: "Waiting Dispatch" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "en_route", label: "En Route" },
  { value: "on_scene", label: "On Scene" },
  { value: "needs_support", label: "Needs Support" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS = {
  reported: "bg-red-100 text-red-700 border border-red-200",
  acknowledged: "bg-orange-100 text-orange-700 border border-orange-200",
  en_route: "bg-blue-100 text-blue-700 border border-blue-200",
  on_scene: "bg-purple-100 text-purple-700 border border-purple-200",
  needs_support: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};

const INCIDENT_PRIORITIES = {
  reported: 1,
  acknowledged: 2,
  en_route: 3,
  needs_support: 4,
  on_scene: 5,
  resolved: 6,
  cancelled: 7,
};

const emptyHistoryMessage = "No updates recorded yet. Log a status change so everyone stays aligned.";

export default function EmergencyNotifications() {
  const { user } = useAuth();
  const { ensureConnected } = useRealtime();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("active");
  const [notesDraft, setNotesDraft] = useState({});

  const statusLookup = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, []);

  const sortIncidents = useCallback((list) => {
    return [...list].sort((a, b) => {
      const priorityA = INCIDENT_PRIORITIES[a.status] ?? 99;
      const priorityB = INCIDENT_PRIORITIES[b.status] ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const createdA = a.reported_at ? new Date(a.reported_at).getTime() : 0;
      const createdB = b.reported_at ? new Date(b.reported_at).getTime() : 0;
      return createdB - createdA;
    });
  }, []);

  const mergeIncident = useCallback(
    (incoming) => {
      setIncidents((prev) => {
        const next = [...prev];
        const index = next.findIndex((item) => item.id === incoming.id);
        if (index >= 0) {
          next[index] = { ...next[index], ...incoming };
        } else {
          next.unshift(incoming);
        }
        return sortIncidents(next);
      });
    },
    [sortIncidents]
  );

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchResponderIncidents({ include_resolved: true });
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : response.data;
      setIncidents(sortIncidents(data ?? []));
    } catch (err) {
      console.error("Failed to load incidents", err);
      setError("Unable to load incidents right now. Please retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [sortIncidents]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const subscribe = async () => {
      try {
        const result = await ensureConnected();
        if (!result?.ok || !isMounted) return;

        const echo = getEchoInstance?.();
        if (!echo) return;

        try {
          echo.leave("incidents");
        } catch (leaveError) {
          console.warn("Unable to leave incidents channel before rejoining", leaveError);
        }

        channel = echo.join("incidents").listen(".IncidentUpdated", (payload) => {
          if (!payload?.incident || !isMounted) return;
          mergeIncident(payload.incident);
        });
      } catch (subscribeError) {
        console.error("Failed to subscribe to incident channel", subscribeError);
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        try {
          const echo = getEchoInstance?.();
          echo?.leave("incidents");
        } catch (cleanupError) {
          console.warn("Unable to cleanup incidents channel", cleanupError);
        }
      }
    };
  }, [ensureConnected, mergeIncident]);

  const handleJoinIncident = async (incidentId) => {
    if (!user) return;

    setUpdating((prev) => ({ ...prev, [incidentId]: true }));
    try {
      const response = await assignToIncident(incidentId, {
        notes: notesDraft[incidentId] || undefined,
      });
      const updatedIncident = response.data?.data ?? response.data?.incident ?? response.data;
      if (updatedIncident) {
        mergeIncident(updatedIncident);
      }
      setNotesDraft((prev) => ({ ...prev, [incidentId]: "" }));
    } catch (err) {
      console.error("Failed to join incident", err);
      if (err?.response?.status === 409) {
        window.alert(
          err.response?.data?.message ||
            "Another responder already claimed this incident."
        );
      }
    } finally {
      setUpdating((prev) => ({ ...prev, [incidentId]: false }));
    }
  };

  const handleStatusChange = async (incidentId) => {
    const status = selectedStatus[incidentId];
    if (!status) return;

    setUpdating((prev) => ({ ...prev, [incidentId]: true }));
    try {
      const response = await updateIncidentStatus(incidentId, {
        status,
        notes: notesDraft[incidentId] || undefined,
      });
      const updatedIncident = response.data?.data ?? response.data;
      if (updatedIncident) {
        mergeIncident(updatedIncident);
      }
      setNotesDraft((prev) => ({ ...prev, [incidentId]: "" }));
      setSelectedStatus((prev) => ({ ...prev, [incidentId]: "" }));
    } catch (err) {
      console.error("Failed to update incident status", err);
    } finally {
      setUpdating((prev) => ({ ...prev, [incidentId]: false }));
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (filter === "active") {
        return !["resolved", "cancelled"].includes(incident.status);
      }
      if (filter === "resolved") {
        return incident.status === "resolved";
      }
      return true;
    });
  }, [filter, incidents]);

  const responderNameList = (incident) => {
    if (!Array.isArray(incident.assignments) || incident.assignments.length === 0) {
      return "Unassigned";
    }

    return incident.assignments
      .map((assignment) => assignment?.responder?.name)
      .filter(Boolean)
      .join(", ");
  };

  const isUserAssigned = (incident) => {
    if (!user) return false;
    return incident.assignments?.some((assignment) => assignment?.responder?.id === user.id);
  };

  const renderHistory = (incident) => {
    if (!Array.isArray(incident.history) || incident.history.length === 0) {
      return <p className="text-sm text-gray-500">{emptyHistoryMessage}</p>;
    }

    return (
      <ul className="space-y-3">
        {incident.history.map((item) => (
          <li key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <History className="h-4 w-4 text-gray-500" />
                <span>{statusLookup[item.status] ?? item.status}</span>
              </div>
              <span className="text-xs text-gray-500">{item.created_at_human}</span>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              <span className="font-medium">{item.user?.name ?? "System"}</span>
              {item.notes ? <span className="text-gray-500"> — {item.notes}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
        <div className="flex gap-3 items-center">
          <AlertTriangle className="h-5 w-5 text-primary animate-pulse" />
          <p className="text-sm text-gray-600">Loading emergency notifications…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white shadow-sm rounded-2xl border border-red-100 p-6">
        <div className="flex gap-3 items-start text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={loadIncidents}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
              type="button"
            >
              Retry now
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white shadow-sm rounded-2xl border border-gray-100">
      <header className="border-b border-gray-100 px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold">Live incidents</p>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldPlus className="h-6 w-6 text-primary" /> Emergency Notifications
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Track every emergency in real time. Assign responders, log status updates, and review history so no incident loses visibility.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              filter === "active"
                ? "border-primary text-primary bg-primary/10"
                : "border-gray-200 text-gray-600 hover:border-primary/40"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setFilter("resolved")}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              filter === "resolved"
                ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                : "border-gray-200 text-gray-600 hover:border-emerald-300"
            }`}
          >
            Resolved
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              filter === "all"
                ? "border-gray-700 text-gray-800 bg-gray-100"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            All
          </button>
        </div>
      </header>

      <div className="divide-y divide-gray-100">
        {filteredIncidents.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
            <p className="font-medium">No incidents in this view.</p>
            <p className="text-sm">Switch filters to review past responses.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const joining = updating[incident.id];
            const statusClass = STATUS_COLORS[incident.status] ?? "bg-gray-100 text-gray-600 border border-gray-200";
            const assignedLabel = responderNameList(incident);
            const responderCountLabel = `${incident.responders_assigned ?? 0} / ${incident.responders_required ?? 1}`;

            return (
              <article key={incident.id} className="px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        <Activity className="h-3 w-3" />
                        {statusLookup[incident.status] ?? incident.status}
                      </span>
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {incident.reported_at_human || "Just now"}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      {incident.type}
                    </h3>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" /> {incident.location}
                    </p>
                    {incident.description ? (
                      <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {incident.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1">
                          <Users className="h-4 w-4 text-primary" /> Responders
                        </span>
                        <span className="font-semibold text-gray-900">{responderCountLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{assignedLabel}</p>
                    </div>

                    <textarea
                      value={notesDraft[incident.id] ?? ""}
                      onChange={(event) =>
                        setNotesDraft((prev) => ({ ...prev, [incident.id]: event.target.value }))
                      }
                      placeholder="Add a note for the team (optional)"
                      className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-y min-h-[60px]"
                    />

                    <div className="flex gap-2">
                      <select
                        value={selectedStatus[incident.id] ?? ""}
                        onChange={(event) =>
                          setSelectedStatus((prev) => ({ ...prev, [incident.id]: event.target.value }))
                        }
                        className="flex-1 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                      >
                        <option value="">Update status…</option>
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(incident.id)}
                        disabled={!selectedStatus[incident.id] || joining}
                        className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Update
                      </button>
                    </div>

                    {!isUserAssigned(incident) ? (
                      <button
                        type="button"
                        onClick={() => handleJoinIncident(incident.id)}
                        disabled={joining}
                        className="px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Join incident
                      </button>
                    ) : null}
                  </div>
                </div>

                <details className="mt-5 group">
                  <summary className="cursor-pointer text-sm text-gray-600 flex items-center gap-2 select-none">
                    <History className="h-4 w-4 text-gray-400" />
                    View status history
                  </summary>
                  <div className="mt-3 text-sm text-gray-700">
                    {renderHistory(incident)}
                  </div>
                </details>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
