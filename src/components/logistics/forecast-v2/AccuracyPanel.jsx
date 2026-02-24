import { useState, useEffect, useCallback, memo } from "react";
import {
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import forecastService from "../../../services/forecastService";

function mapeColor(mape) {
  if (mape <= 15) return "#10b981"; // excellent
  if (mape <= 30) return "#f59e0b"; // acceptable
  return "#ef4444"; // poor
}

function mapeLabel(mape) {
  if (mape <= 15) return "Excellent";
  if (mape <= 30) return "Acceptable";
  return "Needs Improvement";
}

const AccuracyPanel = memo(function AccuracyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchAccuracy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forecastService.getAccuracy({ days });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAccuracy();
  }, [fetchAccuracy]);

  const metrics = data?.data || [];
  const meta = data?.meta || {};

  // Prepare chart data
  const chartData = metrics
    .sort((a, b) => (b.mape || 0) - (a.mape || 0))
    .slice(0, 12)
    .map((m) => ({
      name: `R-${m.resource_id}`,
      mape: m.mape || 0,
      mae: m.mae || 0,
      dataPoints: m.data_points || 0,
    }));

  // Aggregate stats
  const avgMape =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.mape || 0), 0) / metrics.length
      : null;

  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800">
            Forecast Accuracy
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800">
            Forecast Accuracy
          </h3>
          {avgMape != null && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: mapeColor(avgMape),
                backgroundColor: `${mapeColor(avgMape)}15`,
              }}
            >
              {mapeLabel(avgMape)} — {avgMape.toFixed(1)}% avg MAPE
            </span>
          )}
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-xs rounded-lg border border-slate-200 px-2 py-1 text-slate-600"
        >
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {/* Content */}
      <div className="p-5">
        {metrics.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">
              {meta.message ||
                "No accuracy data — need actual consumption data to compare"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Resources Tracked
                </p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {meta.resources || metrics.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Avg MAPE
                </p>
                <p
                  className="text-xl font-black mt-0.5"
                  style={{ color: avgMape != null ? mapeColor(avgMape) : "#64748b" }}
                >
                  {avgMape?.toFixed(1) ?? "—"}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Lookback
                </p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {days}d
                </p>
              </div>
            </div>

            {/* Bar chart — MAPE per resource */}
            {chartData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  MAPE by Resource (lower = better)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v, name) => [
                        name === "mape" ? `${v.toFixed(1)}%` : v.toFixed(2),
                        name === "mape" ? "MAPE" : "MAE",
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="mape" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={mapeColor(entry.mape)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Inline metrics table */}
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left px-3 py-2 font-medium">
                      Resource
                    </th>
                    <th className="text-right px-3 py-2 font-medium">MAPE</th>
                    <th className="text-right px-3 py-2 font-medium">MAE</th>
                    <th className="text-right px-3 py-2 font-medium">
                      Data Points
                    </th>
                    <th className="text-center px-3 py-2 font-medium">
                      Quality
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.map((m) => (
                    <tr
                      key={m.resource_id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-slate-700">
                        Resource #{m.resource_id}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span style={{ color: mapeColor(m.mape || 0) }}>
                          {(m.mape || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {(m.mae || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {m.data_points}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: mapeColor(m.mape || 0) }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default AccuracyPanel;
