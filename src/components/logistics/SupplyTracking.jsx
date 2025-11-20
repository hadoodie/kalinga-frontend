import { useEffect, useState } from "react";
import { Construction, Truck, Check, FileQuestionMark, Loader2 } from "lucide-react";
import api from "../../services/api"; 
import LiveTrackingMap from "../../components/logistics/LiveTrackingMap"; 

// Helpers
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

const getStatusVisuals = (status) => {
  switch (status) {
    case "Delayed":
      return { pillClass: "bg-red-500 text-white animate-pulse", icon: <Construction size={16} /> };
    case "Shipped":
    case "On-the-Way":
      return { pillClass: "bg-yellow-400 text-gray-800", icon: <Truck size={16} /> };
    case "Delivered":
      return { pillClass: "bg-green-500 text-white", icon: <Check size={16} /> };
    default:
      return { pillClass: "bg-blue-300 text-blue-800", icon: <FileQuestionMark size={16} /> };
  }
};

const formatRelativeTime = (ping) => {
    return ping || 'N/A';
};

export default function Supply() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null); 

  useEffect(() => {
    const fetchSupplyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/supply-tracking'); 
        setShipments(response.data);
      } catch (err) {
        console.error("Failed to fetch supply data:", err);
        setError("Failed to load tracking data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplyData();
    const interval = setInterval(fetchSupplyData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const criticalShipments = shipments
    .filter(
      (s) =>
        s.status === "Delayed" ||
        s.priority === "Critical" ||
        (s.eta && new Date(s.eta) < Date.now() + 4 * 60 * 60 * 1000)
    )
    .sort((a, b) => new Date(a.eta) - new Date(b.eta));

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 space-y-6 font-inter">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
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
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
              <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
              <p className="mt-2 text-primary font-medium">
                Loading Real-time Data...
              </p>
            </div>
          ) : error ? (
             <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
                <p className="text-lg font-semibold text-red-700">{error}</p>
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
                  onClick={() => setSelectedShipment(s)} 
                  className={`bg-white p-4 rounded-xl shadow-md border-l-4 cursor-pointer ${
                    isCritical
                      ? "border-red-500 shadow-xl"
                      : "border-yellow-500"
                  } transition duration-300 hover:shadow-2xl ${
                    selectedShipment?.id === s.id ? 'ring-2 ring-primary' : '' // Highlight selected
                  }`}
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
                        <span className="text-green-500">{formatRelativeTime(s.lastPing)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* MAP */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-0 flex flex-col h-[60vh] lg:h-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-700">
              Real-time Asset Tracking & Hazard Zones
              </h2>
            </div>
            
            <div className="w-full flex-1 rounded-b-xl overflow-hidden">
              <LiveTrackingMap 
                selectedShipment={selectedShipment} 
                allShipments={shipments.filter(s => s.status !== 'Delivered')}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route (O → D)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Ping</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr><td colSpan="6" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></td></tr>
                ) : (
                    shipments.map((s) => {
                    const { pillClass, icon } = getStatusVisuals(s.status);
                    const isUrgent = s.status === "Delayed" || s.priority === "Critical";
                    return (
                        <tr 
                          key={s.id} 
                          onClick={() => setSelectedShipment(s)} 
                          className={`${
                            isUrgent ? "bg-red-50" : ""
                          } hover:bg-gray-100 cursor-pointer ${
                            selectedShipment?.id === s.id ? 'bg-gray-200' : '' // Highlight selected
                          }`}
                        >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center gap-1 py-1 px-2 text-xs font-semibold status-pill rounded-full ${pillClass}`}>
                            {icon} {s.status}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.route}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isUrgent ? "text-red-700" : "text-gray-900"}`}>
                            {formatETA(s.eta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.contents}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(s.lastPing)}</td>
                        </tr>
                    );
                    })
                )}
                {!loading && shipments.length === 0 && (
                    <tr><td colSpan="6" className="text-center text-gray-500 p-8">No active shipments to display.</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </section>
      </main>
    </div>
  );
}