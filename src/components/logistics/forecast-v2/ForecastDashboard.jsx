import { useState, useEffect, useCallback, useMemo } from "react";
import { BrainCircuit, Loader2, TrendingUp, ShieldAlert, BarChart3 } from "lucide-react";
import forecastService from "../../../services/forecastService";
import api from "../../../services/api";
import {
  getDemoSummary,
  generateDemoRiskData,
  generateDemoDemandData,
  DEMO_HIGH_RISK_ITEMS,
  DEMO_RISK_DISTRIBUTION,
  DEMO_TOTAL_PREDICTIONS,
} from "../demoForecastData";

import CommandBar from "./CommandBar";
import TriagePanel from "./TriagePanel";
import TimelineCanvas from "./TimelineCanvas";
import ScenarioSandbox from "./ScenarioSandbox";
import RiskHeatmapV2 from "./RiskHeatmapV2";
import NarrativeDrawer from "./NarrativeDrawer";
import ActionSlideOver from "./ActionSlideOver";

// ── Loading screen with animated forecast visuals ────────────
function ForecastLoadingScreen() {
  const steps = [
    { icon: BrainCircuit, label: "Connecting to forecast engine", color: "text-violet-500" },
    { icon: TrendingUp, label: "Analyzing demand patterns", color: "text-blue-500" },
    { icon: ShieldAlert, label: "Evaluating supply risk", color: "text-amber-500" },
    { icon: BarChart3, label: "Building dashboard", color: "text-emerald-500" },
  ];

  return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-label="Loading AI forecast dashboard">
      <div className="text-center max-w-sm">
        {/* Animated icon ring */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
          {/* Inner pulsing icon */}
          <div className="absolute inset-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-violet-50">
            <BrainCircuit className="h-10 w-10 text-blue-600 animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">Loading AI Forecast</h3>
        <p className="text-sm text-slate-400 mb-6">Crunching 48-hour predictions across all facilities</p>

        {/* Step indicators */}
        <div className="space-y-3 text-left">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 px-4 py-2.5 shadow-sm animate-pulse"
              style={{ animationDelay: `${i * 200}ms`, animationDuration: "1.5s" }}
            >
              <step.icon className={`h-4 w-4 shrink-0 ${step.color}`} />
              <span className="text-sm text-slate-600">{step.label}</span>
              <Loader2 className="h-3.5 w-3.5 ml-auto text-slate-300 animate-spin" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Unwrap an API response that may be:
 *  - { data: [...] }              → array from Laravel resource
 *  - { data: [...], meta: {...} } → paginated / wrapped
 *  - [...]                        → raw array
 *  - other                        → fallback
 */
function unwrapData(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  return fallback;
}

/**
 * ForecastDashboard — root orchestrator for the v2 forecast UI.
 */
export default function ForecastDashboard() {
  // ── Data state ─────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [riskData, setRiskData] = useState([]);
  const [demandData, setDemandData] = useState([]);
  const [narrative, setNarrative] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // ── Scenario state ─────────────────────────────────────────
  const [delayDays, setDelayDays] = useState(0);
  const [demandMultiplier, setDemandMultiplier] = useState(1);

  // ── Action slide-over state ────────────────────────────────
  const [slideOver, setSlideOver] = useState(null);

  // ── Fetch all data ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [summaryRes, riskRes, demandRes, narrativeRes] =
        await Promise.allSettled([
          forecastService.getSummary(),
          forecastService.getRiskForecasts(),
          forecastService.getDemandForecasts(),
          forecastService.getNarrative(),
        ]);

      // Summary has a different shape: { high_risk_items, risk_distribution, ... }
      const summaryVal = summaryRes.status === "fulfilled" ? summaryRes.value : null;

      // Detect whether the API returned actual forecast data.
      // When the DB is empty the summary endpoint returns risk_distribution
      // as [] (empty array) and generated_at as null — both are falsy traps.
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
          (summaryVal.meta?.generated_at != null));

      if (hasRealData) {
        setSummary(summaryVal);
        setRiskData(unwrapData(
          riskRes.status === "fulfilled" ? riskRes.value : null,
          [],
        ));
        setDemandData(unwrapData(
          demandRes.status === "fulfilled" ? demandRes.value : null,
          [],
        ));
        setNarrative(
          narrativeRes.status === "fulfilled" ? narrativeRes.value : null,
        );
        setIsDemo(false);
      } else {
        // Fall back to demo data
        setSummary(getDemoSummary());
        setRiskData(generateDemoRiskData());
        setDemandData(generateDemoDemandData());
        setNarrative(null);
        setIsDemo(true);
        if (!summaryVal) {
          setFetchError("Could not reach forecast API — showing sample data");
        }
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[ForecastDashboard] fetch failed:", err);
      setSummary(getDemoSummary());
      setRiskData(generateDemoRiskData());
      setDemandData(generateDemoDemandData());
      setNarrative(null);
      setIsDemo(true);
      setFetchError(err?.message || "Network error");
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived: triage items sorted by urgency ────────────────
  const triageItems = useMemo(() => {
    const highRisk = summary?.high_risk_items || DEMO_HIGH_RISK_ITEMS;
    return [...highRisk]
      .map((item) => ({
        ...item,
        urgencyScore: forecastService.getUrgencyScore(item),
        hospital_name:
          item.hospital?.name || item.hospital_name || `Hospital ${item.hospital_id}`,
        resource_name:
          item.resource?.name || item.resource_name || `Resource ${item.resource_id}`,
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [summary]);

  // ── Derived: scenario-adjusted demand ──────────────────────
  const adjustedDemand = useMemo(() => {
    if (demandMultiplier === 1 && delayDays === 0) return demandData;
    return demandData.map((d) => ({
      ...d,
      yhat: (Number(d.yhat) || 0) * demandMultiplier,
      yhat_lower: (Number(d.yhat_lower) || 0) * demandMultiplier,
      yhat_upper: (Number(d.yhat_upper) || 0) * demandMultiplier,
    }));
  }, [demandData, demandMultiplier, delayDays]);

  // ── Derived: risk distribution ─────────────────────────────
  const riskDistribution = useMemo(() => {
    const dist = summary?.risk_distribution;
    if (!dist || (typeof dist === "object" && Object.keys(dist).length === 0)) {
      return DEMO_RISK_DISTRIBUTION;
    }
    return dist;
  }, [summary]);

  // ── Derived: headline for CommandBar ───────────────────────
  const criticalCount = useMemo(
    () => triageItems.filter((i) => i.urgencyScore >= 70).length,
    [triageItems],
  );

  // ── Derived: total predictions count ────────────────────────
  const totalPredictions = useMemo(() => {
    const dist = riskDistribution;
    if (dist && typeof dist === "object") {
      const sum = Object.values(dist).reduce((a, b) => a + Number(b || 0), 0);
      if (sum > 0) return sum;
    }
    return DEMO_TOTAL_PREDICTIONS;
  }, [riskDistribution]);

  // ── Derived: scenario mode + params ────────────────────────
  const scenarioMode = delayDays > 0 || demandMultiplier !== 1;
  const scenarioParams = useMemo(
    () => ({ deliveryDelayDays: delayDays, demandMultiplier }),
    [delayDays, demandMultiplier],
  );
  const originalStockoutDays = useMemo(() => {
    const mins = triageItems
      .map((i) => i.days_until_stockout)
      .filter((d) => d != null && d < 999);
    return mins.length > 0 ? Math.min(...mins) : null;
  }, [triageItems]);

  // ── Action handlers ────────────────────────────────────────
  const handleDraftPO = useCallback(
    (item) => setSlideOver({ item, actionType: "po" }),
    [],
  );
  const handleTransfer = useCallback(
    (item) => setSlideOver({ item, actionType: "transfer" }),
    [],
  );
  const handleCellClick = useCallback(
    (cell) => setSlideOver({ item: cell, actionType: "po" }),
    [],
  );

  const handleActionSubmit = useCallback(async (payload) => {
    // POST to create a real Request record in the backend
    const { item, actionType, quantity, priority, notes } = payload;
    const urgencyMap = { normal: "Medium", urgent: "High", emergency: "Critical" };

    const requestData = {
      hospital_id: item.hospital_id,
      resource_id: item.resource_id,
      resource_name: item.resource_name || item.resource?.name || "Unknown",
      quantity: quantity,
      urgency_level: urgencyMap[priority] || "High",
      handling_class: "General",
      reason: `AI Forecast ${actionType === "po" ? "Purchase Order" : "Transfer"}: ${notes || `Risk ${Math.round((item.risk_prob || 0) * 100)}%, ${Math.round(item.days_until_stockout || 0)}d until stockout`}`,
      status: "pending",
      meta: {
        source: actionType === "po" ? "ai_purchase_order" : "ai_transfer_request",
        risk_prob: item.risk_prob,
        risk_level: item.risk_level,
        days_until_stockout: item.days_until_stockout,
        projected_stock: item.projected_stock,
        scenario_delay_days: delayDays,
        demand_multiplier: demandMultiplier,
      },
    };

    const response = await api.post("/requests", requestData);
    return response.data;
  }, [delayDays, demandMultiplier]);

  // ── Render ─────────────────────────────────────────────────
  if (isLoading && !summary) {
    return <ForecastLoadingScreen />;
  }

  return (
    <div className="space-y-5">
      {/* Layer 0: Command Bar */}
      <CommandBar
        criticalCount={criticalCount}
        totalPredictions={totalPredictions}
        lastUpdated={lastRefresh}
        isDemo={isDemo}
        scenarioMode={scenarioMode}
        onToggleScenario={() => {
          if (scenarioMode) {
            setDelayDays(0);
            setDemandMultiplier(1);
          }
        }}
        onRefresh={fetchAll}
        loading={isLoading}
      />

      {/* API error banner */}
      {fetchError && isDemo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <span className="font-medium">Note:</span> {fetchError}
        </div>
      )}

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Predictions</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalPredictions.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-0.5">{isDemo ? "sample data" : "live from API"}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Critical + High</p>
          <p className="text-2xl font-black text-red-600 mt-1">
            {(Number(riskDistribution.critical) || 0) + (Number(riskDistribution.high) || 0)}
          </p>
          <p className="text-xs text-red-400 mt-0.5">need attention</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Low Risk</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{(Number(riskDistribution.low) || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-0.5">within safe levels</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Earliest Stockout</p>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {originalStockoutDays != null
              ? `${originalStockoutDays < 1 ? "<1" : originalStockoutDays.toFixed(1)}d`
              : "Safe"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{originalStockoutDays != null && originalStockoutDays < 3 ? "⚠ imminent" : "no imminent risk"}</p>
        </div>
      </div>

      {/* Layer 1: Triage + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <TriagePanel
            items={triageItems}
            scenarioMode={scenarioMode}
            scenarioParams={scenarioParams}
            onResolve={(item, type) => {
              if (type === "purchase_order") handleDraftPO(item);
              else handleTransfer(item);
            }}
            onSelect={(item) =>
              setSlideOver({ item, actionType: "po" })
            }
          />
        </div>
        <div className="lg:col-span-3">
          <TimelineCanvas demandData={adjustedDemand} scenarioMode={scenarioMode} />
        </div>
      </div>

      {/* Layer 2: Scenario + Risk Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <ScenarioSandbox
            params={scenarioParams}
            onChange={(newParams) => {
              setDelayDays(newParams.deliveryDelayDays);
              setDemandMultiplier(newParams.demandMultiplier);
            }}
            originalStockoutDays={originalStockoutDays}
          />
        </div>
        <div className="lg:col-span-2">
          <RiskHeatmapV2 riskData={riskData} onCellClick={handleCellClick} />
        </div>
      </div>

      {/* Layer 3: Narrative */}
      <NarrativeDrawer
        narrative={narrative}
        riskDistribution={riskDistribution}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pb-4">
        AI Forecasting v2 — Models update every 2 hours
        {isDemo && " • Demo mode (API unavailable)"}
        {!isDemo && " • Connected to live API"}
        {scenarioMode && " • Scenario active"}
      </footer>

      {/* Action slide-over */}
      {slideOver && (
        <ActionSlideOver
          item={slideOver.item}
          actionType={slideOver.actionType}
          scenarioDelayDays={delayDays}
          onSubmit={handleActionSubmit}
          onClose={() => setSlideOver(null)}
        />
      )}
    </div>
  );
}
