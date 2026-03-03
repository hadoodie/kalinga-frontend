import { AlertOctagon, Eye, KeyRound, ShieldHalf, Video } from "lucide-react";
import { SectionHeader } from "../SectionHeader";

const securityEvents = [
  {
    time: "12:42",
    source: "Command Center CCTV",
    detail: "Motion detected near logistics bay",
    severity: "Info",
  },
  {
    time: "12:18",
    source: "Door control",
    detail: "Server room access — Chief Ops",
    severity: "Verified",
  },
  {
    time: "11:53",
    source: "Geo-fence",
    detail: "Responder tracker exited safe zone",
    severity: "Review",
  },
];

const severityTone = {
  Info: "bg-primary/10 text-primary",
  Verified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Review: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

export const MonitoringSecurity = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Monitoring & Security"
        description="Aggregate physical security and systems telemetry. Watch CCTV, door control, and incident integrity signals in real-time."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
            <Eye className="h-4 w-4" />
            Launch live wall
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Video className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Camera matrix
                  </p>
                  <p className="text-xs text-foreground/60">
                    Live feeds • 18/18 online
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-foreground/60">
                {new Array(9).fill(null).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-lg border border-dashed border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldHalf className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    System hardening
                  </p>
                  <p className="text-xs text-foreground/60">
                    Patch level • 98% compliant
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-foreground/60">
                <li>• MFA enforced across admin accounts</li>
                <li>• 2 pending firmware updates (scheduled 0200H)</li>
                <li>• Perimeter sensors: 0 tamper alerts</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Security event feed
            </h3>
            <div className="mt-4 space-y-4 text-sm">
              {securityEvents.map((event) => (
                <div
                  key={event.detail}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {event.source}
                    </p>
                    <p className="text-xs text-foreground/60">{event.detail}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground/60">
                    <span className="rounded-full border border-border/60 px-3 py-1 font-medium">
                      {event.time}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
                        severityTone[event.severity]
                      }`}
                    >
                      <AlertOctagon className="h-3.5 w-3.5" />
                      {event.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Access control
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Last 12 hours of badge events.
            </p>
            <div className="mt-4 space-y-3 text-sm text-foreground/70">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                <span>Server room</span>
                <span className="inline-flex items-center gap-2 text-xs text-foreground/60">
                  <KeyRound className="h-4 w-4" /> 4 entries
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                <span>Logistics bay</span>
                <span className="inline-flex items-center gap-2 text-xs text-foreground/60">
                  <KeyRound className="h-4 w-4" /> 9 entries
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                <span>Ops floor</span>
                <span className="inline-flex items-center gap-2 text-xs text-foreground/60">
                  <KeyRound className="h-4 w-4" /> 14 entries
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
