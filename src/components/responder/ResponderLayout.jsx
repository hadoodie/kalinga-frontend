import {
  ClipboardCheck,
  HeartPulse,
  LifeBuoy,
  MapPin,
  PauseCircle,
  PlayCircle,
  Radio,
  RefreshCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Wind,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

export const ResponderLayout = (props) => {
  const {
    demoActive,
    demoStep,
    demoTimeline,
    startDemo,
    stopDemo,
    resetDemo,
    advanceStep,
    rewindStep,
    weatherSnapshot,
  } = useResponderData();

  const currentStep = demoTimeline[demoStep] ?? demoTimeline[0];

  const responderHeroBanner = (
    <div className="rounded-3xl border border-emerald-400/50 bg-emerald-500/10 p-5 text-sm text-emerald-700 shadow-sm dark:text-emerald-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
              Demo timeline
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-900 dark:text-emerald-100">
              {currentStep?.title ?? "Shift briefing"}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
              {currentStep?.summary ??
                "Simulate how teams accept dispatch, update command, and rotate after handovers."}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-700/80 dark:text-emerald-200/70">
              <span>STEP {demoStep}</span>
              <span className="opacity-60">/</span>
              <span>{Math.max(demoTimeline.length - 1, 1)}</span>
              <span className="opacity-60">•</span>
              <span>{demoActive ? "Auto" : "Manual"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={demoActive ? stopDemo : startDemo}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-4 py-2 font-semibold uppercase tracking-wider text-emerald-600 transition hover:border-emerald-400 dark:text-emerald-200"
            >
              {demoActive ? (
                <PauseCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {demoActive ? "Pause auto demo" : "Start auto demo"}
            </button>
            <button
              onClick={advanceStep}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-2 font-medium text-emerald-700 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:border-border/40 disabled:text-emerald-400"
              disabled={demoStep >= demoTimeline.length - 1}
            >
              <SkipForward className="h-4 w-4" />
              Step forward
            </button>
            <button
              onClick={rewindStep}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-2 font-medium text-emerald-700 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:border-border/40 disabled:text-emerald-400"
              disabled={demoStep === 0}
            >
              <SkipBack className="h-4 w-4" />
              Step back
            </button>
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-2 font-medium text-emerald-700 transition hover:border-emerald-400"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
          <p className="text-emerald-700/80 dark:text-emerald-200/70">
            Tip: keep this panel docked on a second display when presenting the
            responder workflow to stakeholders.
          </p>
        </div>
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
      label: demoActive ? "Auto demo running" : "Switch comms channel",
      description: demoActive
        ? "Timeline advancing through responder workflow"
        : "Hop to medical, logistics, or safety nets",
      icon: demoActive ? LifeBuoy : Radio,
    },
  ];

  const responderSupportCard = (
    <div className="rounded-2xl bg-primary/10 p-4 text-sm text-primary/80 dark:bg-primary/15">
      <p className="font-semibold text-primary">Need backup?</p>
      <p className="mt-1 leading-relaxed text-primary/80">
        Ping the tactical desk on Channel 4 or tap the safety hotline in the
        comms panel for immediate escalation.
      </p>
      {weatherSnapshot && (
        <div className="mt-3 grid gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary/80">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              Weather pulse: {weatherSnapshot.temperature}°C • feels like{" "}
              {weatherSnapshot.apparentTemperature}°C
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5" />
            <span>
              Wind {weatherSnapshot.windSpeed} km/h • Rain risk{" "}
              {weatherSnapshot.precipitationProbability}%
            </span>
          </div>
          {weatherSnapshot.airQuality && (
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>
                Air quality PM2.5 {weatherSnapshot.airQuality.pm25} µg/m³, PM10{" "}
                {weatherSnapshot.airQuality.pm10} µg/m³
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

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
