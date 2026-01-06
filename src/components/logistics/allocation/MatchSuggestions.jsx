// src/components/logistics/allocation/MatchSuggestions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Package, 
  Clock, 
  Phone, 
  Mail, 
  X,
  Loader2,
  Shield,
  Thermometer,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import allocationService from '@/services/allocationService';
import { useSessionAllocationsStore } from "@/stores/sessionAllocationsStore";



const Badge = ({ children, variant = "secondary" }) => {
  const variants = {
    success: "bg-green-100 text-green-800 border border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    danger: "bg-red-100 text-red-800 border border-red-300",
    info: "bg-blue-100 text-blue-800 border border-blue-300",
    secondary: "bg-gray-100 text-gray-800 border border-gray-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "default", 
  size = "md",
  icon: Icon,
  className = ""
}) => {
  const base = "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-green-800 hover:bg-green-700 text-white focus:ring-green-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 focus:ring-green-500",
    destructive: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg font-bold",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

const MatchSuggestions = ({ 
  request, 
  onAllocationCreated, 
  onClose,
  inline = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactHospital, setContactHospital] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    if (!request?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await allocationService.getSuggestions(request.id);
      const data = response.data || [];

      if (data.length === 0) {
        setError("No hospitals found with sufficient stock and matching handling requirements.");
      }

      setSuggestions(data.sort((a, b) => a.distance_km - b.distance_km));
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
      const msg = err.response?.data?.message || err.message || "Network error";
      setError(`Failed to load matches: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [request?.id]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleCreateAllocation = async () => {
    if (!selected || creating) return;

    setCreating(true);
    setError(null);

    try {
      const handlingMap = {
        'Cold Chain': 'Cold Chain',
        'HighValue': 'High-Value',
        'Narcotics': 'Narcotics',
        'General': 'General'
      };

      const payload = {
        request_id: request.id,
        source_hospital_id: selected.hospital_id,
        quantity: request.quantity,
        handling_class: handlingMap[request.handling_class] || request.handling_class || 'General'
      };

      const response = await allocationService.createAllocation(payload);
      useSessionAllocationsStore.getState().addAllocation(response.data);

      onAllocationCreated?.(response.data);
      onClose?.();
    } catch (err) {
      console.error("Allocation creation failed:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Unknown error";
      setError(`Failed to create allocation: ${msg}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (suggestion) => {
    setSelected(prev => 
      prev?.hospital_id === suggestion.hospital_id ? null : suggestion
    );
  };

  const openContactModal = (hospital) => {
    setContactHospital(hospital);
    setShowContactModal(true);
  };

  const getHandlingIcon = (handling) => {
    switch (handling) {
      case 'Cold Chain': return <Thermometer className="h-5 w-5 text-blue-600" />;
      case 'Narcotics': return <Shield className="h-5 w-5 text-red-600" />;
      case 'High-Value': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Package className="h-5 w-5 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-16 ${inline ? '' : 'bg-gray-50 rounded-lg'}`}>
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-lg font-semibold text-green-900">Searching Nationwide Network...</p>
        <p className="text-gray-600 mt-2">Finding hospitals with available {request?.resource_name}</p>
      </div>
    );
  }

  if (error && suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-800 mb-2">No Matches Found</p>
        <p className="text-gray-600 max-w-md mx-auto">{error}</p>
        <Button onClick={fetchSuggestions} variant="outline" className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${inline ? '' : 'max-h-screen overflow-y-auto'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Auto-Rank & Match Sources</h2>
              <p className="mt-2 opacity-90 text-lg">
                <strong>{request?.resource_name}</strong> × {request?.quantity?.toLocaleString()}
              </p>
              <div className="flex gap-3 mt-3">
                <Badge variant={request?.urgency_level === 'Critical' ? "danger" : "warning"}>
                  {request?.urgency_level} Priority
                </Badge>
                <Badge variant="info">
                  {request?.handling_class || 'General'}
                </Badge>
              </div>
            </div>
            {!inline && (
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Request Reason */}
        {request?.reason && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5">
            <p className="font-bold text-amber-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Reason for Request
            </p>
            <p className="text-amber-800 italic mt-2 text-lg">"{request.reason}"</p>
          </div>
        )}

        {/* Matches Found */}
        <div className="text-sm font-medium text-gray-700 mb-4">
          {suggestions.length} hospital(s) found with available stock:
        </div>

        {/* Suggestions List */}
        <div className="space-y-5">
          {suggestions.map((match) => (
            <div
              key={match.hospital_id}
              onClick={() => handleSelect(match)}
              className={`p-6 rounded-xl border-3 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl ${
                selected?.hospital_id === match.hospital_id
                  ? 'border-green-600 bg-green-50 ring-4 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-green-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-900 flex items-center gap-3">
                      <Building2 className="h-7 w-7 text-green-700" />
                      {match.hospital_name}
                    </h3>
                    {selected?.hospital_id === match.hospital_id && (
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-gray-600">Distance</p>
                        <p className="font-bold text-green-900">{match.distance_km.toFixed(1)} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-gray-600">Est. Travel</p>
                        <p className="font-bold text-green-900">~{Math.round(match.distance_km * 2.2)} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-gray-600">Available</p>
                        <p className="font-bold text-green-900">{match.available_quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getHandlingIcon(match.handling_class)}
                      <div>
                        <p className="text-gray-600">Handling</p>
                        <p className="font-bold text-green-900">{match.handling_class}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-8">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openContactModal(match);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Phone className="h-4 w-4" /> Contact
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="sticky bottom-0 bg-white border-t-4 border-green-600 pt-6 -mx-6 px-6 pb-6 mt-10 rounded-b-lg shadow-2xl">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              {selected ? (
                <p className="text-xl font-bold text-green-900">
                  Selected Source: <span className="text-green-700">{selected.hospital_name}</span>
                </p>
              ) : (
                <p className="text-gray-600 text-lg">Click a hospital above to select it</p>
              )}
            </div>

            <div className="flex gap-4">
              {!inline && (
                <Button onClick={onClose} variant="outline" size="lg">
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleCreateAllocation}
                disabled={!selected || creating}
                variant="default"
                size="lg"
                className="min-w-64 shadow-lg"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Creating Allocation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6" />
                    Create Allocation Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && contactHospital && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-green-500">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white p-8 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-bold">Contact Hospital</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-3 rounded-full hover:bg-white/20"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="text-center">
                <Building2 className="h-20 w-20 text-green-600 mx-auto mb-4" />
                <h4 className="text-3xl font-bold text-green-900">{contactHospital.hospital_name}</h4>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-5 bg-green-50 rounded-xl border-2 border-green-200">
                  <Phone className="h-8 w-8 text-green-700" />
                  <div>
                    <p className="text-gray-600 font-medium">Supply Hotline</p>
                    <p className="text-2xl font-bold text-green-900">+63 2 8888 9999</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 p-5 bg-green-50 rounded-xl border-2 border-green-200">
                  <Mail className="h-8 w-8 text-green-700" />
                  <div>
                    <p className="text-gray-600 font-medium">Email</p>
                    <p className="text-xl font-bold text-green-900 break-all">
                      supply@{contactHospital.hospital_name.toLowerCase().replace(/\s+/g, '')}.com.ph
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowContactModal(false)}
                variant="default"
                size="lg"
                className="w-full text-xl py-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchSuggestions;