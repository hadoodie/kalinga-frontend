import React from "react";
import { RotateCcw } from "lucide-react";

export default function TimeLogButton({
  label,
  isoValue,
  onLogNow,
  onUndo,
  isUndoable = false,
}) {
  if (isoValue) {
    const display = new Date(isoValue).toLocaleString();
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {label}
          </p>
          <p className="text-sm font-semibold text-emerald-900">{display}</p>
        </div>
        {isUndoable ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 px-2 py-1 text-xs font-semibold text-emerald-800"
            onClick={onUndo}
          >
            <RotateCcw size={14} /> Undo
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogNow}
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
