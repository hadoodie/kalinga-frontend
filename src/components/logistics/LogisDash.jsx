import React, { useState, useEffect } from "react"; // Combined imports
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
} from "lucide-react";
import { evacMapImg } from "@images";
import { Link, useNavigate } from "react-router-dom"; 
import resourceService from "../../services/resourceService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from "../../services/api"; 
import { formatDistanceToNow } from 'date-fns';

// --- MOCK DATA ---
const MOCK_RESOURCE_REQUESTS = [
  { id: "R-1001", location: "Barangay San Jose", urgency: "Critical", time: "2 hours ago", items: 3 },
  { id: "R-1002", location: "Evacuation Center 3", urgency: "High", time: "3 hours ago", items: 2 },
  { id: "R-1003", location: "Field Hospital Beta", urgency: "Medium", time: "5 hours ago", items: 1 },
  { id: "R-1004", location: "Sector 5 Base", urgency: "Critical", time: "1 hour ago", items: 4 },
  { id: "R-1005", location: "Coastal Village 1", urgency: "Medium", time: "4 hours ago", items: 2 },
  { id: "R-1006", location: "Alpha Hospital", urgency: "Shipped", time: "4 hours ago", items: 2 },
];

const MOCK_INVENTORY_ITEMS = [
  { resource: "Rice", category: "Food", remaining: 30, unit: "kg", status: "Critical" },
  { resource: "Canned Goods", category: "Food", remaining: 90, unit: "cans", status: "High" },
  { resource: "Soap", category: "Hygiene", remaining: 75, unit: "boxes", status: "Moderate" },
  { resource: "Bottled Water", category: "Water", remaining: 300, unit: "bottles", status: "High" },
  { resource: "Tents", category: "Shelter", remaining: 15, unit: "units", status: "Critical" },
  { resource: "Medical Kits", category: "Medical", remaining: 70, unit: "kits", status: "High" },
];

const MOCK_SHIPMENTS = [
  { id: "S-7001", route: "Depot A → Field Hospital", eta: "2025-09-29T20:30:00Z", status: "In Transit", contents: "Medical Supplies", priority: "High" },
  { id: "S-7002", route: "Warehouse B → Evac Zone 4", eta: "2025-09-29T19:45:00Z", status: "Delayed", contents: "Water, Blankets", priority: "Critical" },
  { id: "S-7003", route: "Staging Area C → Command Post", eta: "2025-09-29T22:00:00Z", status: "En Route", contents: "Satellite Gear", priority: "Medium" },
  { id: "S-7004", route: "HQ Depot → Barangay San Jose", eta: "2025-09-29T21:15:00Z", status: "In Transit", contents: "Food Rations", priority: "High" },
];

const MOCK_FACILITIES = [
  { name: "Central Depot A", resources: 120 },
  { name: "Evac Center 3", resources: 80 },
  { name: "Field Hospital Beta", resources: 150 },
  { name: "Sector 5 Base", resources: 60 },
  { name: "Warehouse B", resources: 90 },
  { name: "Clinic 1", resources: 100 },
  { name: "Clinic 2", resources: 120 },
];

const MOCK_ASSETS = [
  { name: "Truck 1", status: "In Use" },
  { name: "Truck 2", status: "Idle" },
  { name: "Generator 1", status: "In Use" },
  { name: "Satellite Kit B", status: "Idle" },
  { name: "Drone 3", status: "In Use" },
  { name: "Truck 3", status: "Repair" },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Low Stock Alert", message: "Rice inventory at Central Depot A is below minimum threshold (30 kg remaining)", priority: "Critical", time: "5 mins ago", read: false },
  { id: 2, title: "Delayed Shipment", message: "S-7002 to Evac Zone 4 is delayed by 45 minutes", priority: "High", time: "15 mins ago", read: false },
  { id: 3, title: "Asset Maintenance Due", message: "Truck 3 scheduled for maintenance check", priority: "Medium", time: "1 hour ago", read: true },
  { id: 4, title: "New Resource Request", message: "Critical request from Barangay San Jose - 3 items needed", priority: "Critical", time: "2 hours ago", read: false },
  { id: 5, title: "Delivery Completed", message: "S-7001 successfully delivered to Field Hospital", priority: "Low", time: "3 hours ago", read: true },
];

const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications');
        console.log('Fetched notifications:', response.data); // DEBUG LOG
        
        // Filter for logistics notifications only
        const logisticsNotifs = response.data.filter(n => 
          n.type === 'logistics' || !n.type // Include if no type field
        );
        
        setNotifications(logisticsNotifs.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch notifications for widget", err);
        // Fallback to mock data with type field
        const mockWithType = MOCK_NOTIFICATIONS.map(n => ({ ...n, type: 'logistics' }));
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
    return <div className="text-center text-sm text-gray-500">No new notifications.</div>;
  }

  return (
    <ul className="space-y-3 text-left">
      {notifications.map((notif) => (
        <li key={notif.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg text-primary text-sm border-l-4 border-green-700">
          <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-green-700 rounded-full"></span>
          <div className="flex-1">
            <p className="font-semibold">{notif.title}</p>
            <p className="text-xs text-gray-600">{notif.description || notif.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {notif.created_at 
                ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })
                : notif.time
              }
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
      return "text-red-600 bg-red-50";
    case "In Transit":
    case "En Route":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
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
const FacilityPieChart = ({ data }) => {
  const COLORS = [ '#34D399', '#1c2414', '#394e2c', '#FBBF24', '#f0d003', '#fae526'];

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No facility data
      </div>
    );
  }

  const facilityResourceData = data.map(item => ({
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
          <p className="text-gray-600">{value} total resources ({percent}%)</p>
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
          innerRadius={35}
          outerRadius={60}
          dataKey="value"
          labelLine={false}
          paddingAngle={3}
        >
          {facilityResourceData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
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
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold mb-4 border-b border-gray-100 pb-3 flex justify-center items-center">Resource Overview</h3>
        <div className="flex flex-col md:flex-row gap-1 flex-1">
          <div className="w-full md:w-1/2 flex flex-col justify-start items-start">
            <p className="text-5xl font-extrabold mb-4">{totalRemaining}</p>
            <div className="space-y-1 text-15px">
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

          <div className="w-full md:w-1/2 flex flex-col justify-center items-center">
            {facilities && facilities.length > 0 ? (
              <>
                <FacilityPieChart data={facilities} />
                {/* Legend removed */}
              </>
            ) : (
              <p className="text-gray-400">No facility data</p>
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
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold border-b border-gray-100 pb-3 flex justify-center items-center"> Asset Registry Status</h3>
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <div className="text-5xl font-extrabold flex items-baseline">
            {totalAssets} 
            <span className="text-lg font-medium ml-2 text-gray-600">Total Registered Assets</span>
          </div>
          
          <p className="text-15px font-semibold mt-1 text-green-600 flex items-center">
            <ChartColumnStacked className="h-4 w-4 mr-1 text-green-600" /> {inUse} Active Assets
          </p>
          <p className="text-15px font-semibold text-gray-700 flex items-center">
            <ShieldQuestionMark className="h-4 w-4 mr-1 text-gray-500" /> {idle} Assets Unassigned
          </p>
          <p className="text-15px font-semibold text-gray-700 flex items-center">
            <Wrench className="h-4 w-4 mr-1 text-gray-500" /> {repair} Vehicles Under Repair
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
        <h3 className="text-xl font-bold mb-0 border-b border-gray-100 pb-3 flex justify-center items-center"> Delivery Performance</h3>
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="text-5xl font-extrabold flex flex-row items-baseline">
            {avgDispatchTime} <span className="text-2xl font-extrabold mr-1">{avgDispatchUnit}</span>
            <span className="text-sm font-light ml-2 text-gray-600">Avg Dispatch Time</span>
          </div>
          
          <p className="text-15px font-semibold text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-600" /> {delayed} Delayed Shipments
          </p>

          <div className="text-15px font-medium flex items-center text-gray-600">
            <CheckCircle className="mr-1 h-4 w-4" /> 80% On-Time Success
          </div>
        </div>
      </div>
    </Link>
  );
};

const PendingRequestsCard = ({ requests }) => {
  const totalRequests = requests?.length || 0;
  const criticalRequests = requests?.filter(r => r.urgency === 'Critical').length || 0;
  const shippedRequests = requests?.filter(r => r.urgency === 'Shipped').length || 0;
  const highRequests = requests?.filter(r => r.urgency === 'High').length || 0;

  return (
    <Link to="/logistics/requested-allocation" className="block h-full">
      <div className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between h-full text-gray-900 border border-gray-200">
        <h3 className="text-xl font-bold border-b border-gray-100 pb-3 flex justify-center items-center">
            Requested Allocation
        </h3>
        
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <div className="text-5xl font-extrabold flex items-baseline">
            {totalRequests} <span className="text-lg font-medium ml-2 text-gray-600">Total Pending Requests</span>
          </div>
          
          <p className="text-15px font-semibold mt-1 text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-600" /> {criticalRequests} Critical
          </p>
          <p className="text-15px font-semibold text-yellow-600 flex items-center">
            <Clock className="h-4 w-4 mr-1 text-yellow-600" /> {highRequests} High Priority
          </p>
          <p className="text-15px font-semibold text-gray-600 flex items-center">
            <Truck className="h-4 w-4 mr-1 text-gray-600" /> {shippedRequests} Shipments Dispatched
          </p>
        </div>
      </div>
    </Link>
    
  );
};

const LiveMap = () => (
  <div className="bg-white rounded-2xl shadow-md border p-5 flex flex-col h-full">
    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
      <MapPin className="h-5 w-5 mr-2 text-green-800" /> Live Tracking Map
    </h2>
    <div className="flex-1 relative rounded-xl overflow-hidden">
      <img src={evacMapImg} alt="Map" className="w-full h-full object-cover" />
      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow">
        4 Active Vehicles
      </div>
      <Truck className="h-6 w-6 text-green-800 absolute top-[50%] left-[30%]" />
      <Truck className="h-6 w-6 text-red-800 absolute top-[20%] left-[60%]" />
      <Truck className="h-6 w-6 text-green-800 absolute bottom-[10%] right-[40%]" />
    </div>
  </div>
);

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
        <Truck className="h-5 w-5 mr-2 text-green-800" />
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
          className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center justify-end"
        >
          View All Shipments <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

const ResourceRequestsList = ({ requests }) => (
  <div className="col-span-12 bg-white rounded-2xl shadow-md border p-5">
    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
      <List className="h-5 w-5 mr-2 text-green-800" /> Pending Resource Requests
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
              <tr key={r.id} className="hover:bg-green-50">
                <td className="px-3 py-2 text-center">{r.id}</td>
                <td className="px-3 py-2 text-center">{r.location}</td>
                <td className="px-3 py-2 text-center font-bold text-green-600">
                  {r.items}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full border ${getUrgencyColor(
                      r.urgency
                    )}`}
                  >
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-gray-500">{r.time}</td>
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
        className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center justify-end"
      >
        View Full Allocation <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  </div>
);

// --- MAIN APPLICATION COMPONENT ---
const LogisDash = () => {
  const [requests] = useState(MOCK_RESOURCE_REQUESTS);
  const [inventory, setInventory] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shipments] = useState(MOCK_SHIPMENTS);
  const [assets] = useState(MOCK_ASSETS);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all resources
      const resourcesResponse = await resourceService.getAll();
      
      console.log('Resources Response:', resourcesResponse); // Debug log

      // Transform the data to match the inventory format
      const inventoryData = resourcesResponse.map(item => ({
        resource: item.name,
        category: item.category,
        remaining: parseFloat(item.quantity || 0), // quantity is already the remaining stock
          unit: item.unit,
          status: item.status,
          facility: item.location
      }));

      setInventory(inventoryData);

      // Group resources by actual hospital/facility name
      const facilityMap = {};

      resourcesResponse.forEach(item => {
        const facilityName = item.location || 'Unknown';
        const remaining = parseFloat(item.quantity || 0);
          
          if (!facilityMap[facilityName]) {
            facilityMap[facilityName] = {
              name: facilityName,
              resources: 0
            };
          }
          
          facilityMap[facilityName].resources += remaining;
        });

      // Only include facilities that have resources
      const facilitiesData = Object.values(facilityMap).filter(f => f.resources > 0);
      setFacilities(facilitiesData);

      console.log('Inventory Data:', inventoryData); // Debug log
      console.log('Facilities Data:', facilitiesData); // Debug log

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      // Fallback to mock data on error
      setInventory(MOCK_INVENTORY_ITEMS);
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
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 md:p-8">
      <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold">
          Logistics Dashboard
        </h1>
        <p className="text-gray-500 text-sm md:text-base mt-1">
          Real-time resource allocation & tracking
        </p>
      </header>

      {/* ROW 1: Top Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 lg:col-span-1 h-full">
          <OverallStatusCard inventory={inventory} facilities={facilities} />
        </div>

        <div className="md:col-span-1 lg:col-span-1 h-full">
          <AssetStatusCard assets={assets} />
        </div>

        <div className="md:col-span-1 lg:col-span-1 h-full">
          <DeliveryPerformanceCard requests={requests} shipments={shipments} />
        </div>

        <div className="md:col-span-1 lg:col-span-1 h-full">
          <PendingRequestsCard requests={requests} />
        </div>
      </section>

      {/* ROW 2: Map + Notifications */}
      <section className="grid grid-cols-12 gap-6 mb-6">
        {/* Left Side: Live Map (8 columns) */}
        <div className="col-span-12 lg:col-span-8 h-[600px]">
          <LiveMap />
        </div>

        <div className="col-span-12 lg:col-span-4 h-[600px]">
          <NotificationsList  />
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
    </div>
  );
};

export default LogisDash;
