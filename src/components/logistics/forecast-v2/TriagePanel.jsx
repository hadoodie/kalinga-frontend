import { memo } from "react";
import {
  AlertTriangle,
  Clock,
  Repeat,
  ShoppingCart,
  Zap,
  ChevronRight,
} from "lucide-react";
import forecastService from "../../../services/forecastService";

const URGENCY_DOT = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

const URGENCY_BG = {
  critical: "bg-red-50 border-red-100 hover:bg-red-50/80",
  high: "bg-orange-50 border-orange-100 hover:bg-orange-50/80",
  medium: "bg-amber-50/50 border-amber-100 hover:bg-amber-50/60",
  low: "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/60",
};

const TriagePanel = memo(function TriagePanel({
  items,
  scenarioMode,
  scenarioParams,
  onResolve,
  onSelect,
}) {
  if (!items?.length) {
    return (
      <section aria-label="Triage queue" className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800">Priority Queue</h3>
        </div>
        <div className="text-center py-8 text-sm text-slate-400">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No items require attention
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Triage queue" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Priority Queue
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} sorted by urgency
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {["critical", "high", "medium", "low"].map((level) => {
            const count = items.filter(
              (i) => (i.risk_level || "medium") === level,
            ).length;
            if (!count) return null;
            return (
              <span
                key={level}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${URGENCY_DOT[level]}`} />
                {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
        {items.map((item, idx) => {
          const level = item.risk_level || "medium";
          const daysLeft = scenarioMode
            ? Math.max(
                0,
                (item.days_until_stockout || 999) -
                  (scenarioParams?.deliveryDelayDays || 0),
              )
            : item.days_until_stockout || 999;
          const isImminent = daysLeft < 3;
          const hospitalName =
            item.hospital?.name || item.hospital_name || `Hospital ${item.hospital_id}`;
          const resourceName =
            item.resource?.name || item.resource_name || `Resource ${item.resource_id}`;

          return (
            <div
              key={`${item.hospital_id}-${item.resource_id}-${idx}`}
              className={`group flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer border-l-3 ${URGENCY_BG[level]}`}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
              tabIndex={0}
              role="button"
              aria-label={`${resourceName} at ${hospitalName}. ${level} risk.`}
            >
              {/* Rank + risk dot */}
              <div className="flex flex-col items-center gap-1 shrink-0 w-8">
                <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${URGENCY_DOT[level]}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{resourceName}</p>
                <p className="text-xs text-slate-500 truncate">{hospitalName}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px]">
                  <span className={`font-bold ${isImminent ? "text-red-600" : "text-slate-600"}`}>
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {daysLeft < 999
                      ? daysLeft < 1
                        ? "<1d"
                        : `${daysLeft.toFixed(1)}d`
                      : "Safe"}
                  </span>
                  <span className="text-slate-400">
                    Risk {Math.round((item.risk_prob || 0) * 100)}%
                  </span>
                  {scenarioMode && scenarioParams?.deliveryDelayDays > 0 && (
                    <span className="text-violet-600 font-medium">
                      +{scenarioParams.deliveryDelayDays}d delay
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve(item, "purchase_order");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  aria-label={`Draft PO for ${resourceName}`}
                >
                  <ShoppingCart className="h-3 w-3" />
                  PO
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve(item, "transfer_stock");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                  aria-label={`Transfer ${resourceName}`}
                >
                  <Repeat className="h-3 w-3" />
                </button>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default TriagePanel;
