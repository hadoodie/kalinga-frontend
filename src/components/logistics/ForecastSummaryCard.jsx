import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { AlertTriangle, TrendingUp, Clock, Shield } from "lucide-react";
import forecastService from "../../services/forecastService";
import { getDemoSummary } from "./demoForecastData";
import { formatDisplayQuantity } from "../../utils/formatQuantity";

const RISK_COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_BG = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const ForecastSummaryCard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await forecastService.getSummary();
        setSummary(data);
      } catch (err) {
        console.error("Forecast summary error:", err);
        setError(err.message || "Failed to load forecast data");
        // Fallback to shared demo data
        setSummary(getDemoSummary());
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="flex gap-6">
          <div className="w-1/2 h-48 bg-gray-100 rounded-xl"></div>
          <div className="w-1/2 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const riskDist = summary?.risk_distribution || {};
  const pieData = Object.entries(riskDist)
    .filter(([_, v]) => v > 0)
    .map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count,
      level,
    }));

  const totalPredictions = Object.values(riskDist).reduce((s, v) => s + v, 0);
  const atRiskCount = (riskDist.high || 0) + (riskDist.critical || 0);
  const highRiskItems = summary?.high_risk_items || [];

  const renderTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      const pct = ((d.value / totalPredictions) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 text-sm">
          <p className="font-bold">{d.name} Risk</p>
          <p className="text-gray-600">
            {d.value.toLocaleString()} predictions ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-700" />
          AI Forecast Summary
        </h3>
        {summary?.generated_at && (
          <span className="text-xs text-gray-400 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(summary.generated_at).toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          ⚠ Using cached/demo data — {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Risk Distribution Donut */}
        <div className="w-full lg:w-1/2">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Risk Distribution (48h horizon)
          </p>
          <div className="h-52">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No forecast data available
              </div>
            )}
          </div>

          {/* Quick stats under chart */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-2xl font-extrabold text-gray-800">
                {totalPredictions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Predictions</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center ${
                atRiskCount > 0 ? "bg-red-50" : "bg-green-50"
              }`}
            >
              <p
                className={`text-2xl font-extrabold ${
                  atRiskCount > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {atRiskCount}
              </p>
              <p className="text-xs text-gray-500">High/Critical Risk</p>
            </div>
          </div>
        </div>

        {/* Right: Top Risk Items */}
        <div className="w-full lg:w-1/2">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Top At-Risk Items
          </p>

          {highRiskItems.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {highRiskItems.slice(0, 8).map((item) => (
                <div
                  key={`${item.hospital_id}-${item.resource_id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4"
                  style={{
                    borderColor: RISK_COLORS[item.risk_level] || "#22c55e",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.resource?.name || `Resource #${item.resource_id}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.hospital?.name || `Hospital #${item.hospital_id}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        RISK_BG[item.risk_level] || RISK_BG.low
                      }`}
                    >
                      {forecastService.formatRiskLevel(item.risk_level)}
                    </span>
                    {item.days_until_stockout < 7 && (
                      <span className="text-xs text-red-600 font-semibold whitespace-nowrap">
                        {formatDisplayQuantity(
                          item.days_until_stockout,
                          "days",
                        )}

                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingUp className="h-10 w-10 mb-2 text-green-300" />
              <p className="text-sm">All items within safe stock levels</p>
              <p className="text-xs mt-1">
                No high or critical risk items detected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastSummaryCard;
