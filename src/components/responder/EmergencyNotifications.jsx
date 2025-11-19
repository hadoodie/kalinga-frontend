import { useMemo, useState } from "react";
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
import {
  assignToIncident,
  updateIncidentStatus,
} from "../../services/incidents";
import { useAuth } from "../../context/AuthContext";
import { useIncidents } from "../../context/IncidentContext";
import {
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
} from "../../constants/incidentStatus";

const emptyHistoryMessage =
  "No updates recorded yet. Log a status change so everyone stays aligned.";

export default function EmergencyNotifications() {
  const { user } = useAuth();
  const { incidents, loading, refreshing, error, refresh, mergeIncident } =
    useIncidents();
  const [selectedStatus, setSelectedStatus] = useState({});
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("active");
  const [notesDraft, setNotesDraft] = useState({});

  const statusLookup = INCIDENT_STATUS_LABELS;

  const handleJoinIncident = async (incidentId) => {
    if (!user) return;

    setUpdating((prev) => ({ ...prev, [incidentId]: true }));
    try {
      const response = await assignToIncident(incidentId, {
        notes: notesDraft[incidentId] || undefined,
      });
      const updatedIncident =
        response.data?.data ?? response.data?.incident ?? response.data;
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
    if (
      !Array.isArray(incident.assignments) ||
      incident.assignments.length === 0
    ) {
      return "Unassigned";
    }

    return incident.assignments
      .map((assignment) => assignment?.responder?.name)
      .filter(Boolean)
      .join(", ");
  };

  const isUserAssigned = (incident) => {
    if (!user) return false;
    return incident.assignments?.some(
      (assignment) => assignment?.responder?.id === user.id
    );
  };

  const renderHistory = (incident) => {
    if (!Array.isArray(incident.history) || incident.history.length === 0) {
      return <p className="text-sm text-gray-500">{emptyHistoryMessage}</p>;
    }

    return (
      <ul className="space-y-3">
        {incident.history.map((item) => (
          <li
            key={item.id}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <History className="h-4 w-4 text-gray-500" />
                <span>{statusLookup[item.status] ?? item.status}</span>
              </div>
              <span className="text-xs text-gray-500">
                {item.created_at_human}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              <span className="font-medium">{item.user?.name ?? "System"}</span>
              {item.notes ? (
                <span className="text-gray-500"> — {item.notes}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    if (incidents.length > 0) {
      return null;
    }
    return (
      <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
        <div className="flex gap-3 items-center">
          <AlertTriangle className="h-5 w-5 text-primary animate-pulse" />
          <p className="text-sm text-gray-600">
            Loading emergency notifications…
          </p>
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
              onClick={() => refresh()}
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
    <section className="bg-white shadow-sm rounded-xl border border-gray-200">
      <header className="border-b border-gray-100 px-6 py-5 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary font-bold">
            Live incidents
          </p>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mt-1">
            <ShieldPlus className="h-5 w-5 text-primary" /> Emergency
            Notifications
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mt-1.5">
            Monitor active emergencies in real-time and coordinate response
            efforts
          </p>
        </div>
        <div className="flex gap-2">
          {refreshing ? (
            <p className="text-xs text-gray-500 hidden sm:block">
              Syncing latest updates…
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === "active"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === "resolved"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Resolved
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === "all"
                ? "bg-gray-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
        </div>
      </header>

      <div className="divide-y divide-gray-100">
        {filteredIncidents.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
            <p className="text-base font-semibold">No incidents in this view</p>
            <p className="text-sm text-gray-400 mt-1">
              Switch filters to review past responses
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const joining = updating[incident.id];
            const statusClass =
              INCIDENT_STATUS_COLORS[incident.status] ??
              "bg-gray-100 text-gray-600 border border-gray-200";
            const assignedLabel = responderNameList(incident);
            const responderCountLabel = `${
              incident.responders_assigned ?? 0
            } / ${incident.responders_required ?? 1}`;

            return (
              <article
                key={incident.id}
                className="px-6 py-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusClass}`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        {statusLookup[incident.status] ?? incident.status}
                      </span>
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {incident.reported_at_human || "Just now"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      {incident.type}
                    </h3>
                    <p className="text-gray-700 text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />{" "}
                      {incident.location}
                    </p>
                    {incident.description ? (
                      <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {incident.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 lg:min-w-[280px]">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" /> Team Status
                        </span>
                        <span className="font-bold text-gray-900">
                          {responderCountLabel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{assignedLabel}</p>
                    </div>

                    <textarea
                      value={notesDraft[incident.id] ?? ""}
                      onChange={(event) =>
                        setNotesDraft((prev) => ({
                          ...prev,
                          [incident.id]: event.target.value,
                        }))
                      }
                      placeholder="Add coordination notes (optional)"
                      className="border border-gray-300 rounded-lg text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      rows={2}
                    />

                    <div className="flex gap-2">
                      <select
                        value={selectedStatus[incident.id] ?? ""}
                        onChange={(event) =>
                          setSelectedStatus((prev) => ({
                            ...prev,
                            [incident.id]: event.target.value,
                          }))
                        }
                        className="flex-1 border border-gray-300 rounded-lg text-sm px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Update status…</option>
                        {INCIDENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(incident.id)}
                        disabled={!selectedStatus[incident.id] || joining}
                        className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>

                    {!isUserAssigned(incident) ? (
                      <button
                        type="button"
                        onClick={() => handleJoinIncident(incident.id)}
                        disabled={joining}
                        className="w-full px-4 py-2.5 border-2 border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {joining ? "Joining..." : "Join Response"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <details className="mt-5 group">
                  <summary className="cursor-pointer text-sm text-gray-700 font-medium flex items-center gap-2 select-none hover:text-primary">
                    <History className="h-4 w-4" />
                    View status history
                  </summary>
                  <div className="mt-4 text-sm text-gray-700">
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
