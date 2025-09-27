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

const trends = [
  { label: "Flood", value: 78 },
  { label: "Fire", value: 55 },
  { label: "Medical", value: 64 },
  { label: "Earthquake", value: 42 },
  { label: "Typhoon", value: 70 },
];

const recentIncidents = [
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
    severity: "Medium",
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
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Command Center Overview"
        description="Real-time situational awareness across the municipality. Monitor critical metrics, incident cadence, and response posture at a glance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Active Incidents"
          value="18"
          change="+12% vs yesterday"
          tone="warning"
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
          trend="up"
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
              <CircleDot className="h-3.5 w-3.5" /> Updated 3m ago
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
          {recentIncidents.map((incident) => (
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
                  <Users className="h-3.5 w-3.5" /> {incident.teams} teams
                  on-site
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
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    statusPills[incident.status]
                  }`}
                >
                  {incident.status}
                </span>
                <span className="text-xs text-foreground/50">
                  {incident.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
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
