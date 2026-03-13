// components/logistics/allocation/VehicleDetailsModal.jsx
import { 
  Truck, Fuel, Gauge, ThermometerSnowflake, 
  ShieldCheck, MapPin, Calendar, Clock, 
  Package, Building2, Award, CheckCircle,
  AlertCircle, X, ExternalLink, Printer,
  Navigation, Activity, FileText, Home,
  Phone, Mail, User, Wrench, DollarSign,
  Battery, Zap, Settings, Shield
} from "lucide-react";
import { useState } from "react";

const VehicleDetailsModal = ({ vehicle, isOpen, onClose }) => {
  if (!isOpen || !vehicle) return null;

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Parse capabilities
  const parseCapabilities = (capabilities) => {
    if (!capabilities) return [];
    try {
      if (Array.isArray(capabilities)) return capabilities;
      if (typeof capabilities === 'string') {
        if (capabilities.startsWith('[') || capabilities.startsWith('{')) {
          return JSON.parse(capabilities);
        }
        return capabilities.split(',').map(c => c.trim()).filter(c => c);
      }
      return [];
    } catch {
      return [];
    }
  };

  const capabilities = parseCapabilities(vehicle.capabilities);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-[100] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-green-300/50">
        {/* Header */}
        <div className="p-6 border-b-2 border-green-300/50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
              <Truck className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                Vehicle Details
              </h2>
              <p className="text-gray-600">
                Complete vehicle specifications and status
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:rotate-90 transform"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Vehicle Identity Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-4xl font-black text-green-900 mb-2">
                    {vehicle.plate_number || "No Plate Number"}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl font-bold text-gray-800">{vehicle.asset_code}</span>
                    <span className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-full">
                      {vehicle.status || "Standby"}
                    </span>
                  </div>
                  <p className="text-xl text-gray-700 mt-4">
                    {vehicle.manufacturer} • {vehicle.model} • {vehicle.year_manufactured || "Year N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Location</p>
                  <p className="text-lg font-bold text-gray-900">{vehicle.location || "Not specified"}</p>
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <div className={`w-3 h-3 rounded-full ${vehicle.status === 'Operational' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <span className="text-sm font-medium">{vehicle.status || "Standby"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Specifications */}
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <FileText className="text-green-600" size={24} />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Asset Code</p>
                      <p className="font-bold text-gray-900">{vehicle.asset_code}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Type</p>
                      <p className="font-bold text-gray-900">{vehicle.type || "Not specified"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <p className="font-bold text-gray-900">{vehicle.category || "General"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Capacity</p>
                      <p className="font-bold text-gray-900">{vehicle.capacity || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <Settings className="text-blue-600" size={24} />
                  Technical Specifications
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Fuel className="text-blue-600" size={16} />
                        <p className="text-sm text-blue-600 font-medium">Fuel Type</p>
                      </div>
                      <p className="font-bold text-gray-900">{vehicle.fuel_type || "Not specified"}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className="text-blue-600" size={16} />
                        <p className="text-sm text-blue-600 font-medium">Mileage</p>
                      </div>
                      <p className="font-bold text-gray-900">{vehicle.mileage || "Not recorded"}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Battery className="text-blue-600" size={16} />
                        <p className="text-sm text-blue-600 font-medium">Fuel Level</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                            style={{ width: `${vehicle.current_fuel_level || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-900">{vehicle.current_fuel_level || 0}%</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="text-blue-600" size={16} />
                        <p className="text-sm text-blue-600 font-medium">Power Source</p>
                      </div>
                      <p className="font-bold text-gray-900">{vehicle.power_source || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capabilities Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <ShieldCheck className="text-purple-600" size={24} />
                  Special Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {capabilities.length > 0 ? (
                    capabilities.map((capability, index) => {
                      let bgColor = "bg-gray-100 text-gray-800";
                      let icon = Shield;
                      
                      if (capability.toLowerCase().includes('cold') || capability.toLowerCase().includes('refrigerated')) {
                        bgColor = "bg-blue-100 text-blue-800";
                        icon = ThermometerSnowflake;
                      } else if (capability.toLowerCase().includes('narcotic') || capability.toLowerCase().includes('security')) {
                        bgColor = "bg-purple-100 text-purple-800";
                        icon = Shield;
                      } else if (capability.toLowerCase().includes('high') || capability.toLowerCase().includes('value')) {
                        bgColor = "bg-amber-100 text-amber-800";
                        icon = Award;
                      } else if (capability.toLowerCase().includes('gps') || capability.toLowerCase().includes('tracking')) {
                        bgColor = "bg-green-100 text-green-800";
                        icon = Navigation;
                      }
                      
                      const Icon = icon;
                      
                      return (
                        <div key={index} className={`flex items-center gap-2 px-4 py-2 rounded-full ${bgColor} font-medium`}>
                          <Icon size={14} />
                          <span>{capability}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500">No special capabilities defined</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Status & Maintenance */}
            <div className="space-y-6">
              {/* Condition & Value Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <Award className="text-amber-600" size={24} />
                  Condition & Value
                </h3>
                <div className="space-y-6">
                  <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-amber-700 font-medium">Current Condition</p>
                        <p className="text-2xl font-bold text-amber-900">{vehicle.condition || "Good"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-700 font-medium">Estimated Value</p>
                        <p className="text-2xl font-bold text-amber-900">{formatCurrency(vehicle.estimated_value)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-amber-700">Operational Status</span>
                          <span className="text-sm font-bold text-amber-900">85%</span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Purchase Date</p>
                      <p className="font-bold text-gray-900">{formatDate(vehicle.purchase_date)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Created By</p>
                      <p className="font-bold text-gray-900">System Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Schedule Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <Calendar className="text-blue-600" size={24} />
                  Maintenance Schedule
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${vehicle.last_maintenance ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <p className="text-sm text-gray-600 mb-1">Last Maintenance</p>
                      <p className="font-bold text-gray-900">{formatDate(vehicle.last_maintenance)}</p>
                      {vehicle.last_maintenance && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle size={12} className="text-green-600" />
                          <span className="text-xs text-green-600">Completed</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-4 rounded-lg ${vehicle.next_maintenance ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <p className="text-sm text-gray-600 mb-1">Next Maintenance</p>
                      <p className="font-bold text-gray-900">{formatDate(vehicle.next_maintenance)}</p>
                      {vehicle.next_maintenance && new Date(vehicle.next_maintenance) < new Date() && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle size={12} className="text-red-600" />
                          <span className="text-xs text-red-600">Overdue</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium mb-2">Maintenance Notes</p>
                    <p className="text-gray-700">
                      Regular maintenance ensures optimal performance and safety compliance.
                      {vehicle.next_maintenance && (
                        <span className="font-semibold"> Next service due in {
                          Math.ceil((new Date(vehicle.next_maintenance) - new Date()) / (1000 * 60 * 60 * 24))
                        } days.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <Activity className="text-gray-600" size={24} />
                  Additional Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {vehicle.operating_hours && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Operating Hours</p>
                      <p className="font-bold text-gray-900">{vehicle.operating_hours}</p>
                    </div>
                  )}
                  {vehicle.setup_time && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Setup Time</p>
                      <p className="font-bold text-gray-900">{vehicle.setup_time}</p>
                    </div>
                  )}
                  {vehicle.flight_time && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Flight Time</p>
                      <p className="font-bold text-gray-900">{vehicle.flight_time}</p>
                    </div>
                  )}
                  {vehicle.current_personnel && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Current Personnel</p>
                      <p className="font-bold text-gray-900">{vehicle.current_personnel}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
            <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 flex items-center gap-2">
              <Printer size={20} />
              Print Details
            </button>
            <button className="px-6 py-3 border-2 border-green-300 text-green-900 font-semibold rounded-xl hover:bg-green-50 transition-all duration-200 flex items-center gap-2">
              <ExternalLink size={20} />
              View Maintenance History
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 ml-auto">
              <Navigation size={20} />
              Track Vehicle Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;