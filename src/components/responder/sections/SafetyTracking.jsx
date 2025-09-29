import { useMemo } from "react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import {
  Compass,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Waves,
  Zap,
} from "lucide-react";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

const FALLBACK_SAFETY_EVENTS = [
  {
    id: "SAFE-129",
    type: "geo-fence",
    message: "Team Bravo 40m from landslide edge",
    timestamp: "1 min ago",
    severity: "warning",
  },
  {
    id: "SAFE-124",
    type: "weather",
    message: "Lightning proximity within 5km",
    timestamp: "6 min ago",
    severity: "critical",
  },
  {
    id: "SAFE-120",
    type: "wellness",
    message: "Medic Delta hydration reminder",
    timestamp: "12 min ago",
    severity: "info",
  },
];

const FALLBACK_TEAM_LOCATIONS = [
  {
    name: "Team Alpha",
    coordinate: "14.6563° N, 121.0430° E",
    status: "safe lane",
  },
  {
    name: "Team Bravo",
    coordinate: "14.6541° N, 121.0484° E",
    status: "hazard nearby",
  },
  {
    name: "Scout Echo",
    coordinate: "14.6520° N, 121.0362° E",
    status: "patrol loop",
  },
];

const FALLBACK_INFRASTRUCTURE = {
  floodSensors: 6,
  generatorStatus: "Nominal",
};

const severityBadge = {
  critical: "bg-rose-500/10 text-rose-600",
  warning: "bg-amber-500/10 text-amber-600",
  info: "bg-sky-500/10 text-sky-600",
};

const statusTone = {
  "safe lane": "text-emerald-600",
  "hazard nearby": "text-amber-600",
  "patrol loop": "text-sky-600",
};

export const SafetyTracking = () => {
  const { data } = useResponderData();

  const safetyEvents = data?.safetyEvents?.length
    ? data.safetyEvents
    : FALLBACK_SAFETY_EVENTS;
  const teamLocations = data?.teamLocations?.length
    ? data.teamLocations
    : FALLBACK_TEAM_LOCATIONS;
  const infrastructure = data?.infrastructure ?? FALLBACK_INFRASTRUCTURE;

  const summary = useMemo(() => {
    const safeTeams = teamLocations.filter((team) => {
      const tone = (team.status ?? "").toString().toLowerCase();
      return (
        tone.includes("safe") ||
        tone.includes("patrol") ||
        tone.includes("staging")
      );
    }).length;
    const hazardAlerts = safetyEvents.filter((event) =>
      ["critical", "warning"].includes(event.severity)
    ).length;
    return {
      safeTeams,
      hazardAlerts,
      floodSensors:
        infrastructure.floodSensors ?? FALLBACK_INFRASTRUCTURE.floodSensors,
      generatorStatus:
        infrastructure.generatorStatus ??
        FALLBACK_INFRASTRUCTURE.generatorStatus,
    };
  }, [infrastructure, safetyEvents, teamLocations]);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Safety & Tracking"
        description="Location pings, hazard alerts, and wellness nudges to keep your team in the green."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Teams in safe zone"
          value={`${summary.safeTeams}`}
          change={
            summary.safeTeams
              ? `${summary.safeTeams} confirmed`
              : "Awaiting check-in"
          }
          tone="success"
        />
        <StatCard
          icon={TriangleAlert}
          label="Active hazard alerts"
          value={`${summary.hazardAlerts}`}
          change={summary.hazardAlerts ? "Monitor" : "Clear"}
          tone="warning"
        />
        <StatCard
          icon={Waves}
          label="Flood sensors"
          value={`${summary.floodSensors}`}
          change="Network stable"
          tone="primary"
        />
        <StatCard
          icon={Zap}
          label="Generator status"
          value={summary.generatorStatus}
          change="100% uptime"
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Live alerts</h3>
          <ul className="mt-4 space-y-3 text-sm text-foreground/70">
            {safetyEvents.map((event, index) => {
              const badge =
                severityBadge[event.severity] ?? "bg-primary/10 text-primary";
              const eventId = event.id ?? `${event.type ?? "alert"}-${index}`;
              return (
                <li
                  key={eventId}
                  className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {event.message ?? "Telemetry update"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {event.severity ?? "info"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/50">
                    <span>{eventId}</span>
                    <span>{event.timestamp ?? "moments ago"}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Team positions
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-foreground/70">
            {teamLocations.map((team, index) => {
              const palette = statusTone[team.status] ?? "text-primary";
              const identifier =
                team.name ?? `${team.coordinate ?? "team"}-${index}`;
              return (
                <li
                  key={identifier}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {team.name ?? "Responder"}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-foreground/50">
                      <MapPin className="h-3.5 w-3.5" />{" "}
                      {team.coordinate ?? "Awaiting ping"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase ${palette}`}
                  >
                    {team.status ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/70 p-5 text-xs text-foreground/60 shadow-sm">
        <p className="font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Geo-fence reminder
        </p>
        <p className="mt-2">
          All teams must ping location every 3 minutes. Hazard beacons trigger
          an audible alarm on your tablet—acknowledge within 30 seconds or
          command will call directly.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-foreground/70">
          <Compass className="h-3.5 w-3.5" /> Update route markings
        </div>
      </div>
    </section>
  );
};
