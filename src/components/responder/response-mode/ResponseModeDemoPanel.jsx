import { useMemo, useState } from "react";
import { Activity, PlayCircle, RefreshCw } from "lucide-react";

const DEMO_SEQUENCE = [
  {
    key: "reported",
    title: "Call Received",
    description:
      "Dispatch logs the emergency call and shares the caller location with the responder.",
    action: "Acknowledge the assignment",
    mapFocus: "Incident pin & caller notes",
  },
  {
    key: "en_route",
    title: "Navigation Locked",
    description: "Responder heads to the origin point with live turn-by-turn guidance.",
    action: "Provide ETA updates via chat",
    mapFocus: "Responder trail & optimized route",
  },
  {
    key: "on_scene",
    title: "On Scene",
    description:
      "Responder confirms arrival, begins triage, and the system fetches hospital recommendations.",
    action: "Select receiving hospital",
    mapFocus: "Incident perimeter & hazard overlays",
  },
  {
    key: "hospital_transfer",
    title: "Transport",
    description:
      "The destination hospital is locked, and guidance switches to the receiving facility.",
    action: "Monitor vitals + share drive progress",
    mapFocus: "Incident ➜ Hospital route",
  },
  {
    key: "resolved",
    title: "Turnover Complete",
    description:
      "Responder completes hospital turnover and closes the incident with final notes.",
    action: "Submit summary & mark resolved",
    mapFocus: "Timeline & documentation",
  },
];

const statusLabel = (value) => value.replace(/_/g, " ");

export default function ResponseModeDemoPanel({ incident, hospitals }) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = DEMO_SEQUENCE[stepIndex];

  const destinationPreview = useMemo(() => {
    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      return "Nearest hospital auto-selected when arriving on scene.";
    }
    const hospital = hospitals[0];
    const distance =
      typeof hospital.distance_km === "number"
        ? `${hospital.distance_km.toFixed(2)} km away`
        : "distance unavailable";
    return `${hospital.name} (${distance})`;
  }, [hospitals]);

  const advanceStep = () => {
    setStepIndex((prev) => (prev + 1) % DEMO_SEQUENCE.length);
  };

  const resetDemo = () => {
    setStepIndex(0);
  };

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Test / Demo</p>
        <div className="mt-1 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black text-gray-900">Response Mode Walkthrough</h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Use this scripted flow to show stakeholders how the live map, control
          workflow, and hospital assignment behave at each milestone.
        </p>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {DEMO_SEQUENCE.map((step, index) => (
            <span
              key={step.key}
              className={`rounded-full border px-3 py-1 transition ${
                index === stepIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {index + 1}. {statusLabel(step.key)}
            </span>
          ))}
        </div>

        <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current demo step
          </p>
          <h3 className="mt-1 text-2xl font-black text-gray-900">
            {currentStep.title}
          </h3>
          <p className="mt-2 text-sm text-gray-700">{currentStep.description}</p>

          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm">
            <div className="rounded-xl border border-white/80 bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Expected responder action
              </dt>
              <dd className="text-base font-semibold text-gray-900">
                {currentStep.action}
              </dd>
            </div>
            <div className="rounded-xl border border-white/80 bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Map emphasis
              </dt>
              <dd className="text-base font-semibold text-gray-900">
                {currentStep.mapFocus}
              </dd>
            </div>
          </dl>
        </article>

        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Live data preview
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>Incident:</strong> {incident?.type || "No active type"}
            </li>
            <li>
              <strong>Location:</strong> {incident?.location || "Unknown"}
            </li>
            <li>
              <strong>Suggested hospital:</strong> {destinationPreview}
            </li>
          </ul>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
        <div className="text-xs text-gray-500">
          Step {stepIndex + 1} of {DEMO_SEQUENCE.length} · {statusLabel(currentStep.key)}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-400"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
          <button
            type="button"
            onClick={advanceStep}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary/90"
          >
            <PlayCircle className="h-4 w-4" /> Advance
          </button>
        </div>
      </footer>
    </section>
  );
}
