import { useEffect, useState } from "react";
import { evacMapImg } from "@images";
import {
  Construction,
  Truck,
  Check,
  FileQuestionMark
} from "lucide-react";

const shipmentData = [
  {
    id: "S-7001",
    route: "Depot A → Field Hospital",
    eta: "2025-09-27T18:30:00Z",
    status: "In Transit",
    contents: "Medical Supplies, O+",
    location: [40.71, -74.0],
    lastPing: "3 mins ago",
    priority: "High",
  },
  {
    id: "S-7002",
    route: "Warehouse B → Evacuation Zone 4",
    eta: "2025-09-27T17:15:00Z",
    status: "Delayed",
    contents: "Water, Blankets",
    location: [34.05, -118.24],
    lastPing: "15 mins ago",
    priority: "Critical",
  },
  {
    id: "S-7003",
    route: "Staging Area C → Command Post",
    eta: "2025-09-28T09:00:00Z",
    status: "En Route",
    contents: "Satellite Gear, Batteries",
    location: [51.5, -0.12],
    lastPing: "1 hour ago",
    priority: "Medium",
  },
  {
    id: "S-7004",
    route: "Port D → Refugee Camp 1",
    eta: "2025-09-27T16:00:00Z",
    status: "Delivered",
    contents: "Tents, Food Rations",
    location: [48.85, 2.35],
    lastPing: "Delivered",
    priority: "Medium",
  },
  {
    id: "S-7005",
    route: "Local Donor → Field Triage",
    eta: "2025-09-27T15:05:00Z",
    status: "In Transit",
    contents: "Blood Plasma, Anti-virals",
    location: [41.9, 12.49],
    lastPing: "1 min ago",
    priority: "Critical",
  },
];

// Helpers
const formatETA = (utcDateString) => {
  const date = new Date(utcDateString);
  const now = new Date();
  if (date < now) return "PAST DUE";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusVisuals = (status) => {
  switch (status) {
    case "Delayed":
      return {
        pillClass: "bg-red-500 text-white animate-pulse",
        icon: <Construction size={16} />,
      };
    case "In Transit":
    case "En Route":
      return {
        pillClass: "bg-yellow-400 text-gray-800",
        icon: <Truck size={16} />,
      };
    case "Delivered":
      return {
        pillClass: "bg-green-500 text-white",
        icon: <Check size={16} />,
      };
    default:
      return {
        pillClass: "bg-gray-300 text-gray-800",
        icon: <FileQuestionMark size={16} />,
      };
  }
};

export default function Supply() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    setTimeout(() => {
      setShipments(shipmentData);
      setLoading(false);
    }, 800);
  }, []);

  // Critical shipments (Delayed, Critical, or ETA < 4h)
  const criticalShipments = shipments
    .filter(
      (s) =>
        s.status === "Delayed" ||
        s.priority === "Critical" ||
        new Date(s.eta) < Date.now() + 4 * 60 * 60 * 1000
    )
    .sort((a, b) => new Date(a.eta) - new Date(b.eta));

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 space-y-6 font-inter">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Supply Tracking 
        </h1>
        <div className="flex items-center space-x-3 mt-3 md:mt-0">
          <span className="text-sm font-medium text-gray-500">
            System Readiness:
          </span>
          <span className="flex items-center space-x-2 p-2 rounded-full bg-green-100 text-green-700 font-semibold">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
            <div className="h-3 w-3 bg-green-600 rounded-full"></div>
            <span>Nominal</span>
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRITICAL PANEL */}
        <section className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-700 border-b-2 pb-2">
            Critical Shipment Overview <span className="text-xs"> (ETA &lt; 4h or Delayed)</span>
          </h2>
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary mx-auto"></div>
              <p className="mt-2 text-primary font-medium">
                Loading Real-time Data...
              </p>
            </div>
          ) : criticalShipments.length === 0 ? (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
              <p className="text-lg font-semibold text-green-700">
                All High-Priority Shipments are on schedule. Status Nominal.
              </p>
              <p className="text-sm text-green-600 mt-1">
                Monitor the Full Manifest below for medium priority assets.
              </p>
            </div>
          ) : (
            criticalShipments.map((s) => {
              const { pillClass, icon } = getStatusVisuals(s.status);
              const isCritical =
                s.priority === "Critical" || s.status === "Delayed";
              return (
                <div
                  key={s.id}
                  className={`bg-white p-4 rounded-xl shadow-md border-l-4 ${
                    isCritical
                      ? "border-green-500 shadow-xl"
                      : "border-highlight"
                  } transition duration-300 hover:shadow-2xl`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-500">
                      ID: {s.id}
                    </span>
                    <div className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold status-pill rounded-full ${pillClass}`}>
                      {icon} {s.status}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Route Overview</p>
                    <p className="text-base font-semibold text-gray-700">
                      🛣️ {s.route}
                    </p>
                  </div>
                  <div className="flex justify-between items-end border-t pt-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Estimated Arrival
                      </p>
                      <p
                        className={`text-3xl font-extrabold ${
                          isCritical ? "text-red-700" : "text-primary"
                        } leading-none`}
                      >
                        {formatETA(s.eta)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Contents: {s.contents.split(",")[0]}...
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        Last Ping:{" "}
                        <span className="text-green-500">{s.lastPing}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* MAP */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-0 flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-700">
                Real-time Asset Tracking & Hazard Zones
                </h2>
            </div>

            {/* Map container */}
            <div className="w-full flex-1 rounded-b-xl overflow-hidden">
                <img
                src={evacMapImg}
                alt="Evacuation Map"
                className="w-full h-full object-cover"
                />
            </div>
        </section>

        {/* SHIPMENT TABLE */}
        <section className="lg:col-span-3 w-full bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
            Full Manifest & Historical Data
            </h2>
            <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route (O → D)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETA
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contents
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Ping
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {shipments.map((s) => {
                    const { pillClass, icon } = getStatusVisuals(s.status);
                    const isUrgent =
                    s.status === "Delayed" || s.priority === "Critical";
                    return (
                    <tr
                        key={s.id}
                        className={`${
                        isUrgent
                            ? "bg-red-50 hover:bg-red-100"
                            : "hover:bg-gray-50"
                        }`}
                    >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {s.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center justify-center gap-1 py-1 text-xs font-semibold status-pill rounded-full ${pillClass}`}>
                            {icon} {s.status}
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {s.route}
                        </td>
                        <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                            isUrgent ? "text-red-700" : "text-gray-900"
                        }`}
                        >
                        {formatETA(s.eta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {s.contents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.lastPing}
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
            {!loading && shipments.length === 0 && (
            <p className="text-center text-gray-500 p-8">
                No active shipments to display.
            </p>
            )}
        </section>
      </main>
    </div>
  );
}
