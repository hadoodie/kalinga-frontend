import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Clock,
  MapPin,
  List,
  AlertTriangle,
  ArrowRight,
  CornerDownRight,
  ClipboardList,
  Target,
  Home,
  CheckCircle,
  Briefcase,
  Wrench,
  ShieldQuestionMark,
  ChartColumnStacked,
  Bell,
  Building,
  Users,
  BrainCircuit,
  Maximize2,
} from "lucide-react";
import { evacMapImg } from "@images";
import { Link, useNavigate } from "react-router-dom";
import resourceService from "../../services/resourceService";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import api from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useSupplyTracking } from "../../hooks/useSupplyTracking";
import useForecastPrefetch from "../../hooks/useForecastPrefetch";
import LiveTrackingMap from "./LiveTrackingMap";

// Import Hospital Dashboard
import HospitalDashboard from "./ResourceMngmt/HospitalDashboard";

// Import AI Forecast v2 dashboard
import ForecastDashboard from "./forecast-v2/ForecastDashboard";

// --- DEMO FALLBACK DATA (shown with a visible banner when API is unavailable) ---
const DEMO_RESOURCE_REQUESTS = [
  {
    id: "R-1001",
    location: "Barangay San Jose",
    urgency: "Critical",
    time: "2 hours ago",
    items: 3,
  },
  {
    id: "R-1002",
    location: "Evacuation Center 3",
    urgency: "High",
    time: "3 hours ago",
    items: 2,
  },
  {
    id: "R-1003",
    location: "Field Hospital Beta",
    urgency: "Medium",
    time: "5 hours ago",
    items: 1,
  },
];

const DEMO_SHIPMENTS = [
  {
    id: "S-7001",
    route: "Depot A → Field Hospital",
    eta: "2025-09-29T20:30:00Z",
    status: "In Transit",
    contents: "Medical Supplies",
    priority: "High",
  },
  {
    id: "S-7002",
    route: "Warehouse B → Evac Zone 4",
    eta: "2025-09-29T19:45:00Z",
    status: "Delayed",
    contents: "Water, Blankets",
    priority: "Critical",
  },
];

const DEMO_ASSETS = [
  { name: "Truck 1", status: "In Use" },
  { name: "Truck 2", status: "Idle" },
  { name: "Generator 1", status: "In Use" },
];

const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    title: "Low Stock Alert",
    message: "Demo notification — connect API for real data",
    priority: "Critical",
    time: "5 mins ago",
    read: false,
  },
];

const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get("/notifications");
        console.log("Fetched notifications:", response.data); // DEBUG LOG

        // Filter for logistics notifications only
        const logisticsNotifs = response.data.filter(
          (n) => n.type === "logistics" || !n.type, // Include if no type field
        );

        setNotifications(logisticsNotifs.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch notifications for widget", err);
        // Fallback to demo data with type field
        const mockWithType = DEMO_NOTIFICATIONS.map((n) => ({
          ...n,
          type: "logistics",
        }));
        setNotifications(mockWithType);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="text-center text-sm text-gray-500">Loading...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500">
        No new notifications.
      </div>
    );
  }

  return (
    <ul className="space-y-3 text-left">
      {notifications.map((notif) => (
        <li
          key={notif.id}
          className="flex gap-3 p-3 bg-gray-50 rounded-lg text-primary text-sm border-l-4 border-green-700"
        >
          <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-green-700 rounded-full"></span>
          <div className="flex-1">
            <p className="font-semibold">{notif.title}</p>
            <p className="text-xs text-gray-600">
              {notif.description || notif.message}
            </p>
            <p className="text-sm font-medium text-slate-600 mt-1">
              {notif.created_at
                ? formatDistanceToNow(new Date(notif.created_at), {
                    addSuffix: true,
                  })
                : notif.time}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "Critical":
      return "bg-red-100 text-red-800 border-red-400";
    case "High":
      return "bg-yellow-100 text-yellow-800 border-yellow-400";
    default:
      return "bg-gray-100 text-gray-800 border-gray-400";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Delayed":
      return "text-red-700 bg-red-100";
    case "In Transit":
    case "En Route":
      return "text-blue-700 bg-blue-100";
    case "Delivered":
    case "Available":
      return "text-green-700 bg-green-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
};

const formatETA = (isoTime) => {
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// --- CHART COMPONENT ---
const PIE_COLORS = [
  "#34D399",
  "#1c2414",
  "#394e2c",
  "#FBBF24",
  "#f0d003",
  "#fae526",
];

const FacilityPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No facility data
      </div>
    );
  }

  const facilityResourceData = data.map((item) => ({
    name: item.name,
    value: item.resources,
  }));

  const renderTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.resources, 0);
      const value = payload[0].value;
      const percent = ((value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg text-sm shadow-xl text-gray-900 border border-gray-300">
          <p className="font-bold text-lg">{payload[0].name}</p>
          <p className="text-gray-600">
            {value} total resources ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={facilityResourceData}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          dataKey="value"
          labelLine={false}
          paddingAngle={4}
        >
          {facilityResourceData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={renderTooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const OverallStatusCard = ({ inventory, facilities }) => {
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const totalRemaining =
    inventory?.reduce((sum, i) => sum + (i.remaining || 0), 0) || 0;
  const criticalCount =
    inventory?.filter((i) => i.status === "Critical").length || 0;
  const facilityCount = facilities?.length || 0;
  const itemCategories = [...new Set(inventory?.map((i) => i.category) || [])]
    .length;
  const visibleFacilities = showAllFacilities
    ? facilities || []
    : (facilities || []).slice(0, 6);

  return (
    <Link to="/logistics/resource-management" className="block h-full">
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold mb-4 border-b border-gray-100 pb-3 flex justify-center items-center">
          Resource Overview
        </h3>
        <div className="flex flex-col flex-1 w-full h-full justify-between gap-4">
          {/* Top row: Metrics + Chart (Wraps on very small screens) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 sm:gap-4 w-full">
            {/* Key Metrics */}
            <div className="flex flex-col items-center sm:items-start justify-center shrink-0 w-full sm:w-auto">
              <p className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-none text-center sm:text-left">
                {totalRemaining}
              </p>
              <p className="text-[11px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mt-2 mb-4 text-center sm:text-left">
                Total Inventory
              </p>

              <div className="space-y-3 text-sm w-full">
                <p className="font-medium text-gray-600 flex items-center justify-center sm:justify-start">
                  <span className="w-6 flex shrink-0 justify-center sm:justify-start">
                    <Home className="h-4 w-4 text-gray-400" />
                  </span>
                  <span className="truncate">{facilityCount} Facilities</span>
                </p>
                <p className="font-medium text-gray-600 flex items-center justify-center sm:justify-start">
                  <span className="w-6 flex shrink-0 justify-center sm:justify-start">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </span>
                  <span className="truncate">{itemCategories} Categories</span>
                </p>
                <div className="flex justify-center sm:justify-start w-full">
                  <p className="font-semibold text-red-600 flex items-center bg-red-50 py-1 px-2 rounded-lg w-max">
                    <span className="w-6 flex shrink-0 justify-center sm:justify-start">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </span>
                    <span>{criticalCount} Critical Alerts</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="w-full sm:w-1/2 flex justify-center items-center min-h-[160px] relative">
              {facilities && facilities.length > 0 ? (
                <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px]">
                  <FacilityPieChart data={facilities} />
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No facility data</p>
              )}
            </div>
          </div>

          {/* Bottom: Custom Legend Container */}
          <div className="w-full bg-slate-50/70 rounded-xl p-3 md:p-4 border border-slate-100 flex flex-col mt-auto">
            <div className={showAllFacilities ? "max-h-64 overflow-y-auto pr-1 space-y-3" : "space-y-3"}>
              {visibleFacilities.length > 0
                ? visibleFacilities.map((fac, idx) => (
                  <div key={idx} className="flex items-start gap-3 w-full">
                    <div
                      className="w-3.5 h-3.5 rounded shrink-0 mt-[2px] shadow-sm ring-1 ring-black/5"
                      style={{
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    ></div>
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className="text-[13px] md:text-sm text-gray-700 font-medium leading-tight m-0 p-0 line-clamp-2"
                        title={fac.name}
                      >
                        {fac.name}
                      </p>
                    </div>
                  </div>
                ))
                : null}
            </div>

            {facilityCount > 6 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAllFacilities((prev) => !prev);
                }}
                className="mt-3 self-start text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
              >
                {showAllFacilities
                  ? "Show fewer facilities"
                  : `Show all facilities (${facilityCount})`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
};

const AssetStatusCard = ({ assets }) => {
  const totalAssets = assets?.length || 0;
  const inUse = assets?.filter((a) => a.status === "In Use").length || 0;
  const repair = assets?.filter((a) => a.status === "Repair").length || 0;
  const idle = totalAssets - inUse - repair;

  return (
    <Link to="/logistics/asset-registry" className="block h-full">
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold border-b border-gray-100 pb-3 flex justify-center items-center">
          {" "}
          Asset Registry Status
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-2 min-w-0">
          <div className="text-4xl sm:text-5xl font-extrabold flex flex-wrap items-baseline gap-x-2 min-w-0">
            {totalAssets}
            <span className="text-sm sm:text-lg font-medium text-gray-600 break-words">
              Total Registered Assets
            </span>
          </div>

          <p className="text-sm sm:text-[15px] font-semibold mt-1 text-green-700 flex items-center flex-wrap gap-1 min-w-0">
            <CheckCircle className="h-4 w-4 mr-1 text-green-700" /> {idle}{" "}
            Available Assets
          </p>
          <p className="text-sm sm:text-[15px] font-semibold text-slate-700 flex items-center flex-wrap gap-1 min-w-0">
            <ChartColumnStacked className="h-4 w-4 mr-1 text-slate-500" />{" "}
            {inUse} Active Assets
          </p>
          <p className="text-sm sm:text-[15px] font-semibold text-slate-700 flex items-center flex-wrap gap-1 min-w-0">
            <Wrench className="h-4 w-4 mr-1 text-slate-500" /> {repair} Vehicles
            Under Repair
          </p>
        </div>
      </div>
    </Link>
  );
};

const DeliveryPerformanceCard = ({ requests, shipments }) => {
  const delayed = shipments?.filter((s) => s.status === "Delayed").length || 0;
  const totalRequests = requests?.length || 0;
  const avgDispatchTime = "45";
  const avgDispatchUnit = "m";

  return (
    <Link to="/logistics/supply-tracking" className="block h-full">
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200 cursor-pointer">
        <h3 className="text-xl font-bold mb-0 border-b border-gray-100 pb-3 flex justify-center items-center">
          {" "}
          Delivery Performance
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="text-4xl sm:text-5xl font-extrabold flex flex-wrap items-baseline gap-x-1 min-w-0">
            {avgDispatchTime}{" "}
            <span className="text-xl sm:text-2xl font-extrabold mr-1">
              {avgDispatchUnit}
            </span>
            <span className="text-xs sm:text-sm font-light ml-1 sm:ml-2 text-gray-600 break-words">
              Avg Dispatch Time
            </span>
          </div>

          <p className="text-sm sm:text-[15px] font-semibold text-red-600 flex items-center flex-wrap gap-1 min-w-0">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-600" /> {delayed}{" "}
            Delayed Shipments
          </p>

          <div className="text-sm sm:text-[15px] font-medium flex items-center flex-wrap gap-1 min-w-0 text-gray-600">
            <CheckCircle className="mr-1 h-4 w-4" /> 80% On-Time Success
          </div>
        </div>
      </div>
    </Link>
  );
};

const PendingRequestsCard = ({ requests }) => {
  const totalRequests = requests?.length || 0;
  const criticalRequests =
    requests?.filter((r) => r.urgency === "Critical").length || 0;
  const shippedRequests =
    requests?.filter((r) => r.urgency === "Shipped").length || 0;
  const highRequests =
    requests?.filter((r) => r.urgency === "High").length || 0;

  return (
    <Link to="/logistics/requested-allocation" className="block h-full">
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold border-b border-gray-100 pb-3 flex justify-center items-center">
          Requested Allocation
        </h3>

        <div className="flex-1 flex flex-col justify-center space-y-1">
          <div className="text-4xl sm:text-5xl font-extrabold flex flex-wrap items-baseline gap-x-2 min-w-0">
            {totalRequests}{" "}
            <span className="text-sm sm:text-lg font-medium text-gray-600 break-words">
              Total Pending Requests
            </span>
          </div>

          <p className="text-sm sm:text-[15px] font-semibold mt-1 text-red-600 flex items-center flex-wrap gap-1 min-w-0">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />{" "}
            {criticalRequests} Critical
          </p>
          <p className="text-sm sm:text-[15px] font-semibold text-yellow-600 flex items-center flex-wrap gap-1 min-w-0">
            <Clock className="h-4 w-4 mr-1 text-yellow-600" /> {highRequests}{" "}
            High Priority
          </p>
          <p className="text-sm sm:text-[15px] font-semibold text-gray-600 flex items-center flex-wrap gap-1 min-w-0">
            <Truck className="h-4 w-4 mr-1 text-gray-600" /> {shippedRequests}{" "}
            Shipments Dispatched
          </p>
        </div>
      </div>
    </Link>
  );
};

const LiveMap = ({ shipments, assets }) => {
  const totalAssets = assets?.length || 0;
  const inUse = assets?.filter((a) => a.status === "In Use").length || 0;
  const repair = assets?.filter((a) => a.status === "Repair").length || 0;
  const idle = totalAssets - inUse - repair;

  return (
    <div className="bg-white rounded-2xl shadow-md border p-5 flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center justify-between">
        <span className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-slate-700" /> Live Tracking Map
        </span>
        <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-3 py-1 rounded-full shadow-sm font-bold">
          {idle} Available Vehicles
        </span>
      </h2>
      <div className="flex-1 relative rounded-xl overflow-hidden z-0 border border-gray-200 group">
        <LiveTrackingMap allShipments={shipments} />
        {/* Overlay Button */}
        <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[400] pointer-events-none">
          <Link
            to="/logistics/live-map"
            className="bg-white text-slate-800 font-bold px-5 py-2.5 rounded-full shadow-lg pointer-events-auto flex items-center hover:bg-slate-50 transition-all hover:scale-105"
          >
            <Maximize2 className="h-4 w-4 mr-2" /> View Full Screen Map
          </Link>
        </div>
      </div>
    </div>
  );
};

const NotificationsList = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          Notifications
        </h2>
      </div>
      <div className="overflow-y-auto pr-2 flex-1">
        <NotificationWidget />
      </div>
    </div>
  );
};

const ActiveDeliveriesList = ({ shipments }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
        <Truck className="h-5 w-5 mr-2 text-slate-700" />
        Active Deliveries
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-center">Shipment ID</th>
              <th className="px-3 py-2 text-center">Route</th>
              <th className="px-3 py-2 text-center">Contents</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shipments && shipments.length > 0 ? (
              shipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-center font-semibold">
                    {s.id}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="flex items-center justify-center">
                      <CornerDownRight className="h-4 w-4 mr-1 text-gray-400" />
                      {s.route}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">
                    {s.contents?.replace(
                      /Qty:\s*(\d+(?:\.\d+)?)/g,
                      (match, p1) => `Qty: ${parseInt(p1, 10)}`,
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-gray-600">
                    {formatETA(s.eta)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No active shipments to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <Link
          to="/logistics/supply-tracking"
          className="text-sm text-slate-600 font-semibold hover:text-slate-800 flex items-center justify-end transition-colors"
        >
          View All Deliveries <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// --- UPDATED: ResourceRequestsList (Mobile Responsive) ---
const ResourceRequestsList = ({ requests }) => (
  <div className="col-span-12 bg-white rounded-2xl shadow-md border p-5">
    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
      <List className="h-5 w-5 mr-2 text-slate-700" /> Pending Resource Requests
    </h2>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-center">ID</th>
            <th className="px-3 py-2 text-center">Location</th>
            <th className="px-3 py-2 text-center">Items</th>
            <th className="px-3 py-2 text-center">Urgency</th>
            <th className="px-3 py-2 text-center">Received</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests && requests.length > 0 ? (
            requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-center">{r.id}</td>
                <td className="px-3 py-2 text-center">{r.location}</td>
                <td className="px-3 py-2 text-center font-bold text-slate-700">
                  {r.items}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full border ${getUrgencyColor(
                      r.urgency,
                    )}`}
                  >
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-gray-500">
                  {r.time}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">
                No pending requests
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="mt-3 text-right">
      <Link
        to="/logistics/requested-allocation"
        className="text-sm text-slate-600 font-semibold hover:text-slate-800 flex items-center justify-end transition-colors"
      >
        View Full Allocation <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  </div>
);

// --- Tab Navigation Component (Logistics-only, no national/admin toggle) ---
const TabNavigation = ({ activeTab, setActiveTab, assignedHospitalName }) => {
  const tabs = [
    {
      id: "logistics",
      label: "Logistics Dashboard",
      icon: <Truck className="w-5 h-5" />,
      color: "bg-gradient-to-r from-green-600 to-emerald-700",
      description: "Resource Allocation & Tracking",
    },
    {
      id: "hospital",
      label: "Hospital Dashboard",
      icon: <Building className="w-5 h-5" />,
      color: "bg-gradient-to-r from-blue-600 to-blue-800",
      description: "Hospital Resource Management",
    },
    {
      id: "forecast",
      label: "AI Forecast",
      icon: <BrainCircuit className="w-5 h-5" />,
      color: "bg-gradient-to-r from-purple-600 to-indigo-700",
      description: "AI-Powered Demand Forecasting & Risk Analysis",
    },
  ];

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight break-normal">
            {tabs.find((t) => t.id === activeTab)?.label || "Logistics System"}
          </h1>
          <p className="text-gray-600 mt-1 break-normal">
            {tabs.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        <div className="flex flex-wrap overflow-x-auto gap-2 bg-gray-100 p-1 rounded-xl w-full scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 md:px-6 md:py-3 whitespace-nowrap rounded-lg text-sm md:text-base font-bold transition-all flex items-center gap-2 min-w-0 ${
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-lg`
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned Hospital Indicator */}
      <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-green-700">
            Logistics Operations Active
          </span>
        </div>
        <div className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-300 max-w-full min-w-0 break-words">
          {assignedHospitalName || "Hospital View"}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION COMPONENT ---
const LogisDash = () => {
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState("logistics");
  const navigate = useNavigate();

  // Prefetch forecast data in the background so ForecastDashboard renders instantly
  useForecastPrefetch();

  // Prefetch supply tracking data — only poll when logistics tab is active
  const { shipments: liveShipments } = useSupplyTracking({
    pollingInterval: 60000,
    enabled: activeTab === "logistics",
  });
  // Fall back to demo data only when explicitly in demo mode AND no live data yet
  const shipments =
    liveShipments.length > 0 ? liveShipments : isDemoMode ? DEMO_SHIPMENTS : [];

  // Get the authenticated user and their assigned hospital
  const { user } = useAuth();
  const assignedHospital = user?.hospitals?.[0] || null;
  const assignedHospitalName = assignedHospital?.name || null;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        let usingFallback = false;

        // Fire all three independent API calls in parallel
        const [resourcesResult, requestsResult, assetsResult] =
          await Promise.allSettled([
            resourceService.getAll(),
            api.get("/requests", {
              params: { per_page: 10, status: "pending" },
            }),
            api.get("/assets", { params: { per_page: 20 } }),
          ]);

        // ── 1. Resources / Inventory ──
        if (resourcesResult.status === "fulfilled") {
          const resourcesResponse = resourcesResult.value;
          const inventoryData = resourcesResponse.map((item) => ({
            resource: item.name,
            category: item.category,
            remaining: parseFloat(item.quantity || 0),
            unit: item.unit,
            status: item.status,
            facility: item.location,
          }));

          const facilityMap = {};
          resourcesResponse.forEach((item) => {
            const facilityName = item.location || "Unknown";
            const remaining = parseFloat(item.quantity || 0);
            if (!facilityMap[facilityName]) {
              facilityMap[facilityName] = { name: facilityName, resources: 0 };
            }
            facilityMap[facilityName].resources += remaining;
          });
          const facilitiesData = Object.values(facilityMap).filter(
            (f) => f.resources > 0,
          );
          setInventory(inventoryData);
          setFacilities(facilitiesData);
        } else {
          console.warn(
            "Resources API unavailable, using demo mode",
            resourcesResult.reason,
          );
          usingFallback = true;
        }

        // ── 2. Requests ──
        if (requestsResult.status === "fulfilled") {
          const reqData =
            requestsResult.value.data?.data || requestsResult.value.data || [];
          setRequests(
            reqData.map((r) => ({
              id: `R-${r.id}`,
              location: r.resource_name || r.hospital?.name || "Unknown",
              urgency: r.urgency_level || "Medium",
              time: r.created_at
                ? formatDistanceToNow(new Date(r.created_at), {
                    addSuffix: true,
                  })
                : "",
              items: r.quantity || 1,
            })),
          );
        } else {
          console.warn(
            "Requests API unavailable, using demo fallback",
            requestsResult.reason,
          );
          setRequests(DEMO_RESOURCE_REQUESTS);
          usingFallback = true;
        }

        // ── 3. Shipments: handled by useSupplyTracking hook above ──

        // ── 4. Assets ──
        if (assetsResult.status === "fulfilled") {
          const assetData =
            assetsResult.value.data?.data || assetsResult.value.data || [];
          setAssets(
            assetData.map((a) => ({
              name: a.name || a.code || "Unknown",
              status: a.status || "Idle",
            })),
          );
        } else {
          console.warn(
            "Assets API unavailable, using demo fallback",
            assetsResult.reason,
          );
          setAssets(DEMO_ASSETS);
          usingFallback = true;
        }

        setIsDemoMode(usingFallback);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderContent = () => {
    if (activeTab === "hospital") {
      return <HospitalDashboard />;
    }

    if (activeTab === "forecast") {
      return <ForecastDashboard />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-xl text-gray-700">
              Loading dashboard data...
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <div className="text-xl text-gray-700 mb-2">
              Error loading dashboard
            </div>
            <div className="text-sm text-gray-500">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Demo Mode:</strong> Some data shown is sample data because
              one or more API endpoints are unavailable.
            </span>
          </div>
        )}
        {/* ROW 1: Top Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 h-full min-w-0">
            <OverallStatusCard inventory={inventory} facilities={facilities} />
          </div>

          <div className="md:col-span-1 lg:col-span-1 xl:col-span-1 h-full min-w-0">
            <AssetStatusCard assets={assets} />
          </div>

          <div className="md:col-span-1 lg:col-span-1 xl:col-span-1 h-full min-w-0">
            <DeliveryPerformanceCard
              requests={requests}
              shipments={shipments}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1 xl:col-span-1 h-full min-w-0">
            <PendingRequestsCard requests={requests} />
          </div>
        </section>

        {/* ROW 2: Map + Notifications */}
        <section className="grid grid-cols-12 gap-6 mb-6">
          {/* Left Side: Live Map (8 columns) */}
          <div className="col-span-12 lg:col-span-8 h-[600px]">
            <LiveMap shipments={shipments} assets={assets} />
          </div>

          <div className="col-span-12 lg:col-span-4 h-[600px]">
            <NotificationsList />
          </div>
        </section>

        {/* ROW 3: Active Deliveries */}
        <section className="mb-6">
          <ActiveDeliveriesList shipments={shipments} />
        </section>

        {/* ROW 3: Resource Requests List */}
        <section>
          <ResourceRequestsList requests={requests} />
        </section>

        <footer className="text-center mt-8 text-sm text-gray-500">
          Status: Operational (Last Updated {new Date().toLocaleTimeString()})
        </footer>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 md:p-8">
      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assignedHospitalName={assignedHospitalName}
      />

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default LogisDash;
