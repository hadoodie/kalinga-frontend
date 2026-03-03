import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "../../../services/adminService";

// Status badge styling
const statusBadges = {
  Pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  Packed:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  Shipped: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  "On-the-Way":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  Delivered:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  Delayed:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
};

// Urgency badge styling
const urgencyBadges = {
  Low: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  High: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

// Stat Card component
const StatCard = ({ icon: Icon, label, value, subtext, color = "primary" }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-500/10`}
    >
      <Icon className={`h-6 w-6 text-${color}-500`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-foreground/60">{label}</p>
      {subtext && <p className="text-xs text-foreground/50">{subtext}</p>}
    </div>
  </div>
);

export const LogisticsOverview = () => {
  const [stats, setStats] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const logisticsStats = await adminService.getLogisticsStats();
      setStats(logisticsStats);
      setIncoming(logisticsStats.incoming || []);
      setOutgoing(logisticsStats.outgoing || []);
      setTracking(logisticsStats.tracking || []);
    } catch (error) {
      console.error("Error fetching logistics data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "incoming", label: "Incoming Requests", count: incoming.length },
    { id: "outgoing", label: "Outgoing Requests", count: outgoing.length },
    { id: "tracking", label: "Active Shipments", count: tracking.length },
  ];

  const currentData =
    activeTab === "incoming"
      ? incoming
      : activeTab === "outgoing"
      ? outgoing
      : tracking;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Logistics Overview"
        description="Monitor allocation requests, supply chain movements, and delivery tracking across all facilities."
        actions={
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.pendingRequests ?? 0}
            </p>
            <p className="text-sm text-foreground/60">Pending Requests</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <Truck className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.inTransit ?? 0}
            </p>
            <p className="text-sm text-foreground/60">In Transit</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.delivered ?? 0}
            </p>
            <p className="text-sm text-foreground/60">Delivered</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.totalRequests ?? 0}
            </p>
            <p className="text-sm text-foreground/60">Total Requests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-primary/10"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-primary-foreground/20"
                  : "bg-foreground/10"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentData.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-foreground/60">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>No {activeTab} data available</p>
          </div>
        ) : activeTab === "tracking" ? (
          // Tracking view with route visualization
          <div className="space-y-4">
            {tracking.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-2xl border border-border/60 bg-background/60 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {shipment.id}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-foreground/60">
                        <span>{shipment.route}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-foreground/50" />
                    <span className="text-foreground/70">
                      {shipment.contents}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        statusBadges[shipment.status] || statusBadges.Pending
                      }`}
                    >
                      {shipment.status}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        urgencyBadges[shipment.priority] || urgencyBadges.Medium
                      }`}
                    >
                      {shipment.priority}
                    </span>
                  </div>

                  <div className="text-right text-xs text-foreground/60">
                    <p>
                      ETA:{" "}
                      {shipment.eta
                        ? new Date(shipment.eta).toLocaleString()
                        : "TBD"}
                    </p>
                    <p>Last ping: {shipment.lastPing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Request list view
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Request ID</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Urgency</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-background/50">
                {currentData.slice(0, 10).map((request) => (
                  <tr
                    key={request.id || request.request_id}
                    className="hover:bg-primary/5 transition"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {request.request_id || `REQ-${request.id}`}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground">{request.item_name}</p>
                        <p className="text-xs text-foreground/60">
                          Qty: {request.item_quantity}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {request.destination_hospital || request.source_location}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          urgencyBadges[request.urgency] || urgencyBadges.Medium
                        }`}
                      >
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusBadges[request.status] || statusBadges.Pending
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/60 text-xs">
                      {formatRelativeTime(request.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
