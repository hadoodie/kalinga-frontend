import React from "react";

export default function ToggleChipGroup({
  label,
  options,
  value,
  onChange,
  multiple = false,
  otherInputValue,
  onOtherInputChange,
  otherPlaceholder = "Please specify",
}) {
  const normalized = multiple ? (Array.isArray(value) ? value : []) : value;

  const handleClick = (option) => {
    if (multiple) {
      const exists = normalized.includes(option);
      const next = exists
        ? normalized.filter((item) => item !== option)
        : [...normalized, option];
      onChange(next);

      if (option === "Others" && exists) {
        onOtherInputChange?.("");
      }
      return;
    }

    onChange(option);
    if (option !== "Others") {
      onOtherInputChange?.("");
    }
  };

  const isActive = (option) =>
    multiple ? normalized.includes(option) : normalized === option;

  const activeOthers = multiple
    ? normalized.includes("Others")
    : normalized === "Others";

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-semibold text-slate-700">{label}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleClick(option)}
            className={`min-h-12 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive(option)
                ? "border-emerald-700 bg-emerald-100 text-emerald-900"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {activeOthers ? (
        <input
          className="w-full rounded-lg border p-3"
          type="text"
          placeholder={otherPlaceholder}
          value={otherInputValue || ""}
          onChange={(event) => onOtherInputChange?.(event.target.value)}
        />
      ) : null}
    </div>
  );
}
