import { Filter, Flame, MapPin, RefreshCcw } from "lucide-react";
import incidentMap from "@images/evacMapjen.jpg";
import { SectionHeader } from "../SectionHeader";

const legend = [
  { label: "Critical", color: "bg-rose-500" },
  { label: "High", color: "bg-amber-500" },
  { label: "Moderate", color: "bg-orange-400" },
  { label: "Stable", color: "bg-emerald-500" },
];

const incidentHighlights = [
  { barangay: "San Roque", status: "Flood barrier nearing threshold" },
  { barangay: "Pugad", status: "Fire suppression ongoing" },
  { barangay: "Centro", status: "Evacuation center at 82% capacity" },
  { barangay: "San Vicente", status: "Medical surge team activated" },
];

export const IncidentHeatMap = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Incident Logs & Heat Map"
        description="Geospatial view of ongoing incidents with automated severity clustering. Track hotspots, resource saturation, and critical barangay alerts."
        actions={
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:shadow-md">
              <RefreshCcw className="h-4 w-4" />
              Sync sensors
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm">
          <div className="relative">
            <img
              src={incidentMap}
              alt="Incident heat map"
              className="h-[26rem] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border/60 bg-background/90 px-5 py-2 text-xs text-foreground/70 backdrop-blur">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Flame className="h-4 w-4 text-amber-500" /> Heat signature
                intensity
              </span>
              {legend.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                  ></span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Rapid incident snapshot
            </h3>
            <p className="text-sm text-foreground/60">
              Most recent escalations with automated status updates.
            </p>
            <div className="mt-5 space-y-4 divide-y divide-border/60 text-sm">
              {incidentHighlights.map((item) => (
                <div
                  key={item.barangay}
                  className="flex items-start gap-3 pt-4 first:pt-0"
                >
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.barangay}
                    </p>
                    <p className="text-foreground/60">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">
                  Sensor health
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  96.4%
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-500">
                Stable
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-foreground/60">
              106 geofenced sensors reporting. 3 units flagged for calibration
              (scheduled by maintenance).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
