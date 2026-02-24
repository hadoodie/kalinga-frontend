import { memo } from "react";
import {
  AlertTriangle,
  FlaskConical,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CommandBar = memo(function CommandBar({
  criticalCount,
  totalPredictions,
  lastUpdated,
  isDemo,
  scenarioMode,
  onToggleScenario,
  onRefresh,
  loading,
}) {
  const isHealthy = criticalCount === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
        scenarioMode
          ? "border-violet-300 bg-gradient-to-r from-violet-50 via-white to-violet-50"
          : isHealthy
            ? "border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80"
            : "border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Forecast command bar. ${criticalCount} items need attention.`}
    >
      {/* Scenario mode banner */}
      {scenarioMode && (
        <div className="flex items-center gap-2 bg-violet-100 border-b border-violet-200 px-4 py-1.5 text-xs font-semibold text-violet-700">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span>SCENARIO MODE — Changes are simulated and not saved</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5">
        {/* Left: Status headline */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
              scenarioMode
                ? "bg-violet-100"
                : isHealthy
                  ? "bg-emerald-100"
                  : "bg-amber-100"
            }`}
            aria-hidden="true"
          >
            {scenarioMode ? (
              <FlaskConical className="h-6 w-6 text-violet-600" />
            ) : isHealthy ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {scenarioMode
                ? "What-If Scenario Active"
                : criticalCount === 0
                  ? "All supply levels are healthy"
                  : criticalCount === 1
                    ? "1 item needs your attention today"
                    : `${criticalCount} items need your attention today`}
            </h2>
            <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
              <span>
                {totalPredictions.toLocaleString()} predictions analyzed
              </span>
              {lastUpdated && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>
                    Updated{" "}
                    {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                  </span>
                </>
              )}
              {isDemo && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Sample data
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onToggleScenario}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              scenarioMode
                ? "bg-violet-600 text-white shadow-md hover:bg-violet-700"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={scenarioMode}
            aria-label={
              scenarioMode
                ? "Exit scenario mode"
                : "Enter what-if scenario mode"
            }
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            {scenarioMode ? "Exit Scenario" : "What If?"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            aria-label="Refresh forecast data"
          >
            {loading ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CommandBar;
