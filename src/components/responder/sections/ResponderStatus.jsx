import { useMemo } from "react";
import {
  Activity,
  AlarmClock,
  BatteryCharging,
  Footprints,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

const statusPalette = {
  "on-scene": "bg-emerald-500/10 text-emerald-600",
  "en-route": "bg-sky-500/10 text-sky-600",
  triage: "bg-amber-500/10 text-amber-600",
  patrol: "bg-indigo-500/10 text-indigo-600",
  relief: "bg-indigo-500/10 text-indigo-600",
  transport: "bg-cyan-500/10 text-cyan-600",
};

export const ResponderStatus = () => {
  const { data } = useResponderData();
  const roster = data?.roster ?? [];

  const totals = useMemo(() => {
    return roster.reduce(
      (acc, team) => {
        acc.deployed += 1;
        if (team.status === "on-scene") acc.onScene += 1;
        if (team.status === "en-route") acc.commute += 1;
        if (
          typeof team.vitals === "string" &&
          team.vitals.toLowerCase().includes("restock")
        ) {
          acc.restock += 1;
        }
        return acc;
      },
      { deployed: 0, onScene: 0, commute: 0, restock: 0 }
    );
  }, [roster]);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Responder Status"
        description="Monitor who is active, their current assignment, and whether any team requires support or relief crews."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Teams deployed"
          value={`${totals.deployed}`}
          change="100% strength"
          tone="primary"
        />
        <StatCard
          icon={ShieldAlert}
          label="On scene"
          value={`${totals.onScene}`}
          change="Stable"
          tone="success"
        />
        <StatCard
          icon={Footprints}
          label="En route"
          value={`${totals.commute}`}
          change="-1"
          trend="down"
          tone="warning"
        />
        <StatCard
          icon={BatteryCharging}
          label="Needs resupply"
          value={`${totals.restock}`}
          change="Send logistics"
          tone="danger"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {roster.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-6 text-sm text-foreground/60">
            No teams are currently assigned. Start the demo timeline to populate
            responder activity.
          </div>
        )}
        {roster.map((team) => {
          const tone =
            statusPalette[team.status] ?? "bg-primary/10 text-primary";
          const statusLabel = team.status ? team.status.replace("-", " ") : "—";
          return (
            <article
              key={team.name}
              className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {team.name}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {team.location}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Members: {team.members}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tone}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {statusLabel}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                  <HeartPulse className="h-3.5 w-3.5" />
                  {team.vitals}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                  <AlarmClock className="h-3.5 w-3.5" />
                  Last ping: {team.lastPing}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
