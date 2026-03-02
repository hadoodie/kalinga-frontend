import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Building2,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Package,
  Play,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { StatCard } from "../StatCard";
import forecastService from "../../../services/forecastService";
import {
  getDemoSummary,
  generateDemoRiskData,
  generateDemoDemandData,
} from "../../logistics/demoForecastData";

// ── Data helpers ─────────────────────────────────────────────

/**
 * Normalize risk items to always have flat hospital_name / resource_name /
 * resource_category — handles both the live API (flat) and demo data (nested)
 * object shapes.
 */
const normalizeRiskItems = (items = []) =>
  items.map((item) => ({
    ...item,
    hospital_name:
      item.hospital_name || item.hospital?.name || `Hospital ${item.hospital_id}`,
    resource_name:
      item.resource_name || item.resource?.name || `Resource ${item.resource_id}`,
    resource_category:
      item.resource_category || item.resource?.category || "",
  }));

/**
 * Normalize a raw summary payload so the component always works with the same
 * field names regardless of whether data came from the live API or getDemoSummary.
 */
const normalizeSummary = (s) => {
  if (!s) return s;
  return {
    ...s,
    high_risk_items: normalizeRiskItems(s.high_risk_items || []),
    top_demand:
      s.top_demand ??
      (s.demand_by_resource || []).map((d) => ({
        resource_id: d.resource_id,
        total_demand: d.avg_demand ?? d.total_demand ?? 0,
        resource: d.resource ?? { name: d.category ?? "Unknown", unit: "units" },
      })),
  };
};

// ── Helpers ──────────────────────────────────────────────────

const RISK_TONES = {
  critical: {
    bg: "bg-rose-100 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  high: {
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  low: {
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

function riskTone(level) {
  return RISK_TONES[level] || RISK_TONES.low;
}

function unwrapData(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  return fallback;
}

// ── Sub-components ───────────────────────────────────────────

/** Compact risk-distribution bar (horizontal stacked) */
const RiskBar = ({ distribution }) => {
  const levels = ["critical", "high", "medium", "low"];
  const total = levels.reduce((s, l) => s + (distribution[l] || 0), 0);
  if (!total) return <span className="text-xs text-foreground/50">No data</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-foreground/5">
        {levels.map((l) => {
          const count = distribution[l] || 0;
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={l}
              className={riskTone(l).dot}
              style={{ width: `${pct}%` }}
              title={`${l}: ${count}`}
            />
          );
        })}
      </div>
      <span className="text-xs font-medium text-foreground/60 tabular-nums">
        {total}
      </span>
    </div>
  );
};

/** High-risk items table */
const RiskTable = ({ items = [] }) => {
  if (!items.length)
    return (
      <p className="py-8 text-center text-sm text-foreground/50">
        No high-risk items detected in this forecast window.
      </p>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 text-left text-xs font-medium uppercase text-foreground/50">
            <th className="pb-2 pr-4">Hospital</th>
            <th className="pb-2 pr-4">Resource</th>
            <th className="pb-2 pr-4">Category</th>
            <th className="pb-2 pr-4 text-right">Risk %</th>
            <th className="pb-2 pr-4 text-right">Stockout (d)</th>
            <th className="pb-2 text-center">Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {items.slice(0, 15).map((item, i) => {
            const tone = riskTone(item.risk_level);
            return (
              <tr key={i} className="group hover:bg-foreground/[0.02]">
                <td className="py-2.5 pr-4 font-medium text-foreground">
                  {item.hospital_name}
                </td>
                <td className="py-2.5 pr-4 text-foreground/80">
                  {item.resource_name}
                </td>
                <td className="py-2.5 pr-4 text-foreground/60">
                  {item.resource_category}
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {(Number(item.risk_prob) * 100).toFixed(0)}%
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-foreground/70">
                  {item.days_until_stockout != null
                    ? Number(item.days_until_stockout).toFixed(1)
                    : "—"}
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text}`}
                  >
                    {item.risk_level}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Top demand resources list */
const DemandList = ({ items = [] }) => {
  if (!items.length)
    return (
      <p className="py-6 text-center text-sm text-foreground/50">
        No demand data available.
      </p>
    );

  const maxDemand = Math.max(...items.map((d) => Number(d.total_demand) || 0), 1);

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((d, i) => {
        const demand = Number(d.total_demand) || 0;
        const pct = (demand / maxDemand) * 100;
        const res = d.resource || {};
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {res.name || `Resource #${d.resource_id}`}
              </span>
              <span className="tabular-nums text-foreground/70">
                {demand.toLocaleString()} {res.unit || "units"}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Narrative panel */
const NarrativePanel = ({ narrative, isLoading }) => {
  if (isLoading)
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-foreground/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Generating AI
        narrative…
      </div>
    );

  if (!narrative?.narrative && !narrative?.text)
    return (
      <p className="py-6 text-sm text-foreground/50">
        No AI narrative available. Run the forecast pipeline first.
      </p>
    );

  const text = narrative.narrative || narrative.text || "";

  return (
    <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert whitespace-pre-line leading-relaxed">
      {text}
    </div>
  );
};

/** Hospital filter dropdown */
const HospitalFilter = ({ hospitals, selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  const label = selected
    ? hospitals.find((h) => String(h.id) === String(selected))?.name || "Unknown"
    : "All Hospitals";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40"
      >
        <Building2 className="h-4 w-4 text-foreground/60" />
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-foreground/40" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border/60 bg-card shadow-xl">
            <div className="max-h-64 overflow-y-auto p-1">
              <button
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-foreground/5 ${
                  !selected ? "bg-primary/10 font-semibold text-primary" : "text-foreground/80"
                }`}
              >
                All Hospitals (National)
              </button>
              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    onSelect(h.id);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-foreground/5 ${
                    String(selected) === String(h.id)
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground/80"
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Section Component ───────────────────────────────────

export const LogisticsForecastSection = () => {
  // Data
  const [summary, setSummary] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Pipeline trigger
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);

  // Hospital filter
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // ── Fetch hospital list (once) ─────────────────────────────
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const { default: api } = await import("../../../services/api");
        const res = await api.get("/hospitals");
        const data = res.data?.data || res.data || [];
        setHospitals(Array.isArray(data) ? data : []);
      } catch {
        setHospitals([]);
      }
    };
    fetchHospitals();
  }, []);

  // ── Fetch forecast data ────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = selectedHospital ? { hospital_id: selectedHospital } : {};

      const [summaryRes, narrativeRes] = await Promise.allSettled([
        forecastService.getSummary(params),
        forecastService.getNarrative(params),
      ]);

      const summaryVal =
        summaryRes.status === "fulfilled" ? summaryRes.value : null;

      // Detect real data
      const distObj = summaryVal?.risk_distribution;
      const hasDistribution =
        distObj &&
        !Array.isArray(distObj) &&
        typeof distObj === "object" &&
        Object.keys(distObj).length > 0;
      const hasRealData =
        summaryVal &&
        (summaryVal.high_risk_items?.length > 0 ||
          hasDistribution ||
          summaryVal.meta?.generated_at != null);

      if (hasRealData) {
        setSummary(normalizeSummary(summaryVal));
        setNarrative(
          narrativeRes.status === "fulfilled" ? narrativeRes.value : null,
        );
        setIsDemo(false);
      } else {
        setSummary(normalizeSummary(getDemoSummary()));
        setNarrative(null);
        setIsDemo(true);
        setFetchError(
          summaryVal
            ? "No forecast data in database yet — showing sample data."
            : "Could not reach forecast API — showing sample data.",
        );
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("[LogisticsForecastSection] fetch error:", err);
      setSummary(normalizeSummary(getDemoSummary()));
      setNarrative(null);
      setIsDemo(true);
      setFetchError(err?.message || "Network error");
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [selectedHospital]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Pipeline trigger ───────────────────────────────────────
  const handleTrigger = useCallback(async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await forecastService.triggerRun({ mode: "production" });
      setTriggerMsg(res?.message || "Pipeline triggered — results ready in ~60s.");
      // Auto-refresh after the pipeline has had time to write results
      setTimeout(() => fetchAll(), 65_000);
    } catch {
      setTriggerMsg("Failed to trigger pipeline. Is the queue worker running?");
    } finally {
      setTriggering(false);
    }
  }, [fetchAll]);

  // ── Derived stats ──────────────────────────────────────────
  const riskDist = summary?.risk_distribution || {};
  const totalItems =
    (riskDist.critical || 0) +
    (riskDist.high || 0) +
    (riskDist.medium || 0) +
    (riskDist.low || 0);
  const criticalCount = riskDist.critical || 0;
  const highCount = riskDist.high || 0;
  const highRiskItems = summary?.high_risk_items || [];
  const topDemand = summary?.top_demand || [];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="AI Logistics Forecast"
        description="Predictive demand analytics and supply-risk intelligence across all facilities."
        actions={
          <div className="flex items-center gap-3">
            <HospitalFilter
              hospitals={hospitals}
              selected={selectedHospital}
              onSelect={setSelectedHospital}
            />
            <button
              onClick={handleTrigger}
              disabled={triggering || isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
              title="Manually run the AI forecast pipeline"
            >
              {triggering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {triggering ? "Running…" : "Run Pipeline"}
            </button>
            <button
              onClick={fetchAll}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        }
      />

      {/* Trigger result banner */}
      {triggerMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-300/60 bg-violet-50 px-4 py-2.5 text-sm text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {triggerMsg}
        </div>
      )}

      {/* Error / demo banner */}
      {fetchError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {isDemo && <strong className="mr-1">Demo Mode:</strong>}
          {fetchError}
        </div>
      )}

      {/* Loading spinner */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/30" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Package}
              label="Total Tracked Items"
              value={totalItems}
              tone="primary"
            />
            <StatCard
              icon={ShieldAlert}
              label="Critical Risk"
              value={criticalCount}
              tone="danger"
              change={
                criticalCount > 0
                  ? `${criticalCount} need reorder`
                  : undefined
              }
              trend="up"
            />
            <StatCard
              icon={AlertTriangle}
              label="High Risk"
              value={highCount}
              tone="warning"
            />
            <StatCard
              icon={Activity}
              label="Pipeline Status"
              value={summary?.meta?.generated_at ? "Active" : "Pending"}
              tone={summary?.meta?.generated_at ? "success" : "neutral"}
            />
          </div>

          {/* Risk distribution bar */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground/70">
              Risk Distribution
            </h3>
            <RiskBar distribution={riskDist} />
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-foreground/60">
              {["critical", "high", "medium", "low"].map((l) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${riskTone(l).dot}`}
                  />
                  {l.charAt(0).toUpperCase() + l.slice(1)}: {riskDist[l] || 0}
                </span>
              ))}
            </div>
          </div>

          {/* Two-column: risk table + demand ranking */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Risk table (2/3) */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70">
                  High-Risk Items
                </h3>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {highRiskItems.length} items
                </span>
              </div>
              <RiskTable items={highRiskItems} />
            </div>

            {/* Demand ranking (1/3) */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground/70">
                Top Demand (48h)
              </h3>
              <DemandList items={topDemand} />
            </div>
          </div>

          {/* AI Narrative */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-500" />
              <h3 className="text-sm font-semibold text-foreground/70">
                AI Executive Summary
              </h3>
              {narrative?.source && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  {narrative.source === "gemini"
                    ? "Gemini 2.0"
                    : "Rule-based"}
                </span>
              )}
            </div>
            <NarrativePanel
              narrative={narrative}
              isLoading={narrativeLoading}
            />
          </div>

          {/* Footer metadata */}
          {lastRefresh && (
            <p className="text-center text-xs text-foreground/40">
              Last refreshed:{" "}
              {lastRefresh.toLocaleTimeString()} ·{" "}
              Horizon: {summary?.meta?.horizon_hours || 48}h ·{" "}
              {selectedHospital
                ? hospitals.find((h) => String(h.id) === String(selectedHospital))?.name || "Selected Hospital"
                : "National View"}
            </p>
          )}
        </>
      )}
    </div>
  );
};
