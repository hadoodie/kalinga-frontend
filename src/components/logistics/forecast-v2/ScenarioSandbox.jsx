import { memo } from "react";
import { Clock, FlaskConical, TrendingUp, Truck } from "lucide-react";

const ScenarioSandbox = memo(function ScenarioSandbox({
  params,
  onChange,
  originalStockoutDays,
}) {
  const update = (key, value) => onChange({ ...params, [key]: value });

  const adjustedStockout = originalStockoutDays
    ? Math.max(0, originalStockoutDays - params.deliveryDelayDays)
    : null;

  return (
    <section
      aria-label="What-if scenario controls"
      className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-violet-50 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical
          className="h-5 w-5 text-violet-600"
          aria-hidden="true"
        />
        <h3 className="text-base font-bold text-violet-900">
          Scenario Sandbox
        </h3>
        <span className="text-xs text-violet-500">
          — Adjust variables to simulate forecast changes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Delivery Delay */}
        <div className="space-y-2">
          <label
            htmlFor="scenario-delay"
            className="flex items-center gap-2 text-sm font-semibold text-violet-800"
          >
            <Truck className="h-4 w-4" aria-hidden="true" />
            Delivery Delay
          </label>
          <input
            id="scenario-delay"
            type="range"
            min={0}
            max={14}
            step={1}
            value={params.deliveryDelayDays}
            onChange={(e) => update("deliveryDelayDays", Number(e.target.value))}
            className="w-full accent-violet-600"
            aria-valuemin={0}
            aria-valuemax={14}
            aria-valuenow={params.deliveryDelayDays}
            aria-valuetext={`${params.deliveryDelayDays} days delay`}
          />
          <div className="flex justify-between text-xs text-violet-600">
            <span>On time</span>
            <span className="font-bold text-sm">
              +{params.deliveryDelayDays} days
            </span>
            <span>+14 days</span>
          </div>
        </div>

        {/* Demand Multiplier */}
        <div className="space-y-2">
          <label
            htmlFor="scenario-demand"
            className="flex items-center gap-2 text-sm font-semibold text-violet-800"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Demand Surge
          </label>
          <input
            id="scenario-demand"
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={params.demandMultiplier}
            onChange={(e) =>
              update("demandMultiplier", Number(e.target.value))
            }
            className="w-full accent-violet-600"
            aria-valuemin={0.5}
            aria-valuemax={3}
            aria-valuenow={params.demandMultiplier}
            aria-valuetext={`${params.demandMultiplier}x demand multiplier`}
          />
          <div className="flex justify-between text-xs text-violet-600">
            <span>0.5×</span>
            <span className="font-bold text-sm">
              {params.demandMultiplier.toFixed(1)}× normal
            </span>
            <span>3.0×</span>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="rounded-xl border border-violet-200 bg-white p-4">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2">
            Projected Impact
          </p>
          {adjustedStockout != null && adjustedStockout < 999 ? (
            <div>
              <p className="text-xl font-black text-violet-700">
                {adjustedStockout < 1
                  ? "< 1"
                  : adjustedStockout.toFixed(1)}{" "}
                days
              </p>
              <p className="text-xs text-violet-500">
                until earliest stockout
                {adjustedStockout < (originalStockoutDays || 0) && (
                  <span className="text-red-500 font-semibold">
                    {" "}
                    (
                    {(
                      (originalStockoutDays || 0) - adjustedStockout
                    ).toFixed(1)}
                    d sooner)
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-black text-emerald-600">Safe</p>
              <p className="text-xs text-violet-500">
                No stockout predicted under this scenario
              </p>
            </div>
          )}
          {params.demandMultiplier > 1.5 && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Buffer stock consumed{" "}
              {((params.demandMultiplier - 1) * 100).toFixed(0)}% faster
            </p>
          )}
        </div>
      </div>
    </section>
  );
});

export default ScenarioSandbox;
