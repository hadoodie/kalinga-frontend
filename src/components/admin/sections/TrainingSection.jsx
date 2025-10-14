import {
  CalendarDays,
  ClipboardCheck,
  DownloadCloud,
  GraduationCap,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";

const trainingTracks = [
  {
    title: "Incident Command System 300",
    owner: "BFP Region 2",
    schedule: "Oct 14 • 0800H-1700H",
    slots: "18 of 24 seats",
    status: "Confirming",
  },
  {
    title: "Water Rescue Refresher",
    owner: "PCG",
    schedule: "Oct 21 • 0700H-1900H",
    slots: "12 of 18 seats",
    status: "Open",
  },
  {
    title: "Public Information Officer Playbook",
    owner: "PIO Network",
    schedule: "Nov 05 • 1300H-1700H",
    slots: "Fully booked",
    status: "Waitlist",
  },
];

const statusTone = {
  Confirming: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Waitlist: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

export const TrainingSection = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Training & Capability Uplift"
        description="Coordinate competency-building with partner agencies. Track enrolments, certification currency, and capability uplifts requested from the training cluster."
        actions={
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <DownloadCloud className="h-4 w-4" />
              Import training plan
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
              <GraduationCap className="h-4 w-4" />
              Request workshop
            </button>
          </div>
        }
      />

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            {trainingTracks.map((track) => (
              <div
                key={track.title}
                className="rounded-2xl border border-border/60 bg-background/60 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {track.title}
                    </p>
                    <p className="text-xs text-foreground/60">
                      Lead agency: {track.owner}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[track.status]
                    }`}
                  >
                    {track.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {track.schedule}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    {track.slots}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-full max-w-sm flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Capability requests
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                Coordinate with the training cluster for new requirements.
              </p>
            </div>
            <div className="space-y-4 text-sm text-foreground/70">
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                <p className="font-semibold text-primary">
                  Technical rescue training
                </p>
                <p className="text-xs text-primary/70">
                  Requested by Barangay DRRM Council — awaiting schedule slot.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="font-semibold text-foreground">
                  Emergency communications drill
                </p>
                <p className="text-xs text-foreground/60">
                  PIO cluster prepping joint exercise across LGU offices.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="font-semibold text-foreground">
                  Barangay ICS orientation
                </p>
                <p className="text-xs text-foreground/60">
                  Coordinating with municipal DILG officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
