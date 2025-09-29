import { Megaphone, MessageCircle, Mic, Send, Users } from "lucide-react";
import { SectionHeader } from "../SectionHeader";

const channels = [
  { name: "SMS Advisory", reach: "18,240 recipients", status: "Alerted" },
  { name: "Facebook Live", reach: "Municipal page", status: "Ready" },
  { name: "Community Radio 98.5", reach: "On standby", status: "Live" },
  { name: "Barangay Viber", reach: "42 barangays", status: "Scheduled" },
];

const statusTone = {
  Armed: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Ready: "bg-primary/10 text-primary",
  Live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Scheduled: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

export const BroadcastControl = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Broadcast Communication Control"
        description="Coordinate city-wide advisories and deliver consistent messaging across digital, SMS, and radio channels."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
            <Megaphone className="h-4 w-4" />
            Compose advisory
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Message composer
          </h3>
          <p className="text-sm text-foreground/60">
            Draft advisories and choose broadcast channels.
          </p>

          <div className="mt-5 space-y-4 text-sm text-foreground/70">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Heavy rainfall advisory for low-lying barangays"
                className="mt-2 w-full rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Message body
              </label>
              <textarea
                rows={6}
                placeholder="Key message, affected areas, expected timeline, call-to-action, contact details"
                className="mt-2 w-full rounded-3xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <Users className="h-4 w-4" /> Audience segments
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <MessageCircle className="h-4 w-4" /> Templates
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-foreground/60">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                <Mic className="h-3.5 w-3.5" /> PIO approval required
              </span>
              <span>Auto-translate: Enabled (Tagalog/Ilocano)</span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
              <Send className="h-4 w-4" />
              Queue broadcast
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Channels</h3>
            <div className="mt-4 space-y-3 text-sm">
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {channel.name}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {channel.reach}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[channel.status]
                    }`}
                  >
                    {channel.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
