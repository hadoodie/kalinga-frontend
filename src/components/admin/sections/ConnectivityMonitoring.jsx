import { Activity, Network, RadioTower, Server, Wifi } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { StatCard } from "../StatCard";

const pingHistory = [
  { time: "0900H", latency: 24 },
  { time: "1000H", latency: 31 },
  { time: "1100H", latency: 22 },
  { time: "1200H", latency: 36 },
  { time: "1300H", latency: 28 },
  { time: "1400H", latency: 26 },
];

const accessPoints = [
  { site: "Command Center", status: "Online", load: "68%" },
  { site: "Evac Center A", status: "Online", load: "52%" },
  { site: "Evac Center B", status: "High", load: "91%" },
  { site: "Satellite Office", status: "Offline", load: "—" },
];

const statusTone = {
  Online: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  High: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Offline: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

export const ConnectivityMonitoring = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Connectivity Monitoring"
        description="Keep communications resilient by tracking server status, network health, and active connections across response hubs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Server}
          label="Command server"
          value="Online"
          change="Uptime 99.98%"
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Median latency"
          value="28 ms"
          change="-4 ms"
          tone="primary"
        />
        <StatCard
          icon={Network}
          label="Network throughput"
          value="412 Mbps"
          change="+38 Mbps"
          tone="primary"
        />
        <StatCard
          icon={Wifi}
          label="Active devices"
          value="1,482"
          change="+126 today"
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Latency trend (ms)
              </h3>
              <p className="text-sm text-foreground/60">
                Hourly average ping to primary command server.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
              Monitoring 24/7
            </span>
          </div>
          <div className="mt-6 flex h-60 items-end gap-3">
            {pingHistory.map((point) => (
              <div
                key={point.time}
                className="flex flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full rounded-full bg-gradient-to-t from-primary/10 via-primary/30 to-primary/40"
                  style={{ height: `${Math.max(point.latency, 14) * 2}px` }}
                />
                <p className="text-xs font-medium text-foreground/60">
                  {point.time}
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {point.latency} ms
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Access point status
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              {accessPoints.map((ap) => (
                <div
                  key={ap.site}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">{ap.site}</p>
                    <p className="text-xs text-foreground/60">
                      Load: {ap.load}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[ap.status]
                    }`}
                  >
                    {ap.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Radio comms
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Municipal VHF repeaters
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-2 text-primary">
                <RadioTower className="h-4 w-4" /> Channel 1 Operational
              </span>
              <span className="text-xs text-primary/70">
                Emergency net secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
