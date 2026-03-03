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
  MapPin 
} from "lucide-react";
import api from "../services/api";
import LiveTrackingMap from "../components/logistics/LiveTrackingMap";

const getStatusVisuals = (status) => {
  switch (status) {
    case "Delayed":
      return { color: "text-red-500", icon: <Construction size={16} /> };
    case "Shipped":
    case "On-the-Way":
      return { color: "text-yellow-600", icon: <Truck size={16} /> };
    case "Delivered":
      return { color: "text-green-600", icon: <Check size={16} /> };
    default:
      return { color: "text-blue-600", icon: <Package size={16} /> };
  }
};

export const LiveMapPage = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for user's current location (HQ)
  const [userLocation, setUserLocation] = useState(null);

  // Fetch Shipments Data
  useEffect(() => {
    const fetchSupplyData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/supply-tracking'); 
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
        }
      );
    }
  }, []);

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-background font-inter overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-96 h-[40vh] md:h-full bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-2xl z-20 flex flex-col relative">
        
        {/* Header */}
        <div className="p-3 md:p-4 border-b flex items-center gap-3 bg-primary text-white shrink-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 md:p-2 rounded-full hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>
          <h1 className="text-base md:text-lg font-bold">Live Asset Tracking</h1>
        </div>

        {/* Legend */}
        <div className="p-2 md:p-4 border-b bg-gray-50 shrink-0">
          <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Map Symbols</h3>
          <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                <Truck className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              </div>
              <span className="truncate">Active Shipment</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-blue-500 rounded-full shrink-0 animate-pulse"></div>
               <span className="truncate">
                 {userLocation ? "HQ (Current Location)" : "Locating HQ..."}
               </span>
            </div>
          </div>
        </div>

        {/* Shipment List */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 text-left bg-white">
          <h3 className="text-xs font-bold text-gray-500 uppercase sticky top-0 bg-white py-1 z-10 flex justify-between items-center">
            <span>Active Shipments</span>
            {userLocation && (
              <span className="text-[10px] text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                <MapPin size={10} className="mr-1" /> HQ Online
              </span>
            )}
          </h3>
          
          {loading ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
          ) : shipments.filter(s => s.status !== 'Delivered').length === 0 ? (
             <p className="text-center text-gray-500 text-sm py-4">No active shipments.</p>
          ) : (
            shipments.filter(s => s.status !== 'Delivered').map(s => {
               const { color, icon } = getStatusVisuals(s.status);
               const isSelected = selectedShipment?.id === s.id;

               return (
                 <div 
                   key={s.id}
                   onClick={() => setSelectedShipment(s)}
                   className={`p-3 rounded-lg border cursor-pointer transition-all ${
                     isSelected 
                       ? 'border-primary bg-green-50 ring-1 ring-primary' 
                       : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-bold text-gray-800 text-sm truncate pr-2">{s.route}</span>
                     <span className={`flex items-center gap-1 text-[10px] md:text-xs font-semibold shrink-0 ${color}`}>
                       {icon} {s.status}
                     </span>
                   </div>
                   <div className="text-xs text-gray-600 space-y-1">
                     <p className="truncate"><strong>Item:</strong> {s.contents}</p>
                     <p><strong>ETA:</strong> {new Date(s.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                 </div>
               )
            })
          )}
        </div>
      </aside>

      {/* MAP AREA */}
      <main className="flex-1 h-[60vh] md:h-full relative order-first md:order-last">
        
        <LiveTrackingMap 
            selectedShipment={selectedShipment} 
            allShipments={shipments.filter(s => s.status !== 'Delivered')}
            userLocation={userLocation} 
            onShipmentSelect={setSelectedShipment} 
        />
        
        {/* Floating Info Card */}
        {selectedShipment && (
          <div className="absolute top-2 left-2 right-2 md:top-4 md:right-4 md:left-auto md:w-80 z-[1000] bg-white p-3 md:p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Shipment Details</h3>
                <button 
                  onClick={() => setSelectedShipment(null)} 
                  className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
                >
                  <X size={14} />
                </button>
             </div>
             <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <p><span className="text-gray-500">ID:</span> <span className="font-mono">{selectedShipment.id}</span></p>
                <p className="line-clamp-2"><span className="text-gray-500">Contents:</span> {selectedShipment.contents}</p>
                <p><span className="text-gray-500">Last Update:</span> {selectedShipment.lastPing || 'Just now'}</p>
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