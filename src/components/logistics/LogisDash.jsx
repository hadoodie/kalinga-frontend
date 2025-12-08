
import { useState, useEffect } from "react"; 
import {
  Truck,
  Package,
  Clock,
  MapPin,
  List,
  AlertTriangle,
  ArrowRight,
  CornerDownRight,
  ChartColumnStacked,
  Home,
  CheckCircle,
  Briefcase,
  Wrench,
  ShieldQuestionMark,
  Plus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import resourceService from "../../services/resourceService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from "../../services/api"; 
import { formatDistanceToNow } from 'date-fns';

// IMPORT YOUR LIVE TRACKING MAP COMPONENT HERE
import LiveTrackingMap from "./LiveTrackingMap"; 

// --- MOCK DATA (Fallback only) ---
const MOCK_SHIPMENTS = []; 
const MOCK_FACILITIES = [
  { name: "Central Depot A", resources: 120 },
  { name: "Evac Center 3", resources: 80 },
];
const MOCK_ASSETS = [
  { name: "Truck 1", status: "In Use" },
  { name: "Truck 2", status: "Idle" },
];

// ... [Helper Components] ...

const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications');
        const logisticsNotifs = response.data.filter(n => n.type === 'logistics' || !n.type);
        setNotifications(logisticsNotifs.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch notifications for widget", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) return <div className="text-center text-sm text-gray-500">Loading...</div>;
  if (notifications.length === 0) return <div className="text-center text-sm text-gray-500">No new notifications.</div>;

  return (
    <ul className="space-y-3 text-left">
      {notifications.map((notif) => (
        <li key={notif.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg text-green-800 text-sm border-l-4 border-green-700">
          <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-green-700 rounded-full"></span>
          <div className="flex-1">
            <p className="font-semibold">{notif.title}</p>
            <p className="text-xs text-gray-600">{notif.description || notif.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : notif.time}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "Critical": return "bg-red-100 text-red-800 border-red-400";
    case "High": return "bg-yellow-100 text-yellow-800 border-yellow-400";
    default: return "bg-gray-100 text-gray-800 border-gray-400";
  }
};

// --- UPDATED: Matches SupplyTracking.jsx Visuals ---
const getStatusColor = (status) => {
  switch (status) {
    case "Delayed": return "bg-red-500 text-white animate-pulse";
    case "Shipped":
    case "On-the-Way": return "bg-yellow-400 text-gray-800";
    case "Delivered": return "bg-green-500 text-white";
    default: return "bg-blue-300 text-blue-800";
  }
};

// --- UPDATED: Matches SupplyTracking.jsx Logic (Handles Past Due) ---
const formatETA = (utcDateString) => {
  if (!utcDateString) return "N/A";
  const date = new Date(utcDateString);
  const now = new Date();
  if (date < now) return "PAST DUE";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const FacilityPieChart = ({ data }) => {
  const COLORS = ['#394e2c', '#FBBF24', '#f0d003', '#fae526','#34D399', '#1c2414'];
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-gray-400">No facility data</div>;
  
  const facilityResourceData = data.map(item => ({ name: item.name, value: item.resources }));
  const renderTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.resources, 0);
      const value = payload[0].value;
      const percent = ((value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg text-sm shadow-xl text-gray-900 border border-gray-300">
          <p className="font-bold text-lg">{payload[0].name}</p>
          <p className="text-gray-600">{value} total resources ({percent}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={facilityResourceData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
          {facilityResourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip content={renderTooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const OverallStatusCard = ({ inventory, facilities }) => {
  const totalRemaining = inventory?.reduce((sum, i) => sum + (i.remaining || 0), 0) || 0;
  const criticalCount = inventory?.filter(i => i.status === 'Critical').length || 0;
  const facilityCount = facilities?.length || 0;
  const itemCategories = [...new Set(inventory?.map(i => i.category) || [])].length;

  return (
    <Link to="/logistics/resource-management" className="block h-full">
      <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col h-full text-gray-900 border border-gray-200">
        <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4 border-b border-gray-100 pb-2 md:pb-3 text-center">
          Resource Overview
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-1 flex-1">
          <div className="w-full sm:w-1/2 flex flex-col justify-start items-center sm:items-start">
            <p className="text-3xl md:text-5xl font-extrabold mb-2 md:mb-4">{totalRemaining}</p>
            <div className="space-y-1 text-sm md:text-base">
              <p className="font-medium text-gray-600 flex items-center">
                <Home className="h-4 w-4 mr-1 text-gray-500" /> {facilityCount} Facilities
              </p>
              <p className="font-medium text-gray-600 flex items-center">
                <Briefcase className="h-4 w-4 mr-1 text-gray-500" /> {itemCategories} Categories
              </p>
              <p className="font-medium text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" /> {criticalCount} Critical
              </p>
            </div>
          </div>
          <div className="w-full sm:w-1/2 h-32 md:h-auto flex flex-col justify-center items-center">
            {facilities && facilities.length > 0 ? (
              <FacilityPieChart data={facilities} />
            ) : (
              <p className="text-gray-400 text-sm">No facility data</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const AssetStatusCard = ({ assets }) => {
  const totalAssets = assets?.length || 0;
  const inUse = assets?.filter(a => a.status === 'In Use').length || 0;
  const repair = assets?.filter(a => a.status === 'Repair').length || 0;
  const idle = totalAssets - inUse - repair;

  return (
    <Link to="/logistics/asset-registry" className="block h-full">
      <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-base md:text-xl font-bold border-b border-gray-100 pb-2 md:pb-3 text-center mb-3">
          Asset Registry Status
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div className="text-3xl md:text-5xl font-extrabold flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start">
            {totalAssets}
            <span className="text-sm md:text-base font-medium mt-1 sm:mt-0 sm:ml-2 text-gray-600">
              Total Assets
            </span>
          </div>
          <p className="text-sm md:text-base font-semibold text-green-600 flex items-center justify-center sm:justify-start">
            <ChartColumnStacked className="h-4 w-4 mr-1" /> {inUse} Active
          </p>
          <p className="text-sm md:text-base font-semibold text-gray-700 flex items-center justify-center sm:justify-start">
            <ShieldQuestionMark className="h-4 w-4 mr-1" /> {idle} Unassigned
          </p>
          <p className="text-sm md:text-base font-semibold text-gray-700 flex items-center justify-center sm:justify-start">
            <Wrench className="h-4 w-4 mr-1" /> {repair} Under Repair
          </p>
        </div>
      </div>
    </Link>
  );
};

const DeliveryPerformanceCard = ({ requests, shipments }) => {
  const delayed = shipments?.filter((s) => s.status === "Delayed").length || 0;
  const avgDispatchTime = "45";
  const avgDispatchUnit = "m";

  return (
    <Link to="/logistics/supply-tracking" className="block h-full">
      <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-base md:text-xl font-bold mb-3 border-b border-gray-100 pb-2 md:pb-3 text-center">
          Delivery Performance
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4">
          <div className="text-3xl md:text-5xl font-extrabold flex flex-row items-baseline justify-center sm:justify-start">
            {avgDispatchTime}
            <span className="text-xl md:text-2xl font-extrabold mr-1">{avgDispatchUnit}</span>
            <span className="text-xs md:text-sm font-light ml-2 text-gray-600">Avg Dispatch</span>
          </div>
          <p className="text-sm md:text-base font-semibold text-red-600 flex items-center justify-center sm:justify-start">
            <AlertTriangle className="h-4 w-4 mr-1" /> {delayed} Delayed
          </p>
          <div className="text-sm md:text-base font-medium flex items-center text-gray-600 justify-center sm:justify-start">
            <CheckCircle className="mr-1 h-4 w-4" /> 80% On-Time Success
          </div>
        </div>
      </div>
    </Link>
  );
};

const PendingRequestsCard = ({ requests }) => {
  const totalPending = requests?.filter(r => r.status === 'Pending').length || 0;
  const criticalRequests = requests?.filter(r => r.urgency === 'Critical').length || 0;
  const highRequests = requests?.filter(r => r.urgency === 'High').length || 0;

  return (
    <Link to="/logistics/requested-allocation" className="block h-full">
      <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-base md:text-xl font-bold border-b border-gray-100 pb-2 md:pb-3 text-center mb-3">
          Requested Allocation
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div className="text-3xl md:text-5xl font-extrabold flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start">
            {totalPending}
            <span className="text-sm md:text-base font-medium mt-1 sm:mt-0 sm:ml-2 text-gray-600">
              Pending
            </span>
          </div>
          <p className="text-sm md:text-base font-semibold text-red-600 flex items-center justify-center sm:justify-start">
            <AlertTriangle className="h-4 w-4 mr-1" /> {criticalRequests} Critical
          </p>
          <p className="text-sm md:text-base font-semibold text-yellow-600 flex items-center justify-center sm:justify-start">
            <Clock className="h-4 w-4 mr-1" /> {highRequests} High Priority
          </p>
        </div>
      </div>
    </Link>
  );
};

const LiveMap = ({ shipments, selectedShipment, onShipmentSelect, navigate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-0 flex flex-col h-full overflow-hidden relative group">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white z-10 relative">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-green-800" /> Real-time Asset Tracking
        </h2>
        <span className="text-xs text-green-600 font-semibold animate-pulse flex items-center">
          ● Live
        </span>
      </div>
    
      <div 
        className="w-full flex-1 relative cursor-pointer"
        onClick={() => navigate('/logistics/live-map')} 
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 z-[400] transition-colors flex items-center justify-center pointer-events-none">
           <span className="bg-white/90 text-green-800 px-4 py-2 rounded-full shadow-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
             View Full Screen Map
           </span>
        </div>

        <div className="w-full h-full pointer-events-none"> 
           <LiveTrackingMap 
             selectedShipment={selectedShipment} 
             allShipments={shipments ? shipments.filter(s => s.status !== 'Delivered') : []}
             onShipmentSelect={onShipmentSelect}
           />
        </div>
      </div>
    </div>
  );
};

const NotificationsList = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">Notifications</h2>
      </div>
      <div className="overflow-y-auto pr-2 flex-1">
        <NotificationWidget />
      </div>
    </div>
  );
};

// --- UPDATED: ActiveDeliveriesList (Mobile Responsive) ---
const ActiveDeliveriesList = ({ shipments }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-4 md:p-5">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center">
        <Truck className="h-5 w-5 mr-2 text-green-800" /> Active Deliveries
      </h2>
      
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-3">
        {shipments && shipments.length > 0 ? (
          shipments.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-3 hover:bg-green-50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">#{s.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(s.status)}`}>
                  {s.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="flex items-center text-gray-700">
                  <CornerDownRight className="h-3 w-3 mr-1 text-gray-400" />
                  {s.route}
                </p>
                <p className="text-gray-600">{s.contents}</p>
                <p className="font-bold text-gray-900">ETA: {formatETA(s.eta)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-8 text-gray-500">No active shipments</p>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
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
                <tr key={s.id} className="hover:bg-green-50">
                  <td className="px-3 py-2 text-center font-semibold">{s.id}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="flex items-center justify-center">
                      <CornerDownRight className="h-4 w-4 mr-1 text-gray-400" />
                      {s.route}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{s.contents}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-gray-600">{formatETA(s.eta)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">No active shipments</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-3 text-right">
        <Link to="/logistics/supply-tracking" className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center justify-end">
          View All Shipments <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// --- UPDATED: ResourceRequestsList (Mobile Responsive) ---
const ResourceRequestsList = ({ requests }) => (
  <div className="col-span-12 bg-white rounded-2xl shadow-md border p-4 md:p-5">
    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center">
      <List className="h-5 w-5 mr-2 text-green-800" /> Pending Resource Requests
    </h2>
    
    {/* Mobile View - Cards */}
    <div className="block md:hidden space-y-3">
      {requests && requests.length > 0 ? (
        requests.slice(0, 5).map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-lg p-3 hover:bg-green-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-sm">Request #{r.id}</span>
                <p className="text-xs text-gray-500 mt-1">{r.time}</p>
              </div>
              <span className={`px-2 py-1 rounded-full border text-xs ${getUrgencyColor(r.urgency)}`}>
                {r.urgency}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">{r.location}</p>
              <p className="font-bold text-green-600">{r.items}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center py-8 text-gray-500">No pending requests</p>
      )}
    </div>

    {/* Desktop View - Table */}
    <div className="hidden md:block overflow-x-auto">
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
            requests.slice(0, 5).map((r) => (
              <tr key={r.id} className="hover:bg-green-50">
                <td className="px-3 py-2 text-center">{r.id}</td>
                <td className="px-3 py-2 text-center">{r.location}</td>
                <td className="px-3 py-2 text-center font-bold text-green-600">{r.items}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full border ${getUrgencyColor(r.urgency)}`}>
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-gray-500">{r.time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">No pending requests</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    
    <div className="mt-3 text-right">
      <Link to="/logistics/requested-allocation" className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center justify-end">
        View Full Allocation <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  </div>
);

// --- MAIN APPLICATION COMPONENT ---
const LogisDash = () => {
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [shipments, setShipments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assets] = useState(MOCK_ASSETS);
  
  const [selectedShipment, setSelectedShipment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Inventory
        const resourcesResponse = await resourceService.getAll();
        const inventoryData = resourcesResponse.map(item => ({
          resource: item.name,
          category: item.category,
          remaining: parseFloat(item.quantity || 0),
          unit: item.unit,
          status: item.status,
          facility: item.location
        }));
        setInventory(inventoryData);

        // 2. Fetch Allocation Requests 
        const requestsResponse = await api.get('/incoming-requests');
        const formattedRequests = requestsResponse.data.map(req => ({
            id: req.request_id || req.id,
            location: req.source_location,
            items: req.item_quantity ? `${req.item_quantity}x ${req.item_name}` : req.item_name, 
            urgency: req.urgency,
            status: req.status, 
            time: req.created_at ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true }) : 'Recent'
        }));
        setRequests(formattedRequests);

        // 3. Fetch Supply Tracking (Shipments)
        const supplyResponse = await api.get('/supply-tracking');
        setShipments(supplyResponse.data);

        // 4. Process Inventory for Facility Pie Chart
        const facilityMap = {};
        resourcesResponse.forEach(item => {
          const facilityName = item.location || 'Unknown';
          const remaining = parseFloat(item.quantity || 0);
          if (!facilityMap[facilityName]) {
            facilityMap[facilityName] = { name: facilityName, resources: 0 };
          }
          facilityMap[facilityName].resources += remaining;
        });
        setFacilities(Object.values(facilityMap).filter(f => f.resources > 0));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
        setInventory(MOCK_SHIPMENTS);
        setFacilities(MOCK_FACILITIES);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl text-gray-700 mb-2">Error loading dashboard</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 md:p-8">
      <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-extrabold">Logistics Dashboard</h1>
        <p className="text-gray-500 text-sm md:text-base mt-1">Real-time resource allocation & tracking</p>
      </header>

      {/* ROW 1: Top Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 lg:col-span-1 h-full"><OverallStatusCard inventory={inventory} facilities={facilities} /></div>
        <div className="md:col-span-1 lg:col-span-1 h-full"><AssetStatusCard assets={assets} /></div>
        <div className="md:col-span-1 lg:col-span-1 h-full"><DeliveryPerformanceCard requests={requests} shipments={shipments} /></div>
        <div className="md:col-span-1 lg:col-span-1 h-full"><PendingRequestsCard requests={requests} /></div>
      </section>

      {/* ROW 2: Map + Notifications */}
      <section className="grid grid-cols-12 gap-6 mb-6">
        {/* Left Side: Live Map */}
        <div className="col-span-12 lg:col-span-8 h-[400px] md:h-[600px]">
          <LiveMap 
            shipments={shipments}
            selectedShipment={selectedShipment}
            onShipmentSelect={setSelectedShipment}
            navigate={navigate}
          />
        </div>

        {/* Right Side: Notifications */}
        <div className="col-span-12 lg:col-span-4 h-[400px] md:h-[600px]">
          <NotificationsList />
        </div>
      </section>
          
      {/* ROW 3: Active Deliveries */}
      <section className="mb-6">
        <ActiveDeliveriesList shipments={shipments} />
      </section>

      {/* ROW 4: Resource Requests List */}
      <section>
        <ResourceRequestsList requests={requests} />
      </section>

      <footer className="text-center mt-8 text-sm text-gray-500">
        Status: Operational (Last Updated {new Date().toLocaleTimeString()})
      </footer>
    </div>
  );
};

export default LogisDash;