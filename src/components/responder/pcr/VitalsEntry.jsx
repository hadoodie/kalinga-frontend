import React, { useEffect, useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import InteractiveGCS from "./InteractiveGCS";
import TimeLogButton from "./TimeLogButton";

export default function VitalsEntry({
  index,
  value,
  onChange,
  onRemove,
  onFieldFocus,
  onFieldBlur,
}) {
  const [row, setRow] = useState(
    value || {
      time: "",
      bp: "",
      temp: "",
      rr: "",
      spo2: "",
      pulse: "",
      gcs: { eyes: 4, verbal: 5, motor: 6 },
      source: "manual",
    }
  );

  useEffect(() => {
    setRow(
      value || {
        time: "",
        bp: "",
        temp: "",
        rr: "",
        spo2: "",
        pulse: "",
        gcs: { eyes: 4, verbal: 5, motor: 6 },
        source: "manual",
      }
    );
  }, [value]);

  const updateRow = (next) => {
    setRow(next);
    onChange?.(next);
  };

  const handleInput = (key, next) => {
    updateRow({ ...row, [key]: next });
  };

  const logVitalsNow = () => {
    const time = new Date().toISOString();
    updateRow({ ...row, time });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Vitals Entry {index + 1}</p>
          <p className="text-xs text-slate-500">Tap "Log Time" to record the current vitals timestamp.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <TimeLogButton
            label={row.time ? "Vitals Time" : "Log Time"}
            isoValue={row.time || null}
            onLogNow={logVitalsNow}
            onUndo={() => updateRow({ ...row, time: "" })}
            isUndoable={Boolean(row.time)}
          />
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="min-h-[48px] rounded-2xl border border-rose-600 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Time</label>
          <div className="mt-2 min-h-[32px] text-sm font-semibold text-slate-900">
            {row.time ? new Date(row.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not logged"}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">BP</label>
          <input
            className="mt-2 w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none"
            value={row.bp}
            onChange={(event) => handleInput("bp", event.target.value)}
            onFocus={() => onFieldFocus?.(`vitals.${index}.bp`)}
            onBlur={() => onFieldBlur?.()}
            placeholder="120/80"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Temp</label>
          <input
            className="mt-2 w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none"
            value={row.temp}
            onChange={(event) => handleInput("temp", event.target.value)}
            onFocus={() => onFieldFocus?.(`vitals.${index}.temp`)}
            onBlur={() => onFieldBlur?.()}
            placeholder="°C"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">RR</label>
          <input
            className="mt-2 w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none"
            value={row.rr}
            onChange={(event) => handleInput("rr", event.target.value)}
            onFocus={() => onFieldFocus?.(`vitals.${index}.rr`)}
            onBlur={() => onFieldBlur?.()}
            placeholder="bpm"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">SpO2</label>
          <input
            className="mt-2 w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none"
            value={row.spo2}
            onChange={(event) => handleInput("spo2", event.target.value)}
            onFocus={() => onFieldFocus?.(`vitals.${index}.spo2`)}
            onBlur={() => onFieldBlur?.()}
            placeholder="%"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pulse</label>
          <input
            className="mt-2 w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none"
            value={row.pulse}
            onChange={(event) => handleInput("pulse", event.target.value)}
            onFocus={() => onFieldFocus?.(`vitals.${index}.pulse`)}
            onBlur={() => onFieldBlur?.()}
            placeholder="bpm"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Source</label>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-900">
            <ChevronRight size={16} />
            <span>{row.source || "manual"}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <InteractiveGCS value={row.gcs} onChange={(nextGcs) => handleInput("gcs", nextGcs)} />
      </div>
    </div>
  );
}
