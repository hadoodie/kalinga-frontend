import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Flame,
  MapPin,
  RefreshCcw,
  Sparkles,
  Activity,
} from "lucide-react";
import { MapContainer, CircleMarker, TileLayer, Tooltip } from "react-leaflet";
import { SectionHeader } from "../SectionHeader";
import { formatRelativeTime } from "@/lib/datetime";
import adminService from "@/services/adminService";

const INCIDENT_FEED_ENDPOINT =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

const PH_BOUNDING_BOX = {
  minLat: 4.5,
  maxLat: 21,
  minLng: 116,
  maxLng: 127,
};

const severityStyles = {
  Severe: { hex: "#e11d48", badge: "bg-rose-500" },
  High: { hex: "#f97316", badge: "bg-amber-500" },
  Moderate: { hex: "#facc15", badge: "bg-yellow-400" },
  Minor: { hex: "#22c55e", badge: "bg-emerald-500" },
};

const severityOrder = ["Severe", "High", "Moderate", "Minor"];

const fallbackIncidents = [
  {
    id: "PH-MAKATI-01",
    type: "Flood Advisory",
    barangay: "Poblacion, Makati",
    teams: 3,
    status: "Mitigating",
    severity: "High",
    magnitude: 4.6,
    coordinates: { lat: 14.5657, lng: 121.0288 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: "PH-PAMPANGA-02",
    type: "Lahar Watch",
    barangay: "San Fernando, Pampanga",
    teams: 2,
    status: "Coordinating",
    severity: "Moderate",
    magnitude: 3.8,
    coordinates: { lat: 15.0333, lng: 120.6833 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 18),
  },
  {
    id: "PH-ALBAY-03",
    type: "Volcanic Tremor",
    barangay: "Legazpi, Albay",
    teams: 4,
    status: "Mitigating",
    severity: "Severe",
    magnitude: 5.2,
    coordinates: { lat: 13.1372, lng: 123.7344 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: "PH-DAVAO-04",
    type: "Landslide Risk",
    barangay: "Marilog, Davao",
    teams: 1,
    status: "Monitoring",
    severity: "Minor",
    magnitude: 2.9,
    coordinates: { lat: 7.2476, lng: 125.3417 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 33),
  },
];

const isWithinPhilippines = (lat, lng) =>
  lat >= PH_BOUNDING_BOX.minLat &&
  lat <= PH_BOUNDING_BOX.maxLat &&
  lng >= PH_BOUNDING_BOX.minLng &&
  lng <= PH_BOUNDING_BOX.maxLng;

export const IncidentHeatMap = () => {
  const [incidentFeed, setIncidentFeed] = useState({
    items: fallbackIncidents,
    fetchedAt: null,
    status: "idle",
  });
  const [systemIncidents, setSystemIncidents] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // "all", "usgs", "system"

  // Fetch system incidents from backend
  const fetchSystemIncidents = useCallback(async () => {
    try {
      const data = await adminService.getIncidents({ include_resolved: false });
      const mapped = (data || []).map((incident) => {
        // Map priority/severity to our severity scale
        const priority = incident.priority || incident.severity || "moderate";
        const severity =
          priority === "critical"
            ? "Severe"
            : priority === "high"
            ? "High"
            : priority === "moderate"
            ? "Moderate"
            : "Minor";

        // Extract coordinates from incident
        const lat = incident.latitude || incident.location?.latitude || 14.5995;
        const lng =
          incident.longitude || incident.location?.longitude || 120.9842;

        return {
          id: `SYS-${incident.id}`,
          type: incident.type || "System Incident",
          barangay:
            incident.address ||
            incident.location?.address ||
            "Reported Location",
          teams: incident.assignments?.length || 0,
          status: incident.status || "reported",
          severity,
          magnitude:
            priority === "critical" ? 5.5 : priority === "high" ? 4.5 : 3.5,
          coordinates: { lat, lng },
          updatedAt: new Date(incident.updated_at || incident.created_at),
          source: "system",
          patientId: incident.patient_id,
        };
      });
      setSystemIncidents(mapped);
    } catch (error) {
      console.error("Failed to fetch system incidents:", error);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    setIncidentFeed((prev) => ({
      ...prev,
      status: prev.status === "success" ? "refreshing" : "loading",
    }));

    try {
      const response = await fetch(INCIDENT_FEED_ENDPOINT);
      if (!response.ok) {
        throw new Error(`USGS feed returned ${response.status}`);
      }

      const data = await response.json();
      const mapped = Array.isArray(data?.features)
        ? data.features
            .map((feature, index) => {
              const coordinates = feature?.geometry?.coordinates;
              const lng = coordinates?.[0];
              const lat = coordinates?.[1];

              if (typeof lat !== "number" || typeof lng !== "number") {
                return null;
              }

              if (!isWithinPhilippines(lat, lng)) {
                return null;
              }

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
                  : "Monitoring";

              return {
                id: feature?.id ?? `USGS-${index}`,
                type: feature?.properties?.title ?? "Seismic Activity",
                barangay: place,
                teams: Math.max(1, Math.round(magnitude * 1.2)),
                status,
                severity,
                magnitude,
                coordinates: { lat, lng },
                updatedAt: timestamp,
              };
            })
            .filter(Boolean)
        : [];

      setIncidentFeed({
        items: mapped.length ? mapped : fallbackIncidents,
        fetchedAt: new Date(),
        status: "success",
      });
    } catch (error) {
      console.error("Failed to fetch incidents", error);
      setIncidentFeed((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      if (ignore) return;
      await Promise.all([fetchIncidents(), fetchSystemIncidents()]);
    };

    load();
    const interval = setInterval(load, 1000 * 60 * 5);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchIncidents, fetchSystemIncidents]);

  // Combine incidents based on view mode
  const incidents = useMemo(() => {
    if (viewMode === "usgs") return incidentFeed.items;
    if (viewMode === "system") return systemIncidents;
    return [...incidentFeed.items, ...systemIncidents];
  }, [incidentFeed.items, systemIncidents, viewMode]);

  const filteredIncidents = useMemo(() => {
    if (selectedSeverity === "all") {
      return incidents;
    }
    return incidents.filter((item) => item.severity === selectedSeverity);
  }, [incidents, selectedSeverity]);

  const summary = useMemo(() => {
    const base = severityOrder.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    return incidents.reduce((acc, item) => {
      if (severityOrder.includes(item.severity)) {
        acc[item.severity] += 1;
      }
      return acc;
    }, base);
  }, [incidents]);

  const highlights = useMemo(() => {
    const ranked = [...incidents].sort((a, b) => {
      const severityDiff =
        severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.updatedAt - a.updatedAt;
    });
    return ranked.slice(0, 4);
  }, [incidents]);

  const lastUpdatedLabel = useMemo(() => {
    if (incidentFeed.status === "loading" && !incidentFeed.fetchedAt) {
      return "Fetching live data…";
    }
    if (incidentFeed.status === "error") {
      return "Using cached incidents";
    }
    if (!incidentFeed.fetchedAt) {
      return "Monitoring";
    }
    return `Updated ${formatRelativeTime(incidentFeed.fetchedAt, {
      short: true,
    })}`;
  }, [incidentFeed.status, incidentFeed.fetchedAt]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Incident Logs & Heat Map"
        description="Live geospatial feed of incidents across the Philippines. Tile layers are sourced from OpenStreetMap while event telemetry is driven by the USGS hazards API."
        actions={
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <Sparkles className="h-3.5 w-3.5" /> {lastUpdatedLabel}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground/70">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {incidents.length} active telemetry points
          </div>
          {systemIncidents.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Activity className="h-3.5 w-3.5" />
              {systemIncidents.length} system incidents
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-1">
            Source:
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode("system")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                viewMode === "system"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
              }`}
            >
              System
            </button>
            <button
              onClick={() => setViewMode("usgs")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                viewMode === "usgs"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
              }`}
            >
              USGS
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-1">
            <Flame className="h-3 w-3 text-rose-400" /> Severity filter:
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedSeverity("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedSeverity === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
              }`}
            >
              All
            </button>
            {severityOrder.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedSeverity(level)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedSeverity === level
                    ? `${severityStyles[level].badge} text-white shadow-sm`
                    : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            fetchIncidents();
            fetchSystemIncidents();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh feed
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-[26rem] overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm">
          <MapContainer
            center={[12.8797, 121.774]} // Geographic center of the Philippines
            zoom={5}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredIncidents.map((incident) => {
              const severityStyle =
                severityStyles[incident.severity] ?? severityStyles.Minor;
              const radius = Math.max(8, incident.magnitude * 2.5);
              return (
                <CircleMarker
                  key={incident.id}
                  center={[incident.coordinates.lat, incident.coordinates.lng]}
                  radius={radius}
                  pathOptions={{
                    color: severityStyle.hex,
                    fillColor: severityStyle.hex,
                    fillOpacity: 0.35,
                    weight: 1,
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -radius]}
                    opacity={0.95}
                    className="bg-background text-foreground"
                  >
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-foreground">
                        {incident.type}
                      </p>
                      <p className="text-foreground/70">{incident.barangay}</p>
                      <p className="text-foreground/60">
                        Magnitude {incident.magnitude.toFixed(1)} •{" "}
                        {incident.teams} team(s)
                      </p>
                      <p className="text-foreground/50">
                        Updated{" "}
                        {formatRelativeTime(incident.updatedAt, {
                          short: true,
                        })}
                      </p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Severity distribution
            </h3>
            <p className="text-sm text-foreground/60">
              Live count of incident telemetry by severity band.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              {severityOrder.map((level) => (
                <div
                  key={level}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${severityStyles[level].badge}`}
                    />
                    <span className="font-medium text-foreground">{level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/60">
                      {summary[level]} incidents
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Rapid incident snapshot
            </h3>
            <p className="text-sm text-foreground/60">
              Most recent escalations with automated status updates.
            </p>
            <div className="mt-5 space-y-4 divide-y divide-border/60 text-sm">
              {highlights.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pt-4 first:pt-0"
                >
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.barangay}
                    </p>
                    <p className="text-foreground/60">
                      {item.type} • {item.severity} severity
                    </p>
                    <p className="text-xs text-foreground/50">
                      Updated {formatRelativeTime(item.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
