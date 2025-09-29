import {
  ClipboardCheck,
  HeartPulse,
  LifeBuoy,
  MapPin,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const responderHeroBanner = (
  <div className="rounded-3xl border border-emerald-400/50 bg-emerald-500/10 p-5 text-sm text-emerald-700 dark:text-emerald-300 shadow-sm">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-200">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
            Field Safety Alert
          </p>
          <p className="mt-1 text-base font-semibold">
            Team Bravo approaching landslide zone. Switch to outpost frequency
            for live ground updates.
          </p>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
            Geo-fence tracking will flag any responder outside the safe lane.
            Drones maintaining overwatch every 8 minutes.
          </p>
        </div>
      </div>
      <button className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-200 transition hover:border-emerald-400">
        Open safety brief
        <MapPin className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const responderQuickActions = [
  {
    label: "Acknowledge dispatch",
    description: "Confirm assignment and estimated arrival time",
    icon: ClipboardCheck,
  },
  {
    label: "Update patient status",
    description: "Send vitals and treatment notes to triage",
    icon: HeartPulse,
  },
  {
    label: "Switch comms channel",
    description: "Hop to medical, logistics, or safety nets",
    icon: Radio,
  },
];

const responderSupportCard = (
  <div className="rounded-2xl bg-primary/10 p-4 text-sm text-primary/80 dark:bg-primary/15">
    <p className="font-semibold text-primary">Need backup?</p>
    <p className="mt-1 leading-relaxed text-primary/80">
      Ping the tactical desk on Channel 4 or tap the safety hotline in the comms
      panel for immediate escalation.
    </p>
  </div>
);

export const ResponderLayout = (props) => {
  return (
    <AdminLayout
      consoleLabel="Responder Console"
      consoleSubtitle="Kalinga Field Ops"
      personaInitials="FR"
      personaName="Field Responder"
      personaRole="Emergency Services"
      searchPlaceholder="Search assignments, patients, or resources"
      heroBanner={responderHeroBanner}
      quickActions={responderQuickActions}
      supportCard={responderSupportCard}
      timeWindowLabel="Shift window"
      autoRefreshLabel="Telemetry sync"
      autoRefreshHint="Live every 30 seconds"
      consoleBadgeLabel="Active Module"
      {...props}
    />
  );
};
