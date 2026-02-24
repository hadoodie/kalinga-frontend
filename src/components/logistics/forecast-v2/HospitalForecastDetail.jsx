import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Package,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import forecastService from "../../../services/forecastService";
import { ROUTES } from "../../../config/routes";

// ── Risk level colour helpers ────────────────────────────────
const RISK_BADGE = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const RISK_BAR_COLOR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

// ── Component ────────────────────────────────────────────────
export default function HospitalForecastDetail() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [horizon, setHorizon] = useState(48);

  // ── Fetch hospital detail ──────────────────────────────────
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await forecastService.getHospitalDetail(hospitalId);
      setData(res);
    } catch (err) {
      console.error("[HospitalForecastDetail] fetch error", err);
      setError(err?.message || "Failed to fetch hospital forecast data");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) fetchDetail();
  }, [hospitalId, fetchDetail]);

  // ── Derived demand chart data (group by resource) ──────────
  const demandByResource = useMemo(() => {
    if (!data?.demand?.length) return [];
    const grouped = {};
    for (const row of data.demand) {
      const name = row.resource?.name || `Resource ${row.resource_id}`;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push({
        time: new Date(row.forecast_time).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        yhat: Number(row.yhat) || 0,
        yhat_lower: Number(row.yhat_lower) || 0,
        yhat_upper: Number(row.yhat_upper) || 0,
      });
    }
    return Object.entries(grouped).map(([name, points]) => ({
      name,
      points,
    }));
  }, [data]);

  // ── Derived risk table ─────────────────────────────────────
  const riskRows = useMemo(() => {
    if (!data?.risk?.length) return [];
    return data.risk.map((r) => ({
      id: r.id,
      resource_name: r.resource?.name || `Resource ${r.resource_id}`,
      resource_category: r.resource?.category || "—",
      risk_level: r.risk_level || "low",
      risk_prob: Number(r.risk_prob) || 0,
      days_until_stockout: r.days_until_stockout ?? null,
      projected_stock: r.projected_stock ?? null,
      current_stock: r.current_stock ?? null,
    }));
  }, [data]);

  // ── Risk bar chart data ────────────────────────────────────
  const riskBarData = useMemo(() => {
    return riskRows
      .slice(0, 15) // top 15 by risk_prob (already sorted desc)
      .map((r) => ({
        name:
          r.resource_name.length > 18
            ? r.resource_name.slice(0, 16) + "…"
            : r.resource_name,
        risk: Math.round(r.risk_prob * 100),
        level: r.risk_level,
      }));
  }, [riskRows]);

  // ── Loading state ──────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto mb-3 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">
            Loading forecast for hospital #{hospitalId}…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(ROUTES.LOGISTICS.DASHBOARD)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const hospital = data?.hospital || {};
  const meta = data?.meta || {};

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              {hospital.name || `Hospital #${hospitalId}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {hospital.code && (
                <span className="font-mono mr-2">{hospital.code}</span>
              )}
              {hospital.region && <span>{hospital.region}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizon selector */}
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600"
          >
            <option value={24}>24h</option>
            <option value={48}>48h</option>
            <option value={72}>72h</option>
          </select>
          <button
            onClick={fetchDetail}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Horizon"
          value={`${meta.horizon_hours || horizon}h`}
          icon={Clock}
          color="text-blue-500"
        />
        <KpiCard
          label="Critical Items"
          value={meta.critical_count ?? 0}
          icon={ShieldAlert}
          color="text-red-500"
        />
        <KpiCard
          label="High Risk Items"
          value={meta.high_count ?? 0}
          icon={AlertTriangle}
          color="text-orange-500"
        />
        <KpiCard
          label="Resources Tracked"
          value={riskRows.length}
          icon={Package}
          color="text-emerald-500"
        />
      </div>

      {/* Risk Bar Chart */}
      {riskBarData.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Top Supply Risk by Resource
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskBarData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "Risk"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="risk" radius={[0, 6, 6, 0]}>
                {riskBarData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={RISK_BAR_COLOR[entry.level] || "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Demand Timeline Charts (one per resource) */}
      {demandByResource.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Demand Forecast Timeline
          </h3>
          <div className="space-y-6">
            {demandByResource.slice(0, 6).map((resource) => (
              <div key={resource.name}>
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  {resource.name}
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={resource.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      dataKey="yhat_upper"
                      stroke="#bfdbfe"
                      strokeDasharray="4 2"
                      dot={false}
                      name="Upper"
                    />
                    <Line
                      dataKey="yhat"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Forecast"
                    />
                    <Line
                      dataKey="yhat_lower"
                      stroke="#bfdbfe"
                      strokeDasharray="4 2"
                      dot={false}
                      name="Lower"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risk Table */}
      {riskRows.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Resource Risk Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-medium">Resource</th>
                  <th className="text-left px-3 py-3 font-medium">Category</th>
                  <th className="text-center px-3 py-3 font-medium">Risk</th>
                  <th className="text-right px-3 py-3 font-medium">
                    Probability
                  </th>
                  <th className="text-right px-3 py-3 font-medium">
                    Stockout In
                  </th>
                  <th className="text-right px-3 py-3 font-medium">
                    Current Stock
                  </th>
                  <th className="text-right px-5 py-3 font-medium">
                    Projected
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {riskRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {row.resource_name}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {row.resource_category}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${RISK_BADGE[row.risk_level] || RISK_BADGE.low}`}
                      >
                        {row.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {(row.risk_prob * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {row.days_until_stockout != null
                        ? `${row.days_until_stockout < 1 ? "<1" : Number(row.days_until_stockout).toFixed(1)}d`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {row.current_stock != null
                        ? Number(row.current_stock).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">
                      {row.projected_stock != null
                        ? Number(row.projected_stock).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!riskRows.length && !demandByResource.length && !loading && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            No forecast data available for this hospital yet.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Run the forecast pipeline to generate predictions.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Small KPI card ───────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}
