import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Filter } from "lucide-react";
import forecastService from "../../services/forecastService";
import resourceService from "../../services/resourceService";
import { generateDemoDemandData } from "./demoForecastData";

const DemandForecastChart = ({ hospitalId = null, resourceId = null }) => {
  const [allForecasts, setAllForecasts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(hospitalId || "");
  const [selectedResource, setSelectedResource] = useState(resourceId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch hospitals/resources for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await resourceService.getAll();
        // Extract unique hospitals
        const hospMap = {};
        const resMap = {};
        (res || []).forEach((r) => {
          if (r.hospital_id && r.location) {
            hospMap[r.hospital_id] = { id: r.hospital_id, name: r.location };
          }
          if (r.resource_id || r.id) {
            const rid = r.resource_id || r.id;
            resMap[rid] = { id: rid, name: r.name };
          }
        });
        setHospitals(Object.values(hospMap));
        setResources(Object.values(resMap));
      } catch {
        // Filters are optional — chart still works without them
      }
    };
    fetchFilters();
  }, []);

  // Fetch ALL forecast data ONCE (no filters)
  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        setLoading(true);
        const data = await forecastService.getDemandForecasts({ hours: 48 });
        setAllForecasts(data?.data || data || []);
        setError(null);
      } catch (err) {
        console.error("Demand forecast error:", err);
        setError("Could not load demand forecasts");
        setAllForecasts(generateDemoDemandData());
      } finally {
        setLoading(false);
      }
    };
    fetchForecasts();
  }, []);

  // Client-side filter by hospital / resource
  const forecasts = useMemo(() => {
    let filtered = allForecasts;
    if (selectedHospital) {
      filtered = filtered.filter(
        (f) => String(f.hospital_id) === String(selectedHospital),
      );
    }
    if (selectedResource) {
      filtered = filtered.filter(
        (f) =>
          String(f.resource_id) === String(selectedResource),
      );
    }
    return filtered;
  }, [allForecasts, selectedHospital, selectedResource]);

  // Transform data for the chart — aggregate by hour
  const chartData = useMemo(() => {
    if (!forecasts.length) return [];

    const hourMap = {};
    forecasts.forEach((f) => {
      const time = f.forecast_time;
      if (!hourMap[time]) {
        hourMap[time] = { yhat: 0, yhat_lower: 0, yhat_upper: 0, count: 0 };
      }
      hourMap[time].yhat += parseFloat(f.yhat || 0);
      hourMap[time].yhat_lower += parseFloat(f.yhat_lower || 0);
      hourMap[time].yhat_upper += parseFloat(f.yhat_upper || 0);
      hourMap[time].count += 1;
    });

    return Object.entries(hourMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([time, vals]) => ({
        time,
        label: formatTimeLabel(time),
        yhat: Math.round(vals.yhat * 100) / 100,
        yhat_lower: Math.round(vals.yhat_lower * 100) / 100,
        yhat_upper: Math.round(vals.yhat_upper * 100) / 100,
      }));
  }, [forecasts]);

  const renderTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 text-sm">
          <p className="font-bold text-gray-800">{d?.label || label}</p>
          <p className="text-green-700">
            Predicted: <span className="font-bold">{d?.yhat?.toFixed(1)}</span>{" "}
            units
          </p>
          <p className="text-gray-500 text-xs">
            Range: {d?.yhat_lower?.toFixed(1)} – {d?.yhat_upper?.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-700" />
          Demand Forecast (48h)
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          ⚠ {error} — showing sample data
        </div>
      )}

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86efac" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                interval="preserveStartEnd"
                tickCount={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                label={{
                  value: "Units",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#9ca3af" },
                }}
              />
              <Tooltip content={renderTooltip} />

              {/* Upper confidence band */}
              <Area
                type="monotone"
                dataKey="yhat_upper"
                stroke="none"
                fill="url(#bandGradient)"
                fillOpacity={1}
              />
              {/* Main prediction line */}
              <Area
                type="monotone"
                dataKey="yhat"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#demandGradient)"
                fillOpacity={1}
              />
              {/* Lower confidence band */}
              <Area
                type="monotone"
                dataKey="yhat_lower"
                stroke="#86efac"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No forecast data available for selected filters
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-600 inline-block"></span>
          Predicted Demand
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-300 inline-block border-dashed"></span>
          Confidence Range
        </span>
      </div>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────

function formatTimeLabel(isoTime) {
  try {
    const d = new Date(isoTime);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[d.getDay()];
    const hour = d.getHours();
    const ampm = hour >= 12 ? "pm" : "am";
    const h12 = hour % 12 || 12;
    return `${day} ${h12}${ampm}`;
  } catch {
    return isoTime;
  }
}

export default DemandForecastChart;
