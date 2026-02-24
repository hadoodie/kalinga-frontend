import { useState, useEffect, useCallback, memo } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import forecastService from "../../../services/forecastService";

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Healthy",
  },
  stale: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "Stale",
  },
  no_data: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "No Data",
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return "never";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PipelineHealthBar = memo(function PipelineHealthBar({ onRefreshData }) {
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const [h, hist] = await Promise.allSettled([
        forecastService.getHealth(),
        forecastService.getHistory({ limit: 5 }),
      ]);
      if (h.status === "fulfilled") setHealth(h.value);
      if (hist.status === "fulfilled") setHistory(hist.value?.data || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 120_000); // refresh every 2min
    return () => clearInterval(id);
  }, [fetchHealth]);

  const handleTrigger = useCallback(async () => {
    setTriggerLoading(true);
    setTriggerMsg(null);
    try {
      const res = await forecastService.triggerRun({ mode: "production" });
      setTriggerMsg(res?.message || "Pipeline queued");
      // Refresh health after a short delay
      setTimeout(() => {
        fetchHealth();
        onRefreshData?.();
      }, 5000);
    } catch (err) {
      setTriggerMsg(
        err?.response?.data?.error || err?.message || "Trigger failed",
      );
    } finally {
      setTriggerLoading(false);
    }
  }, [fetchHealth, onRefreshData]);

  if (!health) return null;

  const cfg = STATUS_CONFIG[health.status] || STATUS_CONFIG.no_data;
  const StatusIcon = cfg.icon;

  return (
    <section className={`rounded-2xl border shadow-sm overflow-hidden ${cfg.bg}`}>
      {/* Compact bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-800">
            Pipeline Status
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}
          >
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="hidden sm:inline">
            <Clock className="inline h-3 w-3 mr-0.5" />
            Last run {timeAgo(health.last_run)}
          </span>
          <span className="hidden sm:inline">
            <Database className="inline h-3 w-3 mr-0.5" />
            {((health.demand_rows || 0) + (health.risk_rows || 0)).toLocaleString()} rows
          </span>
          <span className="font-mono">{health.model_version}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-200/50 px-5 py-4 bg-white/60 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <StatCell label="Demand Rows" value={(health.demand_rows || 0).toLocaleString()} />
            <StatCell label="Risk Rows" value={(health.risk_rows || 0).toLocaleString()} />
            <StatCell label="Model Version" value={health.model_version || "—"} />
            <StatCell
              label="Last Run"
              value={
                health.last_run
                  ? new Date(health.last_run).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"
              }
            />
          </div>

          {/* Recent runs */}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Recent Runs
              </p>
              <div className="space-y-1.5">
                {history.map((run, i) => (
                  <div
                    key={run.generated_at || i}
                    className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-600">
                      {new Date(run.generated_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-slate-400">
                      {run.demand_rows}d / {run.risk_rows}r
                    </span>
                    <span className="text-slate-400">
                      {run.hospitals}H × {run.resources}R
                    </span>
                    {run.high_risk > 0 && (
                      <span className="text-red-600 font-semibold">
                        {run.high_risk} high risk
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTrigger}
              disabled={triggerLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {triggerLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run Pipeline Now
            </button>
            <button
              type="button"
              onClick={fetchHealth}
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            {triggerMsg && (
              <span className="text-xs text-slate-500">{triggerMsg}</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

function StatCell({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}

export default PipelineHealthBar;
