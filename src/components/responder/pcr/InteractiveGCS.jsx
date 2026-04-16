import React, { useMemo } from "react";

const SCORE_COLUMNS = [6, 5, 4, 3, 2, 1];

const ROWS = [
  {
    label: "Eyes Opening Response",
    field: "eyes",
    options: [
      { score: 4, label: "Spontaneous" },
      { score: 3, label: "To Verbal" },
      { score: 2, label: "To Pain" },
      { score: 1, label: "None" },
    ],
  },
  {
    label: "Verbal Response",
    field: "verbal",
    options: [
      { score: 5, label: "Oriented" },
      { score: 4, label: "Confused" },
      { score: 3, label: "Inappropriate" },
      { score: 2, label: "Incomprehensible" },
      { score: 1, label: "None" },
    ],
  },
  {
    label: "Motor Response",
    field: "motor",
    options: [
      { score: 6, label: "Obeys" },
      { score: 5, label: "Localizes" },
      { score: 4, label: "Withdraws" },
      { score: 3, label: "Flexion" },
      { score: 2, label: "Extension" },
      { score: 1, label: "None" },
    ],
  },
];

const getOption = (row, score) => row.options.find((option) => option.score === score);

export default function InteractiveGCS({ value = { eyes: 4, verbal: 5, motor: 6 }, onChange }) {
  const selected = useMemo(
    () => ({
      eyes: Number(value.eyes || 0),
      verbal: Number(value.verbal || 0),
      motor: Number(value.motor || 0),
    }),
    [value]
  );

  const total = selected.eyes + selected.verbal + selected.motor;

  const handleSelect = (field, score) => {
    if (!score) return;
    onChange?.({ ...value, [field]: score });
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-300 bg-white shadow-sm">
      <div className="grid grid-cols-[180px_repeat(6,minmax(80px,1fr))] gap-px bg-slate-200 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
        <div className="bg-slate-100 p-3 text-left">Response</div>
        {SCORE_COLUMNS.map((score) => (
          <div key={score} className="bg-slate-100 p-3">
            {score}
          </div>
        ))}
      </div>

      {ROWS.map((row) => (
        <div key={row.field} className="grid grid-cols-[180px_repeat(6,minmax(80px,1fr))] gap-px">
          <div className="bg-slate-50 p-3 text-xs font-semibold text-slate-800">{row.label}</div>
          {SCORE_COLUMNS.map((score) => {
            const option = getOption(row, score);
            const active = selected[row.field] === score;
            return (
              <button
                key={score}
                type="button"
                disabled={!option}
                onClick={() => handleSelect(row.field, score)}
                className={`min-h-[48px] rounded-none border-none p-3 text-left text-[11px] transition ${
                  option
                    ? active
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                {option?.label ?? ""}
              </button>
            );
          })}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-600">Total Score</div>
        <div className="min-h-[48px] min-w-[72px] rounded-2xl bg-emerald-700 px-4 py-3 text-center text-2xl font-bold text-white">
          {total || 0}
        </div>
      </div>
    </div>
  );
}
