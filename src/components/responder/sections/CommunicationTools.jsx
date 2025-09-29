import { useState } from "react";
import {
  MessageCircle,
  PhoneCall,
  Radio,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { id: "medical", label: "Medical", description: "Vitals, triage, transport" },
  {
    id: "logistics",
    label: "Logistics",
    description: "Supply runs, gear requests",
  },
  { id: "safety", label: "Safety", description: "Security, hazard updates" },
  { id: "command", label: "Command", description: "Field command briefings" },
];

const PRESET_MESSAGES = [
  "Arrived on scene, beginning assessment.",
  "Requesting additional medics for mass casualty.",
  "Transport ready, patient stabilized and en route.",
];

export const CommunicationTools = () => {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [message, setMessage] = useState("");

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Communication Tools"
        description="Stay synced with command, medical, and logistics nets. Choose a channel, send quick updates, and keep your fallback numbers handy."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Channels</h3>
          <div className="mt-4 space-y-2">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left text-sm transition",
                  activeChannel === channel.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                )}
              >
                <p className="font-semibold">{channel.label}</p>
                <p className="text-xs text-foreground/60">
                  {channel.description}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-primary/10 p-3 text-xs text-primary/80">
            <p className="font-semibold uppercase tracking-[0.2em]">Hotlines</p>
            <p className="mt-2">• Command desk: *201</p>
            <p>• Medical director: *450</p>
            <p>• Safety & security: *911</p>
          </div>
        </aside>

        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                {activeChannel.toUpperCase()} CHANNEL
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {CHANNELS.find((chan) => chan.id === activeChannel)?.label}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
                <Radio className="h-3.5 w-3.5" />
                Open radio bridge
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <Users className="h-3.5 w-3.5" />
                View roster
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm text-foreground/70">
            <p>
              Use quick presets below or craft a detailed update. Messages are
              timestamped and relayed to the command log automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_MESSAGES.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setMessage(preset)}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-foreground/70 transition hover:border-primary/40 hover:text-primary"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Compose update
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Enter concise update for command"
              className="w-full rounded-2xl border border-border/60 bg-background/60 p-3 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
                <Send className="h-3.5 w-3.5" />
                Send update
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" />
                Mark as notable
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-200">
            <p className="font-semibold uppercase tracking-[0.2em]">
              Radio protocol
            </p>
            <p className="mt-2">
              Always acknowledge commands twice, keep updates under 20 seconds,
              and escalate safety hazards to priority channel immediately.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-full border border-amber-500/60 px-3 py-1.5 font-semibold text-amber-700 transition hover:border-amber-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                Signal SOS
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-amber-500/60 px-3 py-1.5 font-semibold text-amber-700 transition hover:border-amber-500">
                <PhoneCall className="h-3.5 w-3.5" />
                Call dispatch
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
