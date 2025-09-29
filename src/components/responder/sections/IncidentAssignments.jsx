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

const ASSIGNMENTS = [
  {
    id: "INC-4821",
    location: "Barangay San Roque Evac Center",
    coordinates: "14.6551° N, 121.0293° E",
    status: "en-route",
    priority: "critical",
    eta: "08 min",
    patientCount: 3,
    commander: "Lt. Ramos",
    lastUpdate: "2 min ago",
  },
  {
    id: "INC-4818",
    location: "Riverbank North Access",
    coordinates: "14.6592° N, 121.0421° E",
    status: "on-scene",
    priority: "high",
    eta: "",
    patientCount: 1,
    commander: "Sgt. Bernardo",
    lastUpdate: "5 min ago",
  },
  {
    id: "INC-4804",
    location: "Sta. Elena Covered Court",
    coordinates: "14.6660° N, 121.0442° E",
    status: "handover",
    priority: "moderate",
    eta: "",
    patientCount: 2,
    commander: "PO3 Salcedo",
    lastUpdate: "14 min ago",
  },
  {
    id: "INC-4799",
    location: "San Isidro Health Post",
    coordinates: "14.6483° N, 121.0251° E",
    status: "completed",
    priority: "routine",
    eta: "",
    patientCount: 0,
    commander: "Nurse Dela Cruz",
    lastUpdate: "28 min ago",
  },
];

const STATUS_BADGES = {
  "en-route": "bg-sky-500/10 text-sky-600",
  "on-scene": "bg-emerald-500/10 text-emerald-600",
  handover: "bg-amber-500/10 text-amber-600",
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
  { value: "completed", label: "Completed" },
];

export const IncidentAssignments = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredAssignments = useMemo(() => {
    if (activeFilter === "all") return ASSIGNMENTS;
    return ASSIGNMENTS.filter((item) => item.status === activeFilter);
  }, [activeFilter]);

  const summary = useMemo(() => {
    const base = {
      pending: ASSIGNMENTS.filter((item) => item.status === "en-route").length,
      active: ASSIGNMENTS.filter((item) => item.status === "on-scene").length,
      handover: ASSIGNMENTS.filter((item) => item.status === "handover").length,
      done: ASSIGNMENTS.filter((item) => item.status === "completed").length,
    };
    return base;
  }, []);

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
          change="2 new"
          tone="warning"
        />
        <StatCard
          icon={PersonStanding}
          label="On scene"
          value={`${summary.active}`}
          change="+1"
          tone="primary"
        />
        <StatCard
          icon={BadgeCheck}
          label="Handover in progress"
          value={`${summary.handover}`}
          change="-1"
          trend="down"
          tone="warning"
        />
        <StatCard
          icon={AlarmClock}
          label="Completed this shift"
          value={`${summary.done}`}
          change="+4"
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAssignments.map((assignment) => (
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
                <p className="text-xs text-foreground/60 flex items-center gap-2 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {assignment.coordinates}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                  STATUS_BADGES[assignment.status]
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
                  <span className={priorityColors[assignment.priority]}>
                    {assignment.priority}
                  </span>
                </p>
                <p>Patients: {assignment.patientCount}</p>
                <p>Ground lead: {assignment.commander}</p>
              </div>
              <div className="space-y-1">
                <p>ETA / Handover: {assignment.eta || "Awaiting update"}</p>
                <p>Last update: {assignment.lastUpdate}</p>
                <p>Dispatch net: Channel 3 / Medical</p>
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
        ))}
      </div>
    </section>
  );
};
