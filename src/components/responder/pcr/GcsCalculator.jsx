import React from "react";

const SECTION_STYLES = "grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2";
const OPTION_STYLES = (active) =>
  `min-h-[42px] min-w-[72px] rounded-2xl border px-3 py-2 text-center text-sm font-semibold transition ${
    active
      ? "border-emerald-700 bg-emerald-100 text-emerald-900"
      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
  }`;

const rows = [
  {
    label: "Eyes",
    field: "eyes",
    options: [
      { value: 4, label: "Spontaneous" },
      { value: 3, label: "To Voice" },
      { value: 2, label: "To Pain" },
      { value: 1, label: "None" },
    ],
  },
  {
    label: "Verbal",
    field: "verbal",
    options: [
      { value: 5, label: "Oriented" },
      { value: 4, label: "Confused" },
      { value: 3, label: "Inappropriate" },
      { value: 2, label: "Incomprehensible" },
      { value: 1, label: "None" },
    ],
  },
  {
    label: "Motor",
    field: "motor",
    options: [
      { value: 6, label: "Obeys" },
      { value: 5, label: "Localizes" },
      { value: 4, label: "Withdraws" },
      { value: 3, label: "Flexion" },
      { value: 2, label: "Extension" },
      { value: 1, label: "None" },
    ],
  },
];

export default function GcsCalculator({ value = { eyes: 4, verbal: 5, motor: 6 }, onChange, disabled }) {
  const total = Number(value.eyes || 0) + Number(value.verbal || 0) + Number(value.motor || 0);

  const update = (field, next) => {
    onChange?.({ ...value, [field]: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Glasgow Coma Scale</p>
          <p className="text-base font-semibold text-slate-900">Total Score</p>
        </div>
        <div className="inline-flex min-w-[3rem] items-center justify-center rounded-3xl bg-emerald-700 px-3 py-2 text-2xl font-bold text-white">
          {total || 0}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.field} className={SECTION_STYLES}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {row.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              {row.options.map((option) => {
                const active = Number(value[row.field]) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !disabled && update(row.field, option.value)}
                    className={OPTION_STYLES(active)}
                    disabled={disabled}
                  >
                    <div>{option.value}</div>
                    <div className="text-[11px] leading-snug text-slate-600">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
