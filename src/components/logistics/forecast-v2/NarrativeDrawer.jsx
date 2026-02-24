import { useState, memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/**
 * NarrativeDrawer
 * Progressive-disclosure summary of AI-generated forecast narrative.
 * - Collapsed: single-line verdict ("Healthy" / "X items at risk")
 * - Expanded: full narrative text + risk distribution breakdown
 */
const NarrativeDrawer = memo(function NarrativeDrawer({
  narrative,
  riskDistribution,
  isLoading,
}) {
  const [open, setOpen] = useState(false);

  // Derive a one-line "verdict" from riskDistribution data
  const highRiskCount =
    (riskDistribution?.high || 0) + (riskDistribution?.critical || 0);
  const isHealthy = highRiskCount === 0;

  const summaryText = isLoading
    ? "Analyzing…"
    : isHealthy
      ? "All items within safe stock levels"
      : `${highRiskCount} item${highRiskCount === 1 ? "" : "s"} at elevated risk`;

  return (
    <section
      aria-label="AI forecast narrative"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all"
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-slate-50/50 transition cursor-pointer"
        aria-expanded={open}
        aria-controls="narrative-body"
      >
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen
            className="h-4 w-4 text-violet-500 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate">
              Forecast Narrative
            </h3>
            <p className="flex items-center gap-1.5 text-xs mt-0.5">
              {isLoading ? (
                <span className="text-slate-400 animate-pulse">
                  {summaryText}
                </span>
              ) : isHealthy ? (
                <>
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span className="text-emerald-600 font-medium">
                    {summaryText}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-orange-500"
                    aria-hidden="true"
                  />
                  <span className="text-orange-600 font-medium">
                    {summaryText}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {open ? (
          <ChevronUp
            className="h-4 w-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Expanded body */}
      {open && (
        <div
          id="narrative-body"
          className="border-t border-slate-100 px-6 py-5 space-y-5 animate-in fade-in slide-in-from-top-1"
        >
          {/* Risk distribution grid */}
          {riskDistribution && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Risk Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    key: "low",
                    label: "Low",
                    color: "bg-emerald-100 text-emerald-700",
                    indicator: "●",
                  },
                  {
                    key: "medium",
                    label: "Medium",
                    color: "bg-amber-100 text-amber-700",
                    indicator: "▲",
                  },
                  {
                    key: "high",
                    label: "High",
                    color: "bg-orange-100 text-orange-700",
                    indicator: "◆",
                  },
                  {
                    key: "critical",
                    label: "Critical",
                    color: "bg-red-100 text-red-700",
                    indicator: "✦",
                  },
                ].map(({ key, label, color, indicator }) => (
                  <div
                    key={key}
                    className={`rounded-xl px-4 py-3 ${color}`}
                    role="status"
                    aria-label={`${label} risk: ${riskDistribution[key] || 0} items`}
                  >
                    <span className="block text-lg font-bold">
                      {indicator} {riskDistribution[key] || 0}
                    </span>
                    <span className="block text-xs font-medium opacity-75">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI narrative text */}
          {narrative ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                AI Summary
              </h4>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {typeof narrative === "string"
                  ? narrative
                  : narrative.narrative || narrative.text || "No narrative available."}
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-4 text-sm text-slate-400">
                No narrative data available. Run a forecast to generate one.
              </div>
            )
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </section>
  );
});

export default NarrativeDrawer;
