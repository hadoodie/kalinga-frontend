import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Construction,
  Truck,
  Check,
  Package,
  Loader2,
  X,
  MapPin,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";
import LiveTrackingMap from "../components/logistics/LiveTrackingMap";

const getStatusVisuals = (status) => {
  switch (status) {
    case "Delayed":
      return {
        color: "text-red-700",
        bgPill: "bg-red-100",
        icon: <Construction size={14} />,
      };
    case "Shipped":
    case "On-the-Way":
      return {
        color: "text-yellow-700",
        bgPill: "bg-yellow-100",
        icon: <Truck size={14} />,
      };
    case "Delivered":
      return {
        color: "text-green-700",
        bgPill: "bg-green-100",
        icon: <Check size={14} />,
      };
    default:
      return {
        color: "text-blue-700",
        bgPill: "bg-blue-100",
        icon: <Package size={14} />,
      };
  }
};

export const LiveMapPage = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for user's current location (HQ)
  const [userLocation, setUserLocation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch Shipments Data
  useEffect(() => {
    const fetchSupplyData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/supply-tracking");
        setShipments(response.data);
      } catch (err) {
        console.error("Failed to fetch supply data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplyData();
  }, []);

  // Fetch User's Current Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
      );
    }
  }, []);

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-background font-inter overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`h-[40vh] md:h-full bg-white shadow-2xl z-20 flex flex-col relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-full md:w-[400px]" : "w-0 overflow-hidden"}`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white text-slate-800 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Previous Page
            </button>
            <h1 className="text-lg font-bold">Live Tracking</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Shipment List */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 text-left bg-white">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white py-2 z-10 flex justify-between items-center">
            <span>Active Shipments</span>
            {userLocation && (
              <span className="text-[10px] text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                <MapPin size={10} className="mr-1" /> HQ Online
              </span>
            )}
          </h3>

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : shipments.filter((s) => s.status !== "Delivered").length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">
              No active shipments.
            </p>
          ) : (
            shipments
              .filter((s) => s.status !== "Delivered")
              .map((s) => {
                const { color, icon, bgPill } = getStatusVisuals(s.status);
                const isSelected = selectedShipment?.id === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all shadow-sm flex flex-col gap-2 ${
                      isSelected
                        ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-sm truncate pr-2">
                        {s.route}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${color} ${bgPill}`}
                      >
                        {icon} {s.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-1 text-sm text-slate-600">
                      <div className="truncate flex-1 pr-2 font-medium">
                        {s.contents?.replace(
                          /Qty:\s*(\d+(?:\.\d+)?)/g,
                          (match, p1) => `Qty: ${parseInt(p1, 10)}`,
                        )}
                      </div>
                      <div className="font-bold text-slate-700 whitespace-nowrap">
                        ETA:{" "}
                        {new Date(s.eta).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </aside>

      {/* MAP AREA */}
      <main className="flex-1 h-[60vh] md:h-full relative order-first md:order-last">
        {/* Toggle Sidebar Button (when closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-[1000] bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <List size={20} />
          </button>
        )}

        <LiveTrackingMap
          selectedShipment={selectedShipment}
          allShipments={shipments.filter((s) => s.status !== "Delivered")}
          userLocation={userLocation}
          onShipmentSelect={setSelectedShipment}
        />

        {/* Floating Legend */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Map Legend
          </h3>
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center shadow-sm">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <span>Active Shipment</span>
            </div>
            <div className="flex items-center gap-2 px-1 text-slate-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
              <span>
                {userLocation ? "HQ (Current Location)" : "Locating HQ..."}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Info Card */}
        {selectedShipment && (
          <div className="absolute top-2 left-2 right-2 md:top-4 md:right-4 md:left-auto md:w-80 z-[1000] bg-white p-3 md:p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800 text-sm md:text-base">
                Shipment Details
              </h3>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <p>
                <span className="text-gray-500">ID:</span>{" "}
                <span className="font-mono">{selectedShipment.id}</span>
              </p>
              <p className="line-clamp-2">
                <span className="text-gray-500">Contents:</span>{" "}
                {selectedShipment.contents}
              </p>
              <p>
                <span className="text-gray-500">Last Update:</span>{" "}
                {selectedShipment.lastPing || "Just now"}
              </p>
              <div className="pt-2 mt-2 border-t text-center">
                <span className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
                  <Check size={12} /> GPS Signal Live
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveMapPage;
