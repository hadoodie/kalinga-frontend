import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Flame,
  History,
  MapPin,
  Navigation,
  RefreshCcw,
  Route,
  Sparkles,
} from "lucide-react";
import {
  MapContainer,
  CircleMarker,
  TileLayer,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import { SectionHeader } from "../SectionHeader";
import { formatRelativeTime } from "@/lib/datetime";
import adminService from "@/services/adminService";

// Map tile configurations - using CartoDB for clean, minimal style
const MAP_TILES = {
  base: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  labels: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

// Route colors for historical paths
const ROUTE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
];

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

const lifecycleOptions = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Closed" },
  { value: "all", label: "All" },
];

const isClosedLifecycleStatus = (status) => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ["resolved", "cancelled", "closed", "completed"].includes(
    normalized
  );
};

const isWithinPhilippines = (lat, lng) =>
  lat >= PH_BOUNDING_BOX.minLat &&
  lat <= PH_BOUNDING_BOX.maxLat &&
  lng >= PH_BOUNDING_BOX.minLng &&
  lng <= PH_BOUNDING_BOX.maxLng;

export const IncidentHeatMap = () => {
  const [incidentFeed, setIncidentFeed] = useState({
    items: [],
    fetchedAt: null,
    status: "idle",
  });
  const [systemIncidents, setSystemIncidents] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // "all", "usgs", "system"
  const [lifecycleView, setLifecycleView] = useState("all");
  const [historicalRoutes, setHistoricalRoutes] = useState([]);
  const [showRoutes, setShowRoutes] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Fetch historical response routes from backend
  const fetchHistoricalRoutes = useCallback(async () => {
    setRoutesLoading(true);
    try {
      // Fetch route logs using adminService
      const routes = await adminService.getRouteLogs({ days: 7, per_page: 20 });
      setHistoricalRoutes(
        routes.map((route, index) => ({
          id: route.id,
          path: route.route_path || [],
          color: ROUTE_COLORS[index % ROUTE_COLORS.length],
          responder: route.user?.name || `Responder ${route.user_id}`,
          startedAt: route.started_at,
          distance: route.distance,
          duration: route.duration,
          deviationCount: route.deviation_count || 0,
        }))
      );
    } catch (error) {
      // Backend may not have data yet - gracefully degrade
      if (error?.response?.status !== 404 && error?.response?.status !== 405) {
        console.warn("Failed to fetch historical routes:", error?.message);
      }
      setHistoricalRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  // Fetch system incidents from backend (including resolved AND cancelled for Closed tab)
  const fetchSystemIncidents = useCallback(async () => {
    try {
      const data = await adminService.getIncidents({
        include_resolved: true,
        include_cancelled: true,
      });
      const mapped = (data || []).map((incident) => {
        // Infer severity from incident type if not available
        const type = (incident.type || "").toLowerCase();
        let severity = "Moderate";
        let magnitude = 3.5;

        // Infer severity from incident type
        if (
          type.includes("fire") ||
          type.includes("collision") ||
          type.includes("cardiac") ||
          type.includes("critical")
        ) {
          severity = "Severe";
          magnitude = 5.5;
        } else if (
          type.includes("flood") ||
          type.includes("accident") ||
          type.includes("emergency")
        ) {
          severity = "High";
          magnitude = 4.5;
        } else if (type.includes("minor") || type.includes("routine")) {
          severity = "Minor";
          magnitude = 2.5;
        }

        // Override with explicit priority/severity if available
        const priority = incident.priority || incident.severity;
        if (priority === "critical") {
          severity = "Severe";
          magnitude = 5.5;
        } else if (priority === "high") {
          severity = "High";
          magnitude = 4.5;
        } else if (priority === "low" || priority === "minor") {
          severity = "Minor";
          magnitude = 2.5;
        }

        // Extract coordinates - API returns lat/lng directly
        const lat = incident.lat ?? incident.latitude ?? 14.5995;
        const lng = incident.lng ?? incident.longitude ?? 120.9842;

        // Use location string from API
        const locationStr = incident.location || "Reported Location";

        return {
          id: `SYS-${incident.id}`,
          type: incident.type || "System Incident",
          barangay: locationStr,
          teams:
            incident.responders_assigned || incident.assignments?.length || 0,
          status: incident.status || "reported",
          severity,
          magnitude,
          coordinates: { lat, lng },
          updatedAt: new Date(incident.reported_at || incident.created_at),
          source: "system",
          patientId: incident.user_id,
          description: incident.description,
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
                source: "usgs",
              };
            })
            .filter(Boolean)
        : [];

        setIncidentFeed({
          items: mapped,
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

  // Fetch routes when toggle is enabled
  useEffect(() => {
    if (showRoutes && historicalRoutes.length === 0) {
      fetchHistoricalRoutes();
    }
  }, [showRoutes, historicalRoutes.length, fetchHistoricalRoutes]);

  const filteredSystemIncidents = useMemo(() => {
    if (lifecycleView === "all") return systemIncidents;
    return systemIncidents.filter((incident) => {
      const closed = isClosedLifecycleStatus((incident.status || "").toLowerCase());
      return lifecycleView === "resolved" ? closed : !closed;
    });
  }, [lifecycleView, systemIncidents]);

  // Combine incidents based on view mode
  const incidents = useMemo(() => {
    if (viewMode === "usgs") return incidentFeed.items;
    if (viewMode === "system") return filteredSystemIncidents;
    return [...incidentFeed.items, ...filteredSystemIncidents];
  }, [filteredSystemIncidents, incidentFeed.items, viewMode]);

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

  const closedIncidents = useMemo(() => {
    return [...systemIncidents]
      .filter((incident) =>
        isClosedLifecycleStatus((incident.status || "").toLowerCase())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [systemIncidents]);

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

  const lifecycleBadgeLabel =
    lifecycleView === "resolved"
      ? "closed incidents"
      : lifecycleView === "all"
      ? "system incidents"
      : "active incidents";

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
            {incidents.length} telemetry points
          </div>
          {systemIncidents.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Activity className="h-3.5 w-3.5" />
              {filteredSystemIncidents.length} {lifecycleBadgeLabel}
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
            <History className="h-3 w-3 text-slate-500" /> Lifecycle:
          </div>
          <div className="flex items-center gap-1">
            {lifecycleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLifecycleView(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  lifecycleView === option.value
                    ? option.value === "resolved"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
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
            if (showRoutes) fetchHistoricalRoutes();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh feed
        </button>
      </div>

      {/* Route toggle bar */}
      <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/60 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              showRoutes
                ? "bg-blue-500 text-white shadow-sm"
                : "border border-border/60 bg-background/60 text-foreground/70 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            <Route className="h-3.5 w-3.5" />
            {showRoutes ? "Hide Routes" : "Show Response Routes"}
          </button>
          {showRoutes && (
            <span className="text-xs text-foreground/60">
              {routesLoading
                ? "Loading routes..."
                : historicalRoutes.length > 0
                ? `${historicalRoutes.length} historical routes`
                : "No route history available"}
            </span>
          )}
        </div>
        {showRoutes && historicalRoutes.length > 0 && (
          <div className="flex items-center gap-2">
            {historicalRoutes.slice(0, 5).map((route) => (
              <div
                key={route.id}
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-2 py-1 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <span className="text-foreground/70 truncate max-w-[80px]">
                  {route.responder}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-[26rem] overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm">
          <MapContainer
            center={[12.8797, 121.774]} // Geographic center of the Philippines
            zoom={5}
            scrollWheelZoom
            className="h-full w-full"
          >
            {/* Base map layer - roads without labels for clean visualization */}
            <TileLayer
              attribution={MAP_TILES.attribution}
              url={MAP_TILES.base}
            />
            {/* Labels layer on top */}
            <TileLayer url={MAP_TILES.labels} />

            {/* Historical response routes */}
            {showRoutes &&
              historicalRoutes.map((route) =>
                route.path?.length >= 2 ? (
                  <Polyline
                    key={`route-${route.id}`}
                    positions={route.path.map(([lat, lng]) => [lat, lng])}
                    pathOptions={{
                      color: route.color,
                      weight: 3,
                      opacity: 0.7,
                      dashArray: route.deviationCount > 0 ? "5, 10" : undefined,
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs">
                        <p className="font-semibold">{route.responder}</p>
                        {route.distance && (
                          <p className="text-foreground/70">
                            {(route.distance / 1000).toFixed(1)} km
                          </p>
                        )}
                        {route.deviationCount > 0 && (
                          <p className="text-amber-600">
                            {route.deviationCount} route deviation(s)
                          </p>
                        )}
                        {route.startedAt && (
                          <p className="text-foreground/50">
                            {formatRelativeTime(new Date(route.startedAt))}
                          </p>
                        )}
                      </div>
                    </Tooltip>
                  </Polyline>
                ) : null
              )}

            {/* Incident markers */}
            {filteredIncidents.map((incident) => {
              const severityStyle =
                severityStyles[incident.severity] ?? severityStyles.Minor;
              const magnitude =
                typeof incident.magnitude === "number"
                  ? incident.magnitude
                  : 3.5;
              const radius = Math.max(8, magnitude * 2.5);
              const isEarthquake = incident.source === "usgs";
              const markerStyle = isEarthquake
                ? {
                    color: "#0ea5e9",
                    fillColor: "#0ea5e9",
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: "4 4",
                  }
                : {
                    color: severityStyle.hex,
                    fillColor: severityStyle.hex,
                    fillOpacity: 0.35,
                    weight: 1,
                  };

              return (
                <CircleMarker
                  key={incident.id}
                  center={[incident.coordinates.lat, incident.coordinates.lng]}
                  radius={radius}
                  pathOptions={markerStyle}
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
                      {isEarthquake && (
                        <p className="text-foreground/60">
                          Magnitude {magnitude.toFixed(1)} • USGS telemetry
                        </p>
                      )}
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
            {highlights.length ? (
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
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-border/60 bg-card/60 p-4 text-sm text-foreground/60">
                No recent incidents within the selected filters.
              </p>
            )}
          </div>

          {closedIncidents.length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Closed incidents log
              </h3>
              <p className="text-sm text-foreground/60">
                Recently resolved or cancelled events retained for audit.
              </p>
              <div className="mt-5 space-y-4 text-sm">
                {closedIncidents.slice(0, 4).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-background/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <Archive className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {incident.type}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {incident.barangay}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-foreground/50">
                      <p className="font-semibold capitalize text-emerald-600">
                        {(incident.status || "resolved").replace(/_/g, " ")}
                      </p>
                      <p>
                        Closed {formatRelativeTime(incident.updatedAt, { short: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
