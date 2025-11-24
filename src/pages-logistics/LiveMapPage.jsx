import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction, Truck, Check, FileQuestionMark, Loader2 } from "lucide-react";
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
      return { color: "text-blue-600", icon: <FileQuestionMark size={16} /> };
  }
};

export const LiveMapPage = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex h-screen bg-background font-inter overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-96 bg-white shadow-2xl z-20 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 bg-primary text-white">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Live Asset Tracking</h1>
        </div>

        {/* Legend */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Map Symbols</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                <Truck size={16} className="text-primary" />
              </div>
              <span>Active Shipment</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
               <span>Your Location (HQ)</span>
            </div>
             <div className="flex items-center gap-2">
               <div className="w-8 h-1 bg-primary rounded-full"></div>
               <span>Active Route</span>
            </div>
          </div>
        </div>

        {/* Shipment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left">
          <h3 className="text-xs font-bold text-gray-500 uppercase">Active Shipments</h3>
          {loading ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
          ) : shipments.filter(s => s.status !== 'Delivered').length === 0 ? (
             <p className="text-center text-gray-500 text-sm py-4">No active shipments on the map.</p>
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
                     <span className="font-bold text-gray-800 text-sm">{s.route}</span>
                     <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
                       {icon} {s.status}
                     </span>
                   </div>
                   <div className="text-xs text-gray-600 space-y-1">
                     <p><strong>ID:</strong> {s.id}</p>
                     <p><strong>Item:</strong> {s.contents}</p>
                     <p><strong>ETA:</strong> {new Date(s.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                 </div>
               )
            })
          )}
        </div>
      </aside>

      {/* MAP AREA */}
      <main className="flex-1 relative">
        <LiveTrackingMap 
            selectedShipment={selectedShipment} 
            allShipments={shipments.filter(s => s.status !== 'Delivered')}
        />
        
        {/* Floating Info Card (visible when a shipment is selected) */}
        {selectedShipment && (
          <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-xl shadow-xl max-w-sm w-full border-l-4 border-primary animate-in fade-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">Shipment Details</h3>
                <button onClick={() => setSelectedShipment(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
             </div>
             <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">ID:</span> <span className="font-mono">{selectedShipment.id}</span></p>
                <p><span className="text-gray-500">Contents:</span> {selectedShipment.contents}</p>
                <p><span className="text-gray-500">Last Update:</span> {selectedShipment.lastPing}</p>
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