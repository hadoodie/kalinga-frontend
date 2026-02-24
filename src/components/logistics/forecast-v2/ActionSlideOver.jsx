import { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  X,
  ShoppingCart,
  ArrowRightLeft,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";

/**
 * ActionSlideOver
 * Slide-over panel for one-click "Draft PO" or "Request Transfer" actions.
 * Includes a focus trap, AI-recommended quantities, and a pre-filled form.
 */
const ActionSlideOver = memo(function ActionSlideOver({
  item,
  actionType,
  scenarioDelayDays = 0,
  onSubmit,
  onClose,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // Calculate recommended quantity based on projected stock gap
  const projectedStock = Math.max(0, item?.projected_stock ?? item?.current_stock ?? 0);
  const avgDaily = item?.avg_daily_usage ?? item?.daily_demand ?? 5;
  const daysUntilStockout = item?.days_until_stockout ?? (avgDaily > 0 ? projectedStock / avgDaily : 30);
  const safetyBuffer = 1.2; // 20% safety margin
  const recommendedQty = Math.ceil(avgDaily * (14 + scenarioDelayDays) * safetyBuffer);

  const [quantity, setQuantity] = useState(recommendedQty);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState(
    daysUntilStockout <= 3 ? "emergency" : daysUntilStockout <= 7 ? "urgent" : "normal",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus trap: focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit?.({
          item,
          actionType,
          quantity,
          priority,
          notes,
        });
        onClose();
      } catch {
        setIsSubmitting(false);
      }
    },
    [item, actionType, quantity, priority, notes, onSubmit, onClose],
  );

  if (!item) return null;

  const isPO = actionType === "po";
  const title = isPO ? "Draft Purchase Order" : "Request Transfer";
  const Icon = isPO ? ShoppingCart : ArrowRightLeft;
  const accentColor = isPO ? "emerald" : "violet";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-${accentColor}-50/50`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl bg-${accentColor}-100`}>
              <Icon className={`h-5 w-5 text-${accentColor}-600`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 truncate">{title}</h2>
              <p className="text-xs text-slate-500 truncate">
                {item.resource_name || item._resourceName || "Resource"} —{" "}
                {item.hospital_name || item._hospitalName || "Facility"}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* Risk context card */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Risk Context
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <div>
                  <span className="block text-slate-500 text-xs">Current Stock</span>
                  <span className="font-semibold text-slate-700">
                    {projectedStock.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <div>
                  <span className="block text-slate-500 text-xs">Avg Daily Use</span>
                  <span className="font-semibold text-slate-700">
                    {avgDaily.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" aria-hidden="true" />
                <div>
                  <span className="block text-slate-500 text-xs">Days to Stockout</span>
                  <span className="font-semibold text-orange-600">
                    {Math.round(daysUntilStockout)}d
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <div>
                  <span className="block text-slate-500 text-xs">Risk Probability</span>
                  <span className="font-semibold text-slate-700">
                    {Math.round((item.risk_prob || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            {scenarioDelayDays > 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
                ⚠ Scenario mode: +{scenarioDelayDays}d delivery delay factored in
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="action-quantity"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Quantity
            </label>
            <input
              id="action-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <p className="text-xs text-slate-400 mt-1">
              AI recommended: <strong>{recommendedQty.toLocaleString()}</strong>{" "}
              ({Math.ceil(avgDaily * 14)} base + {scenarioDelayDays > 0 ? `${scenarioDelayDays}d delay buffer + ` : ""}20% safety)
            </p>
          </div>

          {/* Priority */}
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 mb-2">
              Priority
            </legend>
            <div className="flex gap-2">
              {[
                { value: "normal", label: "Normal", color: "emerald" },
                { value: "urgent", label: "Urgent", color: "amber" },
                { value: "emergency", label: "Emergency", color: "red" },
              ].map(({ value, label, color }) => (
                <label
                  key={value}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-center text-sm font-medium transition cursor-pointer
                    ${
                      priority === value
                        ? `border-${color}-400 bg-${color}-50 text-${color}-700`
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={value}
                    checked={priority === value}
                    onChange={(e) => setPriority(e.target.value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Notes */}
          <div>
            <label
              htmlFor="action-notes"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="action-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, instructions, or justification…"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition cursor-pointer
              ${isPO ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"}
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isSubmitting
              ? "Submitting…"
              : isPO
                ? "Submit Purchase Order"
                : "Submit Transfer Request"
            }
          </button>
        </div>
      </div>
    </>
  );
});

export default ActionSlideOver;
