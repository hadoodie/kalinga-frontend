import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  CircleDot,
  Clock3,
  Headphones,
  Radio,
  ShieldCheck,
  Users,
  Waves,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { StatCard } from "../StatCard";
import { formatRelativeTime } from "@/lib/datetime";

const INCIDENT_FEED_ENDPOINT =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

const trends = [
  { label: "Flood", value: 78 },
  { label: "Fire", value: 55 },
  { label: "Medical", value: 64 },
  { label: "Earthquake", value: 42 },
  { label: "Typhoon", value: 70 },
];

const fallbackIncidents = [
  {
    id: "INC-2045",
    type: "Flash Flood",
    barangay: "Poblacion",
    teams: 4,
    status: "Mitigating",
    severity: "High",
    timeAgo: "12 minutes ago",
  },
  {
    id: "INC-2044",
    type: "Evacuation Support",
    barangay: "San Roque",
    teams: 2,
    status: "Coordinating",
    severity: "Medium",
    timeAgo: "32 minutes ago",
  },
  {
    id: "INC-2043",
    type: "Fire Containment",
    barangay: "Sta. Maria",
    teams: 3,
    status: "Contained",
    severity: "Low",
    timeAgo: "1 hour ago",
  },
];

const statusPills = {
  Mitigating:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Coordinating:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  Contained:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

const opsTimeline = [
  {
    time: "12:45",
    title: "Rapid damage assessment deployed",
    by: "Planning Section",
    status: "Teams Delta & Echo en route",
  },
  {
    time: "12:10",
    title: "Barangay captains coordination call",
    by: "EOC Liaison",
    status: "12 of 18 present • minutes circulated",
  },
  {
    time: "11:35",
    title: "Mobile clinic dispatched",
    by: "Health Cluster",
    status: "ETA 20m • equipped for 60 patients",
  },
  {
    time: "11:05",
    title: "School gym converted to surge shelter",
    by: "Logistics",
    status: "Capacity 320 • power restored",
  },
];

const teamReadiness = [
  { label: "Medical response", readiness: 92, onCall: 4 },
  { label: "Search & rescue", readiness: 86, onCall: 6 },
  { label: "Logistics & staging", readiness: 78, onCall: 3 },
  { label: "Comms & intel", readiness: 95, onCall: 2 },
];

const dispatchQueue = [
  {
    channel: "Radio channel 1",
    status: "Clear",
    note: "Traffic with field teams stable",
  },
  {
    channel: "Hotline 1344",
    status: "Queued",
    note: "4 callers waiting • average 2m",
  },
  {
    channel: "Coordination chat",
    status: "Active",
    note: "19 operators online",
  },
];

export const DashboardSection = () => {
  const [incidentFeed, setIncidentFeed] = useState({
    items: fallbackIncidents,
    fetchedAt: null,
    status: "idle",
  });

  useEffect(() => {
    let ignore = false;

    const fetchIncidents = async () => {
      setIncidentFeed((prev) => ({
        ...prev,
        status: prev.status === "success" ? "refreshing" : "loading",
      }));

      try {
        const response = await fetch(INCIDENT_FEED_ENDPOINT);
        if (!response.ok) {
          throw new Error(`USGS feed returned ${response.status}`);
        }

        const payload = await response.json();
        const features = Array.isArray(payload?.features)
          ? payload.features.slice(0, 5)
          : [];

        if (!ignore) {
          if (features.length) {
            const mapped = features.map((feature, idx) => {
              const magnitude = feature?.properties?.mag ?? 0;
              const place = feature?.properties?.place ?? "Unverified location";
              const timestamp = feature?.properties?.time
                ? new Date(feature.properties.time)
                : new Date();

              const severity =
                magnitude >= 5.5
                  ? "Severe"
                  : magnitude >= 4.5
                  ? "High"
                  : magnitude >= 3.5
                  ? "Moderate"
                  : "Minor";

              const status =
                severity === "Severe" || severity === "High"
                  ? "Mitigating"
                  : severity === "Moderate"
                  ? "Coordinating"
                  : "Contained";

              return {
                id: feature?.id ?? `USGS-${idx}`,
                type: feature?.properties?.title ?? "Seismic Activity",
                barangay: place,
                teams: Math.max(1, Math.round(magnitude * 1.5)) || 1,
                status,
                severity,
                timeAgo: formatRelativeTime(timestamp),
              };
            });

            setIncidentFeed({
              items: mapped,
              fetchedAt: new Date(),
              status: "success",
            });
          } else {
            setIncidentFeed({
              items: fallbackIncidents,
              fetchedAt: new Date(),
              status: "success",
            });
          }
        }
      } catch (error) {
        if (ignore) return;
        console.error("Failed to fetch USGS incidents", error);
        setIncidentFeed((prev) => ({
          ...prev,
          status: "error",
        }));
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 60_000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  const incidents = incidentFeed.items ?? [];
  const incidentsLength = incidents.length;

  const activeIncidents = useMemo(
    () => incidents.filter((item) => item.status !== "Contained").length,
    [incidents]
  );

  const incidentSummary = useMemo(() => {
    if (incidentFeed.status === "loading" && !incidentFeed.fetchedAt) {
      return {
        change: undefined,
        trend: "up",
        tone: "neutral",
      };
    }

    if (incidentFeed.status === "error") {
      return {
        change: "using cached data",
        trend: "down",
        tone: "warning",
      };
    }

    const delta = incidentsLength - fallbackIncidents.length;

    if (!incidentFeed.fetchedAt) {
      return {
        change: "monitoring feed",
        trend: "up",
        tone: "primary",
      };
    }

    if (delta === 0) {
      return {
        change: "steady vs baseline",
        trend: "up",
        tone: "neutral",
      };
    }

    return {
      change: `${delta > 0 ? "+" : ""}${delta} vs baseline`,
      trend: delta > 0 ? "up" : "down",
      tone: delta > 0 ? "warning" : "success",
    };
  }, [incidentFeed.status, incidentFeed.fetchedAt, incidentsLength]);

  const updatedLabel = useMemo(() => {
    if (incidentFeed.status === "loading" && !incidentFeed.fetchedAt) {
      return "Syncing live feed…";
    }
    if (incidentFeed.status === "error") {
      return "Feed unavailable — showing cached data";
    }
    if (!incidentFeed.fetchedAt) {
      return "Live monitoring";
    }
    return `Updated ${formatRelativeTime(incidentFeed.fetchedAt, {
      short: true,
    })}`;
  }, [incidentFeed.status, incidentFeed.fetchedAt]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Command Center Dashboard"
        description="Monitor live incidents, operational tempo, and resource readiness across the municipality."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-foreground/60">
            <Clock3 className="h-3.5 w-3.5" />
            {updatedLabel}
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Active Incidents"
          value={
            incidentFeed.status === "loading" && !incidentFeed.fetchedAt
              ? "…"
              : String(activeIncidents)
          }
          change={incidentSummary.change}
          trend={incidentSummary.trend}
          tone={incidentSummary.tone}
        />
        <StatCard
          icon={Users}
          label="Responders Deployed"
          value="126"
          change="+8 deployed"
          tone="primary"
        />
        <StatCard
          icon={ShieldCheck}
          label="Readiness Index"
          value="92%"
          change="steady"
          tone="success"
        />
        <StatCard
          icon={Waves}
          label="Early Warning Alerts"
          value="5"
          change="-2 today"
          trend="down"
          tone="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Incident Signal Trend
              </h3>
              <p className="text-sm text-foreground/60">
                Alert frequency in the past 24 hours across major hazard
                categories.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CircleDot className="h-3.5 w-3.5" /> {updatedLabel}
            </span>
          </div>

          <div className="mt-6 flex h-64 items-end justify-between gap-3">
            {trends.map((item) => (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              >
                <div
                  className="flex w-full flex-col items-center justify-end gap-2 rounded-2xl bg-gradient-to-t from-primary/10 via-primary/20 to-primary/30 p-2"
                  style={{ height: `${Math.max(item.value, 25)}%` }}
                >
                  <span className="text-sm font-semibold text-primary/80">
                    {item.value}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">
                  Response SLA
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  14m
                </p>
                <p className="mt-2 text-xs text-foreground/60">
                  Median dispatch time from alert confirmation to team
                  deployment.
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-500">
                On Target
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-foreground/70">
              <div className="flex items-center justify-between">
                <span>Urban barangays</span>
                <span className="font-semibold text-foreground">12m</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coastal barangays</span>
                <span className="font-semibold text-foreground">18m</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mountain barangays</span>
                <span className="font-semibold text-foreground">21m</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="h-9 w-9 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground/70">
                  Next operations sync
                </p>
                <p className="text-base font-semibold text-foreground">
                  1300H — Municipal Hall
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-foreground/70">
              <li>• Logistics & staging preparation update</li>
              <li>• Rapid damage assessment team briefing</li>
              <li>• Public advisory broadcast alignment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Live Incident Feed
            </h3>
            <p className="text-sm text-foreground/60">
              Rapid snapshot of open incidents and team allocations.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-500">
            <BarChart2 className="h-3.5 w-3.5" /> Auto-refreshing
          </span>
        </div>
        <div className="mt-6 divide-y divide-border/60 text-sm">
          {incidents.map((incident) => {
            const statusTone = statusPills[incident.status] ?? "bg-primary/10 text-primary";
            return (
              <div
                key={incident.id}
                className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{incident.type}</p>
                  <p className="text-xs text-foreground/60">
                    {incident.id} • {incident.barangay}
                  </p>
                </div>
                <div className="flex flex-col justify-between gap-2 text-xs text-foreground/60 md:flex-row md:items-center md:gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> {incident.teams} teams on-site
                  </div>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Severity:{" "}
                    <span className="font-semibold text-foreground/80">
                      {incident.severity}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
                  >
                    {incident.status}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {incident.timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-foreground/50">
          Data source: USGS Earthquake Hazards Program.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Operations timeline
              </h3>
              <p className="text-sm text-foreground/60">
                Key actions logged within the selected window.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed by Ops
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {opsTimeline.map((event) => (
              <div key={event.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {event.time}
                  </span>
                  <span className="mt-1 h-full w-px bg-border/60" />
                </div>
                <div className="flex-1 rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">{event.by}</p>
                  <p className="mt-2 text-xs text-foreground/70">
                    {event.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Team readiness
            </h3>
            <p className="text-sm text-foreground/60">
              Availability & standby strength.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {teamReadiness.map((team) => (
                <div
                  key={team.label}
                  className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span className="font-semibold text-foreground">
                      {team.label}
                    </span>
                    <span>{team.onCall} on-call</span>
                  </div>
                  <div className="h-2 rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${team.readiness}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-primary">
                    {team.readiness}% ready
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Comms & dispatch
            </h3>
            <p className="text-sm text-foreground/60">
              Monitor coordination channels.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {dispatchQueue.map((entry) => (
                <div
                  key={entry.channel}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Radio className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {entry.channel}
                    </p>
                    <p className="text-xs text-foreground/60">
                      Status: {entry.status}
                    </p>
                    <p className="mt-1 text-xs text-foreground/70">
                      {entry.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-foreground/60">
              <Headphones className="h-4 w-4" /> Duty desk staffed 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
