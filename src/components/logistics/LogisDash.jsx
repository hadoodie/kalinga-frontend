import { useState } from "react";
import {
  Truck,
  Package,
  Clock,
  MapPin,
  List,
  AlertTriangle,
  ArrowRight,
  CornerDownRight,
} from "lucide-react";
import { evacMapImg } from "@images";
import { Link, useNavigate } from "react-router-dom";

// --- MOCK DATA ---
const MOCK_RESOURCE_REQUESTS = [
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
  {
    id: "R-1004",
    location: "Sector 5 Base",
    urgency: "Critical",
    time: "1 hour ago",
    items: 4,
  },
  {
    id: "R-1005",
    location: "Coastal Village 1",
    urgency: "Medium",
    time: "4 hours ago",
    items: 2,
  },
];
const MOCK_INVENTORY_ITEMS = [
  {
    resource: "Rice",
    category: "Food",
    remaining: 30,
    unit: "kg",
    status: "Critical",
  },
  {
    resource: "Canned Goods",
    category: "Food",
    remaining: 90,
    unit: "cans",
    status: "High",
  },
  {
    resource: "Soap",
    category: "Hygiene",
    remaining: 75,
    unit: "boxes",
    status: "Moderate",
  },
  {
    resource: "Bottled Water",
    category: "Water",
    remaining: 300,
    unit: "bottles",
    status: "High",
  },
  {
    resource: "Tents",
    category: "Shelter",
    remaining: 15,
    unit: "units",
    status: "Critical",
  },
  {
    resource: "Medical Kits",
    category: "Medical",
    remaining: 70,
    unit: "kits",
    status: "High",
  },
];
const MOCK_SHIPMENTS = [
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
  {
    id: "S-7003",
    route: "Staging Area C → Command Post",
    eta: "2025-09-29T22:00:00Z",
    status: "En Route",
    contents: "Satellite Gear",
    priority: "Medium",
  },
  {
    id: "S-7004",
    route: "HQ Depot → Barangay San Jose",
    eta: "2025-09-29T21:15:00Z",
    status: "In Transit",
    contents: "Food Rations",
    priority: "High",
  },
];

// --- HELPERS ---
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

// --- COMPONENTS ---
const ResourceRequestsSummary = ({ requests }) => {
  const criticalCount = requests.filter((r) => r.urgency === "Critical").length;
  const highCount = requests.filter((r) => r.urgency === "High").length;
  return (
    <div className="text-left p-5 bg-white rounded-2xl shadow-md border hover:shadow-xl transition flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700">
          Pending Requests
        </h2>
        <List className="h-5 w-5 text-green-500" />
      </div>
      <p className="text-3xl md:text-5xl font-extrabold text-green-600 mt-3">
        {requests.length}
      </p>
      <div className="mt-3 text-sm">
        <p className="flex items-center text-red-600 font-medium">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {criticalCount} Critical
        </p>
        <p className="text-highlight font-medium">{highCount} High Priority</p>
      </div>
    </div>
  );
};

const TotalResourcesSummary = ({ inventory }) => {
  const totalCritical = inventory.filter((i) => i.status === "Critical").length;
  const totalCategories = new Set(inventory.map((i) => i.category)).size;
  return (
    <div className="text-left p-5 bg-white rounded-2xl shadow-md border hover:shadow-xl transition flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700">
          Total Resource Items
        </h2>
        <Package className="h-5 w-5 text-green-500" />
      </div>
      <p className="text-3xl md:text-5xl font-extrabold text-green-600 mt-3">
        {inventory.length}
      </p>
      <div className="mt-3 text-sm">
        <p className="font-medium text-gray-600">
          {totalCategories} Distinct Categories
        </p>
        <p className="text-red-600 font-medium">{totalCritical} Critical</p>
      </div>
    </div>
  );
};

const DeliveryStats = ({ shipments }) => {
  const delayed = shipments.filter((s) => s.status === "Delayed").length;
  return (
    <div className="text-left p-5 bg-white rounded-2xl shadow-md border hover:shadow-xl transition flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700">
          Delivery Performance
        </h2>
        <Clock className="h-5 w-5 text-highlight" />
      </div>
      <p className="text-3xl md:text-5xl font-extrabold text-highlight mt-3">
        1.5h
      </p>
      <div className="mt-3 text-sm">
        <p className="font-medium text-gray-600">85% On-Time</p>
        <p className="text-red-600 font-medium">{delayed} Delayed</p>
      </div>
    </div>
  );
};

const LiveMap = () => (
  <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-md border p-5 flex flex-col h-[400px] md:h-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
      <MapPin className="h-5 w-5 mr-2 text-red-500" /> Live Tracking Map
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

// 4. Active Deliveries
const ActiveDeliveriesList = ({ shipments }) => {
  return (
    <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 h-[450px] md:h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <Truck className="h-6 w-6 mr-2 text-primary" />
        Active Deliveries
      </h2>
      <div className="space-y-3 overflow-y-auto pr-2 flex-1">
        {shipments.map((s) => (
          <div
            key={s.id}
            className={`p-3 rounded-xl border-l-4 ${
              s.status === "Delayed"
                ? "border-red-500 bg-red-50"
                : "border-primary bg-green-50"
            } shadow-sm`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-gray-800 flex items-center">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${getStatusColor(
                    s.status
                  )}`}
                >
                  {s.status}
                </span>
                {s.id}
              </span>
              <span className="text-xs font-bold text-gray-600">
                {formatETA(s.eta)} ETA
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 flex items-start">
              <CornerDownRight className="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{s.route}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5 pl-5">
              Contents: {s.contents}
            </p>
          </div>
        ))}
      </div>
      {shipments.length === 0 && (
        <p className="text-center text-gray-500 p-8">
          No active shipments to display.
        </p>
      )}
    </div>
  );
};

const ResourceRequestsList = ({ requests }) => (
  <div className="col-span-12 bg-white rounded-2xl shadow-md border p-5">
    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
      <List className="h-5 w-5 mr-2 text-green-500" /> Pending Resource Requests
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
          {requests.map((r) => (
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
          ))}
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

// --- MAIN DASHBOARD ---
export default function LogisticsDashboard() {
  const [requests] = useState(MOCK_RESOURCE_REQUESTS);
  const [inventory] = useState(MOCK_INVENTORY_ITEMS);
  const [shipments] = useState(MOCK_SHIPMENTS);

  return (
    <div className="min-h-screen bg-background font-sans p-4 md:p-8">
      <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          Logistics Dashboard
        </h1>
        <p className="text-gray-500 text-sm md:text-base mt-1">
          Real-time resource allocation & tracking
        </p>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <TotalResourcesSummary inventory={inventory} />
        <DeliveryStats shipments={shipments} />
        <ResourceRequestsSummary requests={requests} />
      </section>

      {/* Map + Deliveries */}
      <section className="grid grid-cols-12 gap-6 mb-6">
        <LiveMap />
        <ActiveDeliveriesList shipments={shipments} />
      </section>

      {/* Resource Requests */}
      <section>
        <ResourceRequestsList requests={requests} />
      </section>

      <footer className="text-center mt-8 text-xs text-gray-400">
        Status: Operational (Last Updated {new Date().toLocaleTimeString()})
      </footer>
    </div>
  );
}
