import { useMemo, useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  MapPin,
  PersonStanding,
  Radio,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/datetime";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

const FALLBACK_ASSIGNMENTS = [
  {
    id: "INC-4821",
    label: "Flash flood",
    location: "Barangay San Roque Evac Center",
    coordinates: { lat: 14.6551, lng: 121.0293 },
    status: "en-route",
    priority: "critical",
    eta: "08 min",
    patientCount: 3,
    commander: "Lt. Ramos",
    lastUpdate: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

const STATUS_BADGES = {
  "en-route": "bg-sky-500/10 text-sky-600",
  "on-scene": "bg-emerald-500/10 text-emerald-600",
  handover: "bg-amber-500/10 text-amber-600",
  relief: "bg-indigo-500/10 text-indigo-600",
  transport: "bg-cyan-500/10 text-cyan-600",
  completed: "bg-foreground/10 text-foreground/80",
};

const priorityColors = {
  critical: "text-rose-600",
  high: "text-orange-600",
  moderate: "text-amber-600",
  routine: "text-emerald-600",
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "en-route", label: "En route" },
  { value: "on-scene", label: "On scene" },
  { value: "handover", label: "Handover" },
  { value: "relief", label: "Relief" },
  { value: "transport", label: "Transport" },
  { value: "completed", label: "Completed" },
];

export const IncidentAssignments = () => {
  const { data } = useResponderData();
  const [activeFilter, setActiveFilter] = useState("all");

  const assignments = useMemo(() => {
    const source = data?.incidents?.length
      ? data.incidents
      : FALLBACK_ASSIGNMENTS;
    return source.map((incident) => ({
      id: incident.id,
      label: incident.label,
      location: incident.location ?? incident.label,
      coordinates: incident.coordinates,
      status: incident.status ?? "en-route",
      priority: incident.priority ?? incident.severity ?? "routine",
      eta: incident.eta,
      patientCount: incident.patientCount,
      commander: incident.commander,
      dispatchNet: incident.dispatchNet,
      assignedUnits: incident.assignedUnits,
      lastUpdate: incident.lastUpdate,
    }));
  }, [data?.incidents]);

  const filteredAssignments = useMemo(() => {
    if (activeFilter === "all") return assignments;
    return assignments.filter((item) => item.status === activeFilter);
  }, [activeFilter, assignments]);

  const summary = useMemo(() => {
    return assignments.reduce(
      (acc, item) => {
        if (item.status === "en-route") acc.pending += 1;
        if (item.status === "on-scene") acc.active += 1;
        if (item.status === "handover" || item.status === "relief")
          acc.handover += 1;
        if (item.status === "completed") acc.done += 1;
        return acc;
      },
      { pending: 0, active: 0, handover: 0, done: 0 }
    );
  }, [assignments]);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Incident Assignments"
        description="Live view of dispatch orders you are responsible for this shift. Update each card as you acknowledge, arrive, and complete the task."
        actions={
          <div className="flex items-center gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  activeFilter === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CircleAlert}
          label="Pending dispatch"
          value={`${summary.pending}`}
          change={`${assignments.length} total`}
          tone="warning"
        />
        <StatCard
          icon={PersonStanding}
          label="On scene"
          value={`${summary.active}`}
          change={summary.active ? `Teams engaged` : "Standing by"}
          tone="primary"
        />
        <StatCard
          icon={BadgeCheck}
          label="Handover in progress"
          value={`${summary.handover}`}
          change={summary.handover ? "Coordinating relief" : "None"}
          tone="warning"
        />
        <StatCard
          icon={AlarmClock}
          label="Completed this shift"
          value={`${summary.done}`}
          change={summary.done ? "Ready for debrief" : "Pending closures"}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAssignments.map((assignment) => {
          const statusBadge =
            STATUS_BADGES[assignment.status] ?? "bg-primary/10 text-primary";
          const priorityTone =
            priorityColors[assignment.priority] ?? "text-primary";
          const prettyCoords = assignment.coordinates
            ? typeof assignment.coordinates === "string"
              ? assignment.coordinates
              : `${assignment.coordinates.lat.toFixed(
                  4
                )}° N, ${assignment.coordinates.lng.toFixed(4)}° E`
            : "—";

          return (
            <article
              key={assignment.id}
              className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {assignment.id}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {assignment.location}
                  </h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-foreground/60">
                    <MapPin className="h-3.5 w-3.5" />
                    {prettyCoords}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                    statusBadge
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {assignment.status.replace("-", " ")}
                </span>
              </div>

              <div className="grid gap-3 text-sm text-foreground/70 md:grid-cols-2">
                <div className="space-y-1">
                  <p>
                    Priority:{" "}
                    <span className={priorityTone}>{assignment.priority}</span>
                  </p>
                  <p>Patients: {assignment.patientCount ?? "—"}</p>
                  <p>Ground lead: {assignment.commander ?? "Unassigned"}</p>
                </div>
                <div className="space-y-1">
                  <p>ETA / State: {assignment.eta || "Awaiting update"}</p>
                  <p>
                    Last update:{" "}
                    {assignment.lastUpdate
                      ? formatRelativeTime(assignment.lastUpdate)
                      : "—"}
                  </p>
                  <p>
                    Dispatch net:{" "}
                    {assignment.dispatchNet ?? "Channel 3 / Medical"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
                  Update status
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                  <Radio className="h-3.5 w-3.5" />
                  Open channel log
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
