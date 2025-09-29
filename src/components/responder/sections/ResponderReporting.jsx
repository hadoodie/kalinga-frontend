import { useState } from "react";
import { CalendarClock, FileSignature, Paperclip, Upload } from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";

export const ResponderReporting = () => {
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [timestamp, setTimestamp] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Reporting"
        description="Submit quick situation reports (SITREP) so command can capture lessons, escalate needs, and close the loop on your missions."
      />

      <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Report timestamp
            </span>
            <div className="relative">
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
                className="w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
              />
              <CalendarClock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Linked incident ID
            </span>
            <input
              type="text"
              defaultValue="INC-4821"
              className="w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
              placeholder="Enter assignment number"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
            Situation summary
          </span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            placeholder="Headline of what happened, what actions were taken, and current status"
            className="w-full rounded-2xl border border-border/60 bg-background/60 p-3 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
            Action items / follow-up
          </span>
          <textarea
            value={actionItems}
            onChange={(event) => setActionItems(event.target.value)}
            rows={3}
            placeholder="Pending needs, handoffs, or next steps"
            className="w-full rounded-2xl border border-border/60 bg-background/60 p-3 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Upload photos / forms
            </span>
            <button className="inline-flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attach files
              </span>
              <Paperclip className="h-4 w-4" />
            </button>
            <p className="text-xs text-foreground/50">
              Drag & drop images or PDFs up to 10 MB.
            </p>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Sign-off / prepared by
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                FR
              </div>
              <input
                type="text"
                defaultValue="Field Responder"
                className="flex-1 bg-transparent outline-none"
              />
              <FileSignature className="h-4 w-4 text-foreground/40" />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
            Submit report
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-foreground/70 transition hover:border-primary/40 hover:text-primary">
            Save draft
          </button>
        </div>
      </div>
    </section>
  );
};
