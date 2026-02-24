import { useState, useMemo, useCallback, useRef, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

const HORIZON_HOURS = 48;
const WINDOW_SIZE = 24; // visible hours in the chart at once

/**
 * Build chart-ready data directly from the API demand array.
 * Each row has: forecast_time, horizon_h, yhat, yhat_lower, yhat_upper
 * We aggregate across resources (sum yhat per hourly bucket).
 */
function buildTimelineData(demandData) {
  if (!demandData?.length) return [];

  // Group by horizon_h → sum yhat / yhat_lower / yhat_upper
  const byHour = new Map();
  for (const d of demandData) {
    const h = Number(d.horizon_h);
    if (Number.isNaN(h)) continue;
    const existing = byHour.get(h) || {
      horizon_h: h,
      yhat: 0,
      yhat_lower: 0,
      yhat_upper: 0,
      forecast_time: d.forecast_time,
      count: 0,
    };
    existing.yhat += Number(d.yhat) || 0;
    existing.yhat_lower += Number(d.yhat_lower) || 0;
    existing.yhat_upper += Number(d.yhat_upper) || 0;
    existing.count += 1;
    if (!existing.forecast_time) existing.forecast_time = d.forecast_time;
    byHour.set(h, existing);
  }

  // Sort by horizon_h
  const sorted = [...byHour.values()].sort((a, b) => a.horizon_h - b.horizon_h);

  return sorted.map((pt) => {
    const dt = pt.forecast_time ? new Date(pt.forecast_time) : null;
    const label = dt
      ? dt.toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          hour12: true,
        })
      : `+${pt.horizon_h}h`;

    return {
      ...pt,
      label,
      shortLabel: `+${pt.horizon_h}h`,
    };
  });
}

/** Custom tooltip */
function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-3.5 shadow-xl text-sm min-w-[180px]">
      <p className="font-bold text-slate-800 mb-1.5">{d.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-blue-600 text-xs">Predicted Demand</span>
          <span className="font-bold text-blue-700">{d.yhat.toFixed(1)}</span>
        </div>
        {d.yhat_lower != null && d.yhat_upper != null && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Confidence Range</span>
            <span className="text-xs text-slate-500">
              {d.yhat_lower.toFixed(1)} – {d.yhat_upper.toFixed(1)}
            </span>
          </div>
        )}
        {d.count > 1 && (
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
            Aggregated across {d.count} resources
          </p>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5">
        Horizon: +{d.horizon_h}h from model run
      </p>
    </div>
  );
}

const TimelineCanvas = memo(function TimelineCanvas({
  demandData = [],
  scenarioMode,
}) {
  const [sliderHour, setSliderHour] = useState(1); // start of visible window
  const sliderRef = useRef(null);

  const timeline = useMemo(() => buildTimelineData(demandData), [demandData]);

  // Determine actual min/max horizon_h from data
  const minHour = timeline.length > 0 ? timeline[0].horizon_h : 1;
  const maxHour = timeline.length > 0 ? timeline[timeline.length - 1].horizon_h : HORIZON_HOURS;
  const totalHours = maxHour - minHour + 1;

  // The visible window of data shown in the chart
  const visibleData = useMemo(() => {
    const windowEnd = sliderHour + WINDOW_SIZE;
    return timeline.filter(
      (pt) => pt.horizon_h >= sliderHour && pt.horizon_h <= windowEnd,
    );
  }, [timeline, sliderHour]);

  // Slider max value: start of last possible window
  const sliderMax = Math.max(minHour, maxHour - WINDOW_SIZE + 1);

  const handleSliderChange = useCallback(
    (e) => setSliderHour(Number(e.target.value)),
    [],
  );

  const nudge = useCallback(
    (delta) => {
      setSliderHour((prev) =>
        Math.max(minHour, Math.min(sliderMax, prev + delta)),
      );
    },
    [minHour, sliderMax],
  );

  // Summary stats for the visible window
  const windowStats = useMemo(() => {
    if (!visibleData.length) return { avg: 0, peak: 0, peakHour: 0 };
    const avg =
      visibleData.reduce((s, d) => s + d.yhat, 0) / visibleData.length;
    let peak = 0,
      peakHour = 0;
    for (const d of visibleData) {
      if (d.yhat > peak) {
        peak = d.yhat;
        peakHour = d.horizon_h;
      }
    }
    return { avg, peak, peakHour };
  }, [visibleData]);

  const isEmpty = timeline.length === 0;

  return (
    <section
      aria-label="Forecast timeline"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Demand Forecast Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEmpty
              ? "No forecast data available"
              : `${totalHours}h forecast · Viewing +${sliderHour}h to +${Math.min(sliderHour + WINDOW_SIZE, maxHour)}h`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            Predicted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-6 rounded bg-blue-100/80" />
            Confidence band
          </span>
          {scenarioMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-semibold">
              Scenario
            </span>
          )}
        </div>
      </div>

      {/* Inline stats */}
      {!isEmpty && (
        <div className="flex items-center gap-6 px-5 py-2.5 border-b border-slate-50 bg-slate-50/50 text-xs">
          <div>
            <span className="text-slate-400">Window Avg</span>{" "}
            <span className="font-bold text-slate-700">
              {windowStats.avg.toFixed(1)} units
            </span>
          </div>
          <div>
            <span className="text-slate-400">Peak</span>{" "}
            <span className="font-bold text-red-600">
              {windowStats.peak.toFixed(1)} units
            </span>
            <span className="text-slate-400 ml-1">at +{windowStats.peakHour}h</span>
          </div>
          <div>
            <span className="text-slate-400">Data points</span>{" "}
            <span className="font-bold text-slate-700">{timeline.length}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="px-4 pt-3" style={{ height: isEmpty ? 200 : 280 }}>
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">No demand data to display</p>
            <p className="text-xs mt-1">Forecast data will appear once the API returns results</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleData}
              margin={{ top: 5, right: 16, bottom: 5, left: 8 }}
            >
              <defs>
                <linearGradient id="tc-forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="tc-confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval={Math.max(0, Math.floor(visibleData.length / 8))}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={45}
                label={{
                  value: "Units",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 10, fill: "#94a3b8" },
                }}
              />
              <Tooltip content={<TimelineTooltip />} />

              {/* Upper confidence band */}
              <Area
                type="monotone"
                dataKey="yhat_upper"
                stroke="none"
                fill="url(#tc-confidenceGrad)"
                fillOpacity={1}
                isAnimationActive={false}
              />

              {/* Lower confidence band (renders as void below) */}
              <Area
                type="monotone"
                dataKey="yhat_lower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={0.8}
                isAnimationActive={false}
              />

              {/* Main predicted line */}
              <Area
                type="monotone"
                dataKey="yhat"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#tc-forecastGrad)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Time Scrubber */}
      {!isEmpty && (
        <div className="border-t border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nudge(-6)}
              disabled={sliderHour <= minHour}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Scroll 6 hours earlier"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 relative">
              {/* Track labels */}
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 px-0.5">
                <span>+{minHour}h</span>
                <span className="font-semibold text-slate-600">
                  Showing +{sliderHour}h – +{Math.min(sliderHour + WINDOW_SIZE, maxHour)}h
                </span>
                <span>+{maxHour}h</span>
              </div>

              {/* Range slider */}
              <input
                ref={sliderRef}
                type="range"
                min={minHour}
                max={sliderMax}
                step={1}
                value={sliderHour}
                onChange={handleSliderChange}
                className="w-full h-2 appearance-none rounded-full bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                aria-label={`Timeline window starting at +${sliderHour} hours`}
                aria-valuemin={minHour}
                aria-valuemax={sliderMax}
                aria-valuenow={sliderHour}
              />
            </div>

            <button
              type="button"
              onClick={() => nudge(6)}
              disabled={sliderHour >= sliderMax}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Scroll 6 hours forward"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Current position readout */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 min-w-[80px] justify-center">
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              +{sliderHour}h
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

export default TimelineCanvas;
