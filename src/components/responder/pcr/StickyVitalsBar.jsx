import React from "react";

export default function StickyVitalsBar({ payload, onSnapshot, disabled }) {
  const reading = payload?.reading || {};

  return (
    <div className="sticky bottom-2 z-30 rounded-2xl border border-sky-300 bg-sky-50/95 p-3 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-900 md:text-sm">
        <span className="rounded-full bg-white px-2 py-1">Live Sensor</span>
        <span className="rounded-full bg-white px-2 py-1">
          Temp: {reading.temperature ?? "--"} C
        </span>
        <span className="rounded-full bg-white px-2 py-1">SpO2: {reading.spo2 ?? "--"}</span>
        <span className="rounded-full bg-white px-2 py-1">Pulse: {reading.pulse ?? "--"}</span>
        <span className="rounded-full bg-white px-2 py-1">RR: {reading.rr ?? "--"}</span>
        <span className="rounded-full bg-white px-2 py-1">BP: {reading.bp ?? "--"}</span>
        <button
          type="button"
          className="ml-auto min-h-12 rounded-xl bg-sky-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSnapshot}
          disabled={disabled}
        >
          Snapshot to Vitals Grid
        </button>
      </div>
    </div>
  );
}
