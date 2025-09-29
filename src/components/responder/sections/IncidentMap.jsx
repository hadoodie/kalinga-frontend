import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Map,
  MapPin,
  Navigation,
  RefreshCcw,
} from "lucide-react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import { formatRelativeTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

const FALLBACK_INCIDENTS = [
  {
    id: "INC-4821",
    label: "Flash flood",
    location: "Barangay San Roque Creek",
    coordinates: { lat: 14.6557, lng: 121.0296 },
    severity: "critical",
    status: "Evacuating families",
    assignedUnits: ["Medic 12", "Rescue 4"],
    reporters: "Team Bravo",
    lastUpdate: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    eta: "8 min",
  },
];

const severityTokens = {
  critical: {
    label: "Critical",
    color: "#e11d48",
    badge: "bg-rose-500/15 text-rose-600 border border-rose-500/20",
    tone: "danger",
  },
  high: {
    label: "High",
    color: "#f97316",
    badge: "bg-amber-500/15 text-amber-600 border border-amber-500/20",
    tone: "warning",
  },
  moderate: {
    label: "Moderate",
    color: "#facc15",
    badge: "bg-yellow-400/15 text-yellow-600 border border-yellow-400/30",
    tone: "warning",
  },
  low: {
    label: "Low",
    color: "#22c55e",
    badge: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
    tone: "success",
  },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

export const IncidentMap = () => {
  const { data } = useResponderData();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const incidents = useMemo(() => {
    return data?.incidents?.length ? data.incidents : FALLBACK_INCIDENTS;
  }, [data?.incidents]);

  const filteredIncidents = useMemo(() => {
    if (selectedFilter === "all") {
      return incidents;
    }
    return incidents.filter((incident) => incident.severity === selectedFilter);
  }, [selectedFilter, incidents]);

  const severitySummary = useMemo(() => {
    return incidents.reduce(
      (acc, item) => {
        const key = item.severity ?? "low";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      { critical: 0, high: 0, moderate: 0, low: 0 }
    );
  }, [incidents]);

  const activeTeams = useMemo(() => {
    const unique = new Set(
      incidents.flatMap((incident) => incident.assignedUnits ?? [])
    );
    return unique.size;
  }, [incidents]);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Field Incident Map"
        description="Geospatial snapshot of reported incidents with live unit commitments and last update timestamps."
        actions={
          <button
            onClick={() => setSelectedFilter("all")}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/60 transition hover:border-primary/40 hover:text-primary"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Active reports"
          value={filteredIncidents.length}
          change={`${incidents.length} total`}
          tone="danger"
        />
        <StatCard
          icon={Map}
          label="Critical zones"
          value={severitySummary.critical ?? 0}
          change="within city"
          tone="danger"
        />
        <StatCard
          icon={Navigation}
          label="Units deployed"
          value={activeTeams}
          change="across incidents"
          tone="primary"
        />
        <StatCard
          icon={MapPin}
          label="Standing by"
          value={severitySummary.low ?? 0}
          change="monitoring"
          tone="success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-foreground/70">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Severity
          filter
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                selectedFilter === option.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-[25rem] overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm">
          <MapContainer
            center={[14.655, 121.035]}
            zoom={13}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredIncidents.map((incident) => {
              const token =
                severityTokens[incident.severity ?? "low"] ??
                severityTokens.low;
              const radius = incident.severity === "critical" ? 18 : 12;
              const coordinates = incident.coordinates ?? { lat: 0, lng: 0 };
              const lastUpdate = incident.lastUpdate
                ? new Date(incident.lastUpdate)
                : undefined;
              const units = incident.assignedUnits ?? [];
              return (
                <CircleMarker
                  key={incident.id}
                  center={[coordinates.lat, coordinates.lng]}
                  radius={radius}
                  pathOptions={{
                    color: token.color,
                    fillColor: token.color,
                    fillOpacity: 0.35,
                    weight: 1.5,
                  }}
                >
                  <Tooltip
                    className="bg-background text-foreground"
                    opacity={0.95}
                  >
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-foreground">
                        {incident.label}
                      </p>
                      <p className="text-foreground/70">{incident.location}</p>
                      <p className="text-foreground/60">
                        Units: {units.length ? units.join(", ") : "—"}
                      </p>
                      <p className="text-foreground/50">
                        Updated{" "}
                        {lastUpdate
                          ? formatRelativeTime(lastUpdate, { short: true })
                          : "—"}
                      </p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="flex flex-col gap-4">
          {filteredIncidents.map((incident) => {
            const token =
              severityTokens[incident.severity ?? "low"] ?? severityTokens.low;
            const lastUpdate = incident.lastUpdate
              ? formatRelativeTime(incident.lastUpdate)
              : "—";
            const units = incident.assignedUnits ?? [];
            return (
              <article
                key={incident.id}
                className="rounded-3xl border border-border/60 bg-card/70 p-5 text-sm shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                      {incident.id}
                    </p>
                    <h3 className="text-base font-semibold text-foreground">
                      {incident.label}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/60">
                      {incident.location}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                      token.badge
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {token.label}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 text-xs text-foreground/70 md:grid-cols-2">
                  <div className="space-y-1">
                    <p>Last update: {lastUpdate}</p>
                    <p>Status: {incident.status ?? "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p>Assigned: {units.length ? units.join(", ") : "—"}</p>
                    <p>ETA / State: {incident.eta}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-foreground/50">
                  Source: {incident.reporters ?? "—"}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
