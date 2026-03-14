import { useState, useEffect } from "react";
import {
  Bot,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import forecastService from "../../services/forecastService";
import { generateDemoAutoReorders } from "./demoForecastData";

/**
 * AutoReorderMonitor — Displays AI-generated supply reorder requests.
 *
 * Shows auto-created requests from the forecasting pipeline with status,
 * quantities, urgency levels, and timestamps.
 */
export default function AutoReorderMonitor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await forecastService.getAutoReorders({ hours: 48 });
      setOrders(result.data || []);
    } catch (err) {
      setError("Unable to load auto-reorders");
      // Demo data fallback
      setOrders(generateDemoAutoReorders());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Auto-Reorders</h3>
            <p className="text-xs text-gray-500">
              Automatically generated supply requests — last 48h
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {orders.length} orders
          </span>
          <button
            onClick={fetchOrders}
            aria-label="Refresh auto-reorders"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No auto-reorders in the last 48 hours
            </p>
            <p className="text-xs text-gray-400 mt-1">
              All supply levels are within safe thresholds
            </p>
          </div>
        ) : (
          orders.map((order, idx) => (
            <OrderRow key={order.id || idx} order={order} />
          ))
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Auto-reorders require logistics manager approval before dispatch
          </p>
            <button 
              onClick={() => console.log('Navigate to all requests')}
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
            >
            View all requests <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }) {
  const urgencyColors = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
  };

  const statusIcons = {
    pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    approved: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    in_transit: <Package className="w-3.5 h-3.5 text-blue-500" />,
  };

  const riskMeta = order.meta || {};
    const riskProb = riskMeta.risk_prob != null
      ? `${Math.round(riskMeta.risk_prob * 100)}%`
      : null;
    const daysLeft = riskMeta.days_until_stockout != null
      ? `${riskMeta.days_until_stockout.toFixed(1)}d`

  const hospitalName = order.hospital?.name || `Hospital #${order.hospital_id}`;
  const resourceName =
    order.resource?.name ||
    order.resource_name ||
    `Resource #${order.resource_id}`;
  const timeAgo = formatTimeAgo(order.created_at);

  return (
    <div className="px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusIcons[order.status] || statusIcons.pending}
            <span className="text-sm font-medium text-gray-900 truncate">
              {resourceName}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded border font-medium ${urgencyColors[order.urgency_level] || urgencyColors.Medium}`}
            >
              {order.urgency_level}
            </span>
          </div>
          <p className="text-xs text-gray-500 ml-[22px] flex items-center gap-2">
            <span>{hospitalName}</span>
            <span className="text-gray-300">•</span>
            <span>Qty: {order.quantity}</span>
            {riskProb && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-red-600">Risk: {riskProb}</span>
              </>
            )}
            {daysLeft && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-amber-600">Stockout: ~{daysLeft}</span>
              </>
            )}
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
