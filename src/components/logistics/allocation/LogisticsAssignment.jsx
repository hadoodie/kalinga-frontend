// src/components/logistics/allocation/LogisticsAssignment.jsx

import React, { useEffect, useMemo, useState } from "react";
import logisticsService from '@/services/logisticsService';
import {
  Truck, User, Building2, MapPin, Phone, Calendar, Wrench, Fuel, Gauge,
  Package, Clock, AlertCircle, CheckCircle, FileText, X, Route, Navigation,
  Shield, ThermometerSnowflake, ShieldCheck, ShieldAlert, Mail, Loader2,
  ClipboardList, ChevronRight, Info, Map, Award, Filter, Star, Navigation2,
  Zap, Battery, CalendarDays, MapPinOff, MapPin as MapPinIcon, Eye, Search,
  Map as MapIcon, Filter as FilterIcon
} from "lucide-react";


const Button = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  type = "button",
  fullWidth = false
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    secondary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-md hover:shadow-lg transition-all duration-300",
    outline: "border-2 border-green-300 bg-white hover:bg-green-50 text-green-800 hover:border-green-400 hover:text-green-900 transition-all duration-300",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300",
    ghost: "bg-transparent hover:bg-green-100 text-green-700 hover:text-green-800 transition-all duration-300",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm font-semibold rounded-lg",
    md: "px-6 py-3 text-base font-semibold rounded-lg",
    lg: "px-8 py-4 text-lg font-semibold rounded-xl"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-3
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
    >
      {Icon && <Icon size={size === "lg" ? 24 : size === "sm" ? 16 : 20} />}
      {children}
    </button>
  );
};

const StatusBadge = ({ status, children, icon: Icon, variant = "default" }) => {
  const statusConfig = {
    confirmed: {
      color: "bg-green-50 text-green-800 border border-green-200",
      icon: CheckCircle
    },
    logistics_assigned: {
      color: "bg-blue-50 text-blue-800 border border-blue-200",
      icon: CheckCircle
    },
    pending: {
      color: "bg-yellow-50 text-yellow-800 border border-yellow-200",
      icon: Clock
    },
    critical: {
      color: "bg-red-50 text-red-800 border border-red-200",
      icon: AlertCircle
    },
    in_transit: {
      color: "bg-blue-50 text-blue-800 border border-blue-200",
      icon: Navigation
    },
    operational: {
      color: "bg-green-50 text-green-800 border border-green-200",
      icon: CheckCircle
    },
    maintenance: {
      color: "bg-red-50 text-red-800 border border-red-200",
      icon: Wrench
    },
    available: {
      color: "bg-green-50 text-green-800 border border-green-200",
      icon: CheckCircle
    },
    onduty: {
      color: "bg-yellow-50 text-yellow-800 border border-yellow-200",
      icon: User
    },
    offduty: {
      color: "bg-gray-50 text-gray-800 border border-gray-200",
      icon: User
    },
    onleave: {
      color: "bg-red-50 text-red-800 border border-red-200",
      icon: User
    },
    suspended: {
      color: "bg-gray-100 text-gray-800 border border-gray-300",
      icon: User
    },
    standby: {
      color: "bg-blue-50 text-blue-800 border border-blue-200",
      icon: Clock
    },
    decommissioned: {
      color: "bg-gray-100 text-gray-800 border border-gray-300",
      icon: X
    },
    default: {
      color: "bg-gray-50 text-gray-800 border border-gray-200",
      icon: Info
    }
  };

  const config = statusConfig[variant] || statusConfig[status?.toLowerCase()] || statusConfig.default;
  const BadgeIcon = Icon || config.icon;

  return (
    <span className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
      ${config.color}
    `}>
      <BadgeIcon size={14} />
      {children || status}
    </span>
  );
};

const Card = ({ 
  children, 
  className = "", 
  title, 
  subtitle,
  icon: Icon,
  headerAction,
  padding = true,
  highlighted = false
}) => (
  <div className={`
    rounded-xl shadow-lg border overflow-hidden
    ${highlighted ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-green-100' : 'bg-white border-gray-100'}
    hover:shadow-xl transition-shadow duration-300 ${className}
  `}>
    {title && (
      <div className={`px-8 py-5 border-b ${highlighted ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200' : 'border-gray-100 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className={`p-2 rounded-lg ${highlighted ? 'bg-green-200' : 'bg-green-100'}`}>
                <Icon className="text-green-700" size={22} />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-green-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </div>
    )}
    <div className={padding ? "p-8" : ""}>{children}</div>
  </div>
);

// Info Chip Component
const InfoChip = ({ label, value, icon: Icon, color = "green" }) => {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200"
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[color]}`}>
      {Icon && <Icon size={18} />}
      <div>
        <p className="text-xs font-medium opacity-75">{label}</p>
        <p className="text-sm font-semibold">{value || "—"}</p>
      </div>
    </div>
  );
};

// Formatters
const fmt = {
  dateTime: (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dt);
    }
  },
  dateShort: (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dt);
    }
  },
  number: (n) => (n || n === 0) ? n.toLocaleString('en-PH') : "—",
  distance: (km) => km ? `${Number(km).toFixed(1)} km` : "—",
  phone: (phone) => phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : "—",
  duration: (minutes) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  },
  capitalize: (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "—"
};

// Handling class normalization
const normalizeHandling = (hc) => {
  if (!hc) return "General";
  const s = hc.toLowerCase();
  if (s.includes("cold")) return "Cold Chain";
  if (s.includes("narc")) return "Narcotics";
  if (s.includes("high")) return "High Value";
  return "General";
};

const getHandlingClassInfo = (handlingClass) => {
  const hc = handlingClass?.toLowerCase() || "";
  if (hc.includes("cold")) return {
    icon: ThermometerSnowflake,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Cold Chain"
  };
  if (hc.includes("narc")) return {
    icon: ShieldAlert,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    label: "Narcotics"
  };
  if (hc.includes("high")) return {
    icon: ShieldCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "High Value"
  };
  return {
    icon: Package,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "General"
  };
};

// Helper function to parse capabilities safely
const parseCapabilities = (capabilitiesString) => {
  if (!capabilitiesString) return [];
  
  try {
    if (Array.isArray(capabilitiesString)) {
      return capabilitiesString;
    }
    
    if (capabilitiesString.startsWith('[') || capabilitiesString.startsWith('{')) {
      const parsed = JSON.parse(capabilitiesString);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    
    if (capabilitiesString.includes(',')) {
      return capabilitiesString.split(',').map(item => item.trim()).filter(item => item);
    }
    
    return [capabilitiesString];
  } catch (error) {
    console.error('Error parsing capabilities:', error, capabilitiesString);
    return [];
  }
};

// Capability Badge Component
const CapabilityBadge = ({ capability }) => {
  const config = {
    ColdChain: { color: "bg-blue-100 text-blue-800", icon: ThermometerSnowflake, label: "Cold Chain" },
    cold_chain: { color: "bg-blue-100 text-blue-800", icon: ThermometerSnowflake, label: "Cold Chain" },
    TemperatureMonitoring: { color: "bg-blue-50 text-blue-700", icon: ThermometerSnowflake, label: "Temp Monitor" },
    Narcotics: { color: "bg-purple-100 text-purple-800", icon: ShieldAlert, label: "Narcotics" },
    narcotics: { color: "bg-purple-100 text-purple-800", icon: ShieldAlert, label: "Narcotics" },
    HighValue: { color: "bg-yellow-100 text-yellow-800", icon: ShieldCheck, label: "High Value" },
    high_value: { color: "bg-yellow-100 text-yellow-800", icon: ShieldCheck, label: "High Value" },
    GPS: { color: "bg-green-100 text-green-800", icon: MapPinIcon, label: "GPS" },
    General: { color: "bg-gray-100 text-gray-800", icon: Package, label: "General" },
    general: { color: "bg-gray-100 text-gray-800", icon: Package, label: "General" },
    Secured: { color: "bg-amber-100 text-amber-800", icon: Shield, label: "Secured" },
    Refrigerated: { color: "bg-cyan-100 text-cyan-800", icon: ThermometerSnowflake, label: "Refrigerated" },
    Armored: { color: "bg-gray-800 text-white", icon: ShieldCheck, label: "Armored" },
    ColdChainCertified: { color: "bg-blue-100 text-blue-800", icon: ThermometerSnowflake, label: "Cold Chain Certified" }
  };

  const cfg = config[capability] || { color: "bg-gray-100 text-gray-800", label: capability };
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {Icon && <Icon size={12} />}
      {cfg.label || capability}
    </span>
  );
};

// Route Visualization Component
const RouteVisualization = ({ source, destination, distance_km, estimated_eta }) => (
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h4 className="text-lg font-bold text-green-900">Route Overview</h4>
        <p className="text-sm text-gray-600">Source to destination navigation</p>
      </div>
      <div className="flex gap-3">
        <InfoChip label="Distance" value={distance_km ? `${Number(distance_km).toFixed(1)} km` : "—"} icon={Route} />
        <InfoChip label="Est. Duration" value={estimated_eta || "Calculating..."} icon={Clock} color="blue" />
      </div>
    </div>
    <div className="relative py-8">
      <div className="absolute inset-0 flex items-center px-12">
        <div className="w-full h-1 bg-gradient-to-r from-green-300 via-green-400 to-green-300 rounded-full opacity-50"></div>
      </div>
      <div className="relative flex justify-between px-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white border-4 border-green-600 rounded-full flex items-center justify-center shadow-lg mb-3">
            <Building2 className="text-green-600" size={28} />
          </div>
          <div className="text-center max-w-[140px]">
            <p className="font-semibold text-green-900 text-sm">{source?.name || "—"}</p>
            <p className="text-xs text-gray-600 truncate">{source?.address || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-xl mb-3 animate-pulse">
            <Navigation className="text-white" size={32} />
          </div>
          <p className="font-bold text-green-900">Active Route</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white border-4 border-green-600 rounded-full flex items-center justify-center shadow-lg mb-3">
            <Building2 className="text-green-600" size={28} />
          </div>
          <div className="text-center max-w-[140px]">
            <p className="font-semibold text-green-900 text-sm">{destination?.name || "—"}</p>
            <p className="text-xs text-gray-600 truncate">{destination?.address || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// CAPABILITY FILTERS 
const VEHICLE_CAPABILITIES = [
  { value: "general", label: "General Transport" },
  { value: "cold_chain", label: "Cold Chain" },
  { value: "narcotics", label: "Narcotics Transport" },
  { value: "high_value", label: "High-Value / Armored" },
  { value: "GPS", label: "GPS Enabled" },
  { value: "Refrigerated", label: "Refrigerated" }
];

const RESPONDER_CAPABILITIES = [
  { value: "General", label: "General Handling" },
  { value: "ColdChain", label: "Cold Chain Certified" },
  { value: "Narcotics", label: "Narcotics Handling" },
  { value: "HighValue", label: "High-Value / Security Trained" },
  { value: "ColdChainCertified", label: "Cold Chain Trained" }
];

// Vehicle Capability Filter Component
const VehicleCapabilityFilter = ({ selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {VEHICLE_CAPABILITIES.map(cap => (
        <button
          key={cap.value}
          onClick={() => {
            if (selected.includes(cap.value)) {
              onChange(selected.filter(c => c !== cap.value));
            } else {
              onChange([...selected, cap.value]);
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            selected.includes(cap.value)
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-white text-gray-700 border-gray-300 hover:border-green-300 hover:bg-green-50"
          }`}
        >
          {cap.label}
        </button>
      ))}
    </div>
  );
};

// Responder Capability Filter Component
const ResponderCapabilityFilter = ({ selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {RESPONDER_CAPABILITIES.map(cap => (
        <button
          key={cap.value}
          onClick={() => {
            if (selected.includes(cap.value)) {
              onChange(selected.filter(c => c !== cap.value));
            } else {
              onChange([...selected, cap.value]);
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            selected.includes(cap.value)
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          {cap.label}
        </button>
      ))}
    </div>
  );
};

// Vehicle Card Component 
const VehicleCard = ({ vehicle, isSelected, isRecommended, onSelect, onViewDetail }) => {
  const calculateVehicleInfo = (v) => {
    const distance = v?.distance_km || Math.random() * 100 + 20;
    const etaMinutes = Math.round(distance * 1.5 + 30);
    return {
      distance: fmt.distance(distance),
      eta: fmt.duration(etaMinutes)
    };
  };

  const vehicleInfo = calculateVehicleInfo(vehicle);
  const capabilities = parseCapabilities(vehicle.capabilities);
  
  return (
    <div
      onClick={onSelect}
      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300
        ${isSelected
          ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 ring-4 ring-green-200 shadow-xl"
          : isRecommended
          ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 hover:border-yellow-500"
          : "border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-lg"
        }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {isRecommended && !isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-xl text-green-900">{vehicle.plate_number || vehicle.asset_code}</h3>
          {isRecommended && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">AI RECOMMENDED</span>
          )}
        </div>
        <p className="text-gray-600 font-medium">{vehicle.type} • {vehicle.model || "N/A"}</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-green-600" />
          <span className="font-semibold text-green-800">
            → {vehicleInfo.distance} · {vehicleInfo.eta}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Condition:</span>
          <span className="font-semibold text-green-700">
            {vehicle.condition || "Excellent"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Next Maintenance:</span>
          <span className="font-semibold text-amber-700">
            {fmt.dateShort(vehicle.next_maintenance) || "Not scheduled"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          <StatusBadge status={vehicle.status}>
            {fmt.capitalize(vehicle.status)}
          </StatusBadge>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-2">Capabilities:</p>
          <div className="flex flex-wrap gap-2">
            {capabilities.slice(0, 3).map((cap, idx) => (
              <CapabilityBadge key={idx} capability={cap} />
            ))}
            {capabilities.length > 3 && (
              <span className="text-xs text-gray-500 font-medium">+{capabilities.length - 3} more</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-600" />
          <span className="text-sm text-gray-700 truncate">{vehicle.location || "Location not specified"}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
        >
          <Eye size={16} /> View Full Details
        </Button>
      </div>
    </div>
  );
};

// Responder Card Component
const ResponderCard = ({ responder, isSelected, isRecommended, onSelect, onViewDetail }) => {
  const capabilities = parseCapabilities(responder.handling_capabilities);
  const certifications = Array.isArray(responder.certifications) ? responder.certifications : [];
  
  return (
    <div
      onClick={onSelect}
      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300
        ${isSelected
          ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 ring-4 ring-green-200 shadow-xl"
          : isRecommended
          ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 hover:border-yellow-500"
          : "border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-lg"
        }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {isRecommended && !isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-xl text-green-900">{responder.full_name || responder.name}</h3>
          {isRecommended && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">AI RECOMMENDED</span>
          )}
        </div>
        <p className="text-gray-600 font-medium">{responder.responder_code || "—"} • {responder.years_experience || "5"} yrs exp</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-4">
          <StatusBadge status={responder.status}>
            {fmt.capitalize(responder.status)}
          </StatusBadge>
          <span className="font-semibold text-green-700">
            {fmt.number(responder.allocation_vehicle_count || 0)} trips
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-blue-600" />
          <span className="font-semibold">{fmt.phone(responder.contact_number || responder.phone) || "No contact"}</span>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-2">Handling Capabilities:</p>
          <div className="flex flex-wrap gap-2">
            {capabilities.slice(0, 3).map((cap, idx) => (
              <CapabilityBadge key={idx} capability={cap} />
            ))}
            {capabilities.length > 3 && (
              <span className="text-xs text-gray-500 font-medium">+{capabilities.length - 3} more</span>
            )}
          </div>
        </div>
        
        {certifications.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Certifications:</p>
            <div className="flex flex-wrap gap-2">
              {certifications.slice(0, 2).map((cert, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  {cert}
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="text-xs text-gray-500 font-medium">+{certifications.length - 2} more</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-gray-600" />
          <span className="text-sm text-gray-700">
            {responder.current_asset_id ? "Currently assigned to vehicle" : "No current assignment"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
        >
          <Eye size={16} /> View Profile
        </Button>
      </div>
    </div>
  );
};

// Smart Filters Section Component
const SmartFilters = ({ 
  filters, 
  setFilters, 
  activeTab,
  vehicles = [],
  responders = []
}) => {
  // Extract unique regions from vehicles and responders
  const allLocations = useMemo(() => {
    const locations = new Set();
    
    // Add vehicle locations
    vehicles.forEach(v => {
      if (v.location) locations.add(v.location);
    });
    
    // Add responder regions (extracted from location or other field)
    responders.forEach(r => {
      if (r.location) locations.add(r.location);
    });
    
    // Add common DOH regions
    const commonRegions = [
      'DOH National Center',
      'DOH Region IV-A (CALABARZON)',
      'DOH Region VII (Central Visayas)',
      'DOH Region XI (Davao Region)',
      'DOH Region NCR (National Capital Region)',
      'DOH Region III (Central Luzon)',
      'DOH Region VI (Western Visayas)',
      'DOH Region X (Northern Mindanao)'
    ];
    
    commonRegions.forEach(region => locations.add(region));
    
    return Array.from(locations).sort();
  }, [vehicles, responders]);

  // Vehicle status options based on your schema
  const vehicleStatusOptions = [
    { value: 'Operational', label: 'Operational', color: 'bg-green-100 text-green-800' },
    { value: 'Standby', label: 'Standby', color: 'bg-blue-100 text-blue-800' },
    { value: 'Under Repair', label: 'Under Repair', color: 'bg-red-100 text-red-800' },
    { value: 'Decommissioned', label: 'Decommissioned', color: 'bg-gray-100 text-gray-800' }
  ];

  // Responder status options based on your schema
  const responderStatusOptions = [
    { value: 'Available', label: 'Available', color: 'bg-green-100 text-green-800' },
    { value: 'On Duty', label: 'On Duty', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Off Duty', label: 'Off Duty', color: 'bg-gray-100 text-gray-800' },
    { value: 'On Leave', label: 'On Leave', color: 'bg-red-100 text-red-800' },
    { value: 'Suspended', label: 'Suspended', color: 'bg-gray-300 text-gray-800' }
  ];

  return (
    <Card title="Smart Filters" icon={FilterIcon} className="mb-8">
      <div className="space-y-6">
        {/* Capability Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capability Filter ({activeTab === 'vehicles' ? 'Vehicles' : 'Responders'})
          </label>
          {activeTab === 'vehicles' ? (
            <VehicleCapabilityFilter 
              selected={filters.capability}
              onChange={(capabilities) => setFilters({...filters, capability: capabilities})}
            />
          ) : (
            <ResponderCapabilityFilter 
              selected={filters.capability}
              onChange={(capabilities) => setFilters({...filters, capability: capabilities})}
            />
          )}
        </div>
        
        {/* Region, Status, and Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region/Location</label>
            <select 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all"
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
            >
              <option value="all">All Regions</option>
              {allLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">
                {activeTab === 'vehicles' ? 'All Status (Default: Operational)' : 'All Status (Default: Available)'}
              </option>
              {activeTab === 'vehicles' ? (
                vehicleStatusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))
              ) : (
                responderStatusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'vehicles' ? "Search by plate or code..." : "Search by name or code..."}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={filters.showAvailableOnly}
                onChange={(e) => {
                  if (e.target.checked) {
                    // When checked, set the appropriate default status
                    const defaultStatus = activeTab === 'vehicles' ? 'Operational' : 'Available';
                    setFilters({
                      ...filters, 
                      showAvailableOnly: true,
                      status: defaultStatus
                    });
                  } else {
                    setFilters({...filters, showAvailableOnly: false, status: ''});
                  }
                }}
                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-gray-700 font-medium">Show Available Only</span>
            </label>
          </div>
        </div>
        
        {/* Stats and Clear Filters */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activeTab === 'vehicles' ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {filters.showAvailableOnly ? 'Operational' : 'All'} Vehicles
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                    {filters.region !== 'all' ? `Region: ${filters.region}` : 'All Regions'}
                  </span>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {filters.showAvailableOnly ? 'Available' : 'All'} Responders
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {filters.capability.length > 0 ? `${filters.capability.length} capabilities` : 'All capabilities'}
                  </span>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const defaultStatus = activeTab === 'vehicles' ? 'Operational' : 'Available';
                setFilters({
                  region: 'all',
                  capability: [],
                  showAvailableOnly: true,
                  search: '',
                  status: defaultStatus
                });
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Detail Modal Components
const VehicleDetailModal = ({ vehicle, onClose, onSelect }) => {
  if (!vehicle) return null;
  
  const capabilities = parseCapabilities(vehicle.capabilities);
  const calculateVehicleInfo = (v) => {
    const distance = v?.distance_km || Math.random() * 100 + 20;
    const etaMinutes = Math.round(distance * 1.5 + 30);
    return {
      distance: fmt.distance(distance),
      eta: fmt.duration(etaMinutes)
    };
  };
  
  const vehicleInfo = calculateVehicleInfo(vehicle);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Truck className="text-green-700" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">{vehicle.plate_number || vehicle.asset_code}</h2>
              <p className="text-gray-600">{vehicle.type} • {vehicle.model || 'N/A'} • {vehicle.category}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={28} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Specifications */}
            <div>
              <h3 className="font-bold text-lg text-green-900 mb-6 flex items-center gap-3">
                <Truck className="text-green-600" /> Vehicle Specifications
              </h3>
              <div className="space-y-4">
                <InfoChip label="Asset Code" value={vehicle.asset_code} icon={FileText} />
                <InfoChip label="Vehicle Type" value={vehicle.type} icon={Truck} />
                <InfoChip label="Category" value={vehicle.category} icon={Package} />
                <InfoChip label="Model & Year" value={`${vehicle.model || 'N/A'} • ${vehicle.year_manufactured || 'N/A'}`} icon={Calendar} />
                <InfoChip label="Capacity" value={vehicle.capacity || 'N/A'} icon={Gauge} />
                <InfoChip label="Manufacturer" value={vehicle.manufacturer || 'N/A'} icon={Building2} />
                
                <div className="grid grid-cols-2 gap-4">
                  <InfoChip label="Fuel Type" value={vehicle.fuel_type || 'N/A'} icon={Fuel} />
                  <InfoChip label="Mileage" value={vehicle.mileage || 'N/A'} icon={Navigation} />
                </div>
                
                <InfoChip label="Estimated Value" value={vehicle.estimated_value ? `₱${Number(vehicle.estimated_value).toLocaleString('en-PH')}` : 'N/A'} icon={Award} />
                <InfoChip label="Purchase Date" value={fmt.dateShort(vehicle.purchase_date)} icon={CalendarDays} />
              </div>
            </div>
            
            {/* Right Column - Status & Capabilities */}
            <div>
              <h3 className="font-bold text-lg text-green-900 mb-6 flex items-center gap-3">
                <MapPin className="text-green-600" /> Status & Location
              </h3>
              <div className="space-y-4">
                <InfoChip label="Current Location" value={vehicle.location || 'Not specified'} icon={MapPin} />
                <InfoChip label="Operational Status" value={vehicle.status} icon={CheckCircle} color="green" />
                <InfoChip label="Condition Rating" value={vehicle.condition || 'Excellent'} icon={Award} color="amber" />
                <InfoChip label="Current Personnel" value={vehicle.current_personnel || 'Unassigned'} icon={User} />
                
                <div className="grid grid-cols-2 gap-4">
                  <InfoChip label="Last Maintenance" value={fmt.dateShort(vehicle.last_maintenance)} icon={Wrench} />
                  <InfoChip label="Next Maintenance" value={fmt.dateShort(vehicle.next_maintenance)} icon={CalendarDays} />
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capabilities</label>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((cap, idx) => (
                      <CapabilityBadge key={idx} capability={cap} />
                    ))}
                    {capabilities.length === 0 && (
                      <span className="text-sm text-gray-500">No specific capabilities defined</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route Information</label>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Distance to Source</p>
                        <p className="text-xl font-bold text-green-900">{vehicleInfo.distance}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Estimated Time</p>
                        <p className="text-xl font-bold text-green-900">{vehicleInfo.eta}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={onSelect}
                className="flex-1"
              >
                <CheckCircle size={24} /> Select This Vehicle
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={onClose}
                className="flex-1"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResponderDetailModal = ({ responder, onClose, onSelect }) => {
  if (!responder) return null;
  
  const capabilities = parseCapabilities(responder.handling_capabilities);
  const certifications = Array.isArray(responder.certifications) ? responder.certifications : [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="text-blue-700" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900">{responder.full_name || responder.name}</h2>
              <p className="text-gray-600">{responder.responder_code} • Certified Medical Responder</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={28} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <div>
              <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-3">
                <User className="text-blue-600" /> Personal Information
              </h3>
              <div className="space-y-4">
                <InfoChip label="Responder ID" value={responder.responder_code} icon={FileText} color="blue" />
                <InfoChip label="Full Name" value={responder.full_name || responder.name} icon={User} color="blue" />
                <InfoChip label="Contact Number" value={fmt.phone(responder.contact_number || responder.phone)} icon={Phone} color="blue" />
                <InfoChip label="Email Address" value={responder.email || 'N/A'} icon={Mail} color="blue" />
                <InfoChip label="License Number" value={responder.license_number || 'Not provided'} icon={ShieldCheck} color="blue" />
                
                <div className="grid grid-cols-2 gap-4">
                  <InfoChip label="Years Experience" value={responder.years_experience || '5'} icon={Award} color="amber" />
                  <InfoChip label="Total Trips" value={fmt.number(responder.allocation_vehicle_count || 0)} icon={Navigation} color="amber" />
                </div>
                
                <InfoChip label="Current Status" value={responder.status} 
                          icon={responder.status === 'Available' ? CheckCircle : User} 
                          color={responder.status === 'Available' ? 'green' : 
                                 responder.status === 'On Duty' ? 'amber' : 'gray'} />
                
                <InfoChip label="Assigned Vehicle" value={responder.current_asset_id ? 'Currently assigned' : 'Unassigned'} 
                          icon={Truck} color={responder.current_asset_id ? 'green' : 'gray'} />
              </div>
            </div>
            
            {/* Right Column - Qualifications & Certifications */}
            <div>
              <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-3">
                <Shield className="text-blue-600" /> Qualifications & Certifications
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handling Capabilities</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {capabilities.map((cap, idx) => (
                      <CapabilityBadge key={idx} capability={cap} />
                    ))}
                    {capabilities.length === 0 && (
                      <span className="text-sm text-gray-500">No specific capabilities defined</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <div className="space-y-2">
                    {certifications.length > 0 ? (
                      certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Award className="text-blue-600" size={18} />
                          <span className="font-medium text-blue-800">{cert}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-600">No certifications listed</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Cold Chain</p>
                        <p className="text-xl font-bold text-blue-900">
                          {capabilities.includes('ColdChain') || capabilities.includes('ColdChainCertified') ? 'Expert' : 'Basic'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Emergency Response</p>
                        <p className="text-xl font-bold text-blue-900">Advanced</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance Metrics</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-xl font-bold text-green-900">98%</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className="text-xl font-bold text-blue-900">12m</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-xl font-bold text-amber-900">4.8★</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={onSelect}
                className="flex-1"
              >
                <CheckCircle size={24} /> Select This Responder
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={onClose}
                className="flex-1"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LogisticsAssignment({ allocation, onSuccess }) {
  // State Management
  const [details, setDetails] = useState(allocation || null);
  const [vehicles, setVehicles] = useState([]);
  const [responders, setResponders] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedResponderId, setSelectedResponderId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(!allocation?.request);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingResponders, setIsLoadingResponders] = useState(true);

  // NEW STATES for recommendations and filters
  const [recommendedVehicle, setRecommendedVehicle] = useState(null);
  const [recommendedResponder, setRecommendedResponder] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [filters, setFilters] = useState({
    region: 'all',
    capability: [],
    showAvailableOnly: true,
    search: '',
    status: '' 
  });

  // activeTab state for tab system
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' or 'responders'

  // Detail modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showResponderModal, setShowResponderModal] = useState(false);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);
  const [selectedResponderDetail, setSelectedResponderDetail] = useState(null);

  const handlingKey = useMemo(
    () => normalizeHandling(details?.handling_class || allocation?.handling_class),
    [details, allocation]
  );

  const handlingClassInfo = useMemo(
    () => getHandlingClassInfo(details?.handling_class || allocation?.handling_class),
    [details, allocation]
  );

  const source = details?.source_hospital || details?.sourceHospital;
  const destination = details?.destination_hospital || details?.destinationHospital;
  const request = details?.request || allocation?.request;

  // Auto-switch to responders if vehicle already selected
  useEffect(() => {
    if (selectedVehicleId && !selectedResponderId) {
      setActiveTab('responders');
    }
  }, [selectedVehicleId, selectedResponderId]);

  // Fetch Recommendations
  useEffect(() => {
    const fetchSmartSuggestions = async () => {
      if (!allocation?.id || allocation.status !== 'confirmed') return;
      
      setLoadingSuggestions(true);
      try {
        const [vehicleRes, responderRes] = await Promise.all([
          logisticsService.getSuggestedVehicle(allocation.id),
          logisticsService.getSuggestedResponder(allocation.id)
        ]);
        
        setRecommendedVehicle(vehicleRes.data);
        setRecommendedResponder(responderRes.data);
        
        // Auto-select recommendations if available
        if (vehicleRes.data?.id) {
          setSelectedVehicleId(String(vehicleRes.data.id));
        }
        if (responderRes.data?.id) {
          setSelectedResponderId(String(responderRes.data.id));
        }
      } catch (err) {
        console.error("Failed to load smart recommendations", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    
    fetchSmartSuggestions();
  }, [allocation?.id, allocation?.status]);

  // Load Allocation Details
  useEffect(() => {
    const loadDetails = async () => {
      if (!allocation?.id || allocation?.request) return;
      try {
        setIsLoadingDetails(true);
        const res = await logisticsService.getAllocation(allocation.id);
        setDetails(res.data);
      } catch (err) {
        console.error("Failed to load allocation details", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    loadDetails();
  }, [allocation?.id]);

  // Load Available Vehicles - with proper filtering
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const res = await logisticsService.getAvailableVehicles(details.id || allocation.id);
        const allVehicles = Array.isArray(res.data) ? res.data : [];
        
        // Filter by handling class if needed
        const filteredVehicles = allVehicles.filter(vehicle => {
          const vehicleCaps = parseCapabilities(vehicle.capabilities);
          const requiredCap = handlingKey.toLowerCase();
          
          // Check if vehicle has required capability
          if (requiredCap === 'cold chain') {
            return vehicleCaps.some(cap => 
              cap.toLowerCase().includes('cold') || 
              cap.toLowerCase().includes('refrigerated') ||
              cap.toLowerCase().includes('temperature')
            );
          } else if (requiredCap === 'narcotics') {
            return vehicleCaps.some(cap => cap.toLowerCase().includes('narcotics'));
          } else if (requiredCap === 'high value') {
            return vehicleCaps.some(cap => 
              cap.toLowerCase().includes('high') || 
              cap.toLowerCase().includes('secured') ||
              cap.toLowerCase().includes('armored')
            );
          }
          return true; // General - show all
        });
        
        setVehicles(filteredVehicles);
      } catch (err) {
        console.error("Failed to load vehicles", err);
        setVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    loadVehicles();
  }, [handlingKey, allocation?.id, details?.id]);

  // Load Available Responders - with proper filtering
  useEffect(() => {
    const loadResponders = async () => {
      try {
        setIsLoadingResponders(true);
        const res = await logisticsService.getAvailableResponders(details.id || allocation.id);
        const allResponders = Array.isArray(res.data) ? res.data : [];
        
        // Filter by handling class if needed
        const filteredResponders = allResponders.filter(responder => {
          const responderCaps = parseCapabilities(responder.handling_capabilities);
          const requiredCap = handlingKey.toLowerCase();
          
          // Check if responder has required capability
          if (requiredCap === 'cold chain') {
            return responderCaps.some(cap => 
              cap.toLowerCase().includes('cold') || 
              cap === 'ColdChain' ||
              cap === 'ColdChainCertified'
            );
          } else if (requiredCap === 'narcotics') {
            return responderCaps.some(cap => cap.toLowerCase().includes('narcotics'));
          } else if (requiredCap === 'high value') {
            return responderCaps.some(cap => 
              cap.toLowerCase().includes('high') || 
              cap === 'HighValue'
            );
          }
          return true; // General - show all
        });
        
        setResponders(filteredResponders);
      } catch (err) {
        console.error("Failed to load responders", err);
        setResponders([]);
      } finally {
        setIsLoadingResponders(false);
      }
    };
    loadResponders();
  }, [handlingKey, allocation?.id, details?.id]);

  // Assignment function with proper data conversion
  const handleAssign = async () => {
    if (!selectedVehicleId || !selectedResponderId) {
      alert("Please select both a vehicle and a responder.");
      return;
    }

if (details?.status !== 'confirmed') {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-amber-800 mb-4">
            Allocation Not Ready for Assignment
          </h1>
          <p className="text-gray-700 mb-6">
            Allocation #{details?.id} is currently in <strong>{details?.status}</strong> status.
            It must be <strong>confirmed</strong> before assigning logistics.
          </p>
          <div className="space-y-4">
            <StatusBadge status={details?.status || 'planned'}>
              Current Status: {details?.status}
            </StatusBadge>
            <p className="text-sm text-gray-600">
              Please confirm this allocation first, then return to assign logistics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

    setIsAssigning(true);
    try {
      // Convert to numbers safely
      const assetId = Number(selectedVehicleId);
      const responderId = Number(selectedResponderId);
      
      if (isNaN(assetId) || isNaN(responderId)) {
        throw new Error("Invalid vehicle or responder ID");
      }

      await logisticsService.assignLogistics(details.id || allocation.id, {
        asset_id: assetId,
        responder_id: responderId,
      });
      
      onSuccess?.();
    } catch (err) {
      console.error("Assign error:", err.response || err);
      alert(err?.response?.data?.error || err.message || "Assignment failed. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter vehicles based on filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Available only filter - shows Operational by default
      if (filters.showAvailableOnly) {
        if (vehicle.status !== 'Operational' && vehicle.status !== 'Standby') return false;
      }
      
      // Specific status filter
      if (filters.status && vehicle.status !== filters.status) return false;
      
      // Region filter
      if (filters.region !== 'all' && vehicle.location !== filters.region) return false;
      
      // Capability filter
      if (filters.capability.length > 0) {
        const vehicleCaps = parseCapabilities(vehicle.capabilities);
        const hasAllCaps = filters.capability.every(cap => 
          vehicleCaps.some(vCap => {
            const vCapLower = vCap.toLowerCase();
            const capLower = cap.toLowerCase();
            return vCapLower.includes(capLower) || capLower.includes(vCapLower);
          })
        );
        if (!hasAllCaps) return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesPlate = vehicle.plate_number?.toLowerCase().includes(searchLower);
        const matchesCode = vehicle.asset_code?.toLowerCase().includes(searchLower);
        const matchesType = vehicle.type?.toLowerCase().includes(searchLower);
        const matchesModel = vehicle.model?.toLowerCase().includes(searchLower);
        
        if (!matchesPlate && !matchesCode && !matchesType && !matchesModel) return false;
      }
      
      return true;
    });
  }, [vehicles, filters]);

  // Filter responders based on filters
  const filteredResponders = useMemo(() => {
    return responders.filter(responder => {
      // Available only filter - shows Available by default
      if (filters.showAvailableOnly) {
        if (responder.status !== 'Available') return false;
      }
      
      // Specific status filter
      if (filters.status && responder.status !== filters.status) return false;
      
      // Region filter (using location field)
      if (filters.region !== 'all' && responder.location !== filters.region) return false;
      
      // Capability filter
      if (filters.capability.length > 0) {
        const responderCaps = parseCapabilities(responder.handling_capabilities);
        const hasAllCaps = filters.capability.every(cap => 
          responderCaps.some(rCap => {
            const rCapLower = rCap.toLowerCase();
            const capLower = cap.toLowerCase();
            return rCapLower.includes(capLower) || capLower.includes(rCapLower);
          })
        );
        if (!hasAllCaps) return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = responder.full_name?.toLowerCase().includes(searchLower) || 
                           responder.name?.toLowerCase().includes(searchLower);
        const matchesCode = responder.responder_code?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesCode) return false;
      }
      
      return true;
    });
  }, [responders, filters]);

  const assignedVehicle = details?.allocationVehicles?.[0];

  // Assigned View 
  if (details?.status === "logistics_assigned" && assignedVehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold text-green-900 mb-2">Logistics Successfully Assigned</h1>
            <p className="text-gray-600">Allocation #{details.id} has been assigned to the following resources</p>
          </div>

          <Card className="mb-8" title="Assignment Details" icon={ClipboardList}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-3">
                  <Truck className="text-green-600" /> Vehicle Assignment
                </h3>
                <div className="space-y-3">
                  <InfoChip label="Vehicle Plate" value={assignedVehicle.asset?.plate_number} icon={Truck} />
                  <InfoChip label="Vehicle Type" value={assignedVehicle.asset?.type} icon={Package} />
                  <InfoChip label="Model" value={assignedVehicle.asset?.model} icon={FileText} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-3">
                  <User className="text-blue-600" /> Responder Assignment
                </h3>
                <div className="space-y-3">
                  <InfoChip label="Responder Name" value={assignedVehicle.responder?.name} icon={User} color="blue" />
                  <InfoChip label="Contact Number" value={fmt.phone(assignedVehicle.responder?.phone)} icon={Phone} color="blue" />
                  <InfoChip label="Email" value={assignedVehicle.responder?.email} icon={Mail} color="blue" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Assignment Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoChip label="Assigned By" value={assignedVehicle.assignedBy?.name || "System"} icon={User} color="gray" />
                <InfoChip label="Assigned At" value={fmt.dateTime(assignedVehicle.assigned_at)} icon={Calendar} color="gray" />
                <InfoChip label="Status" value="Active" icon={CheckCircle} color="green" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                  <Truck className="text-white" size={24} />
                </div>
                <h1 className="text-3xl font-bold text-green-900">Logistics Assignment</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  Allocation #{details?.id || allocation?.id}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={14} /> Created {fmt.dateTime(details?.created_at)}
                </span>
              </div>
            </div>
            <StatusBadge status={details?.status || "confirmed"}>
              {details?.status === "confirmed" ? "Awaiting Assignment" : details?.status}
            </StatusBadge>
          </div>

          {/* Status Banner */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Ready for Logistics Assignment</h3>
                <p className="text-green-700 text-lg">
                  This allocation has been confirmed and is ready for vehicle and responder assignment.
                  Complete the selections below to proceed.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl ${handlingClassInfo.bg} ${handlingClassInfo.border}`}>
                <handlingClassInfo.icon className={handlingClassInfo.color} size={24} />
                <span className={`font-bold text-xl ${handlingClassInfo.color}`}>
                  {handlingClassInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Summary Card */}
        <Card title="Allocation Overview" icon={FileText} className="mb-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoChip label="Resource Type" value={details?.resource_type} icon={Package} />
              <InfoChip label="Quantity" value={fmt.number(details?.quantity)} icon={FileText} />
              <InfoChip label="Urgency" value={request?.urgency_level} icon={AlertCircle} 
                color={request?.urgency_level === "Critical" ? "amber" : "green"} />
              <InfoChip label="Handling Class" value={handlingClassInfo.label} icon={handlingClassInfo.icon} 
                color={handlingClassInfo.label === "Cold Chain" ? "blue" : 
                       handlingClassInfo.label === "Narcotics" ? "purple" : 
                       handlingClassInfo.label === "High Value" ? "amber" : "green"} />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Source Hospital</p>
                  <p className="font-bold text-green-900">{source?.name || "—"}</p>
                </div>
                <Navigation2 className="text-green-500" size={24} />
                <div className="text-center">
                  <p className="text-sm text-gray-600">Destination Hospital</p>
                  <p className="font-bold text-green-900">{destination?.name || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* RECOMMENDED VEHICLE + RESPONDER */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-3">
            <Star className="text-yellow-500" size={24} /> AI-Powered Recommendations
          </h2>
          
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mr-3" />
              <p className="text-gray-600 font-medium">Analyzing optimal logistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommended Vehicle */}
              <Card highlighted={true}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="text-yellow-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-green-900">RECOMMENDED VEHICLE</h3>
                  </div>
                  {recommendedVehicle && selectedVehicleId === String(recommendedVehicle.id) && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      ✓ SELECTED
                    </span>
                  )}
                </div>
                
                {recommendedVehicle ? (
                  <div>
                    <h4 className="text-2xl font-bold text-green-900 mb-2">{recommendedVehicle.plate_number || recommendedVehicle.asset_code}</h4>
                    <p className="text-gray-600 font-medium mb-4">{recommendedVehicle.type} • {recommendedVehicle.model || "N/A"}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={recommendedVehicle.status} />
                        <span className="font-semibold text-green-700">
                          {recommendedVehicle.condition || "Excellent"} Condition
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-600" />
                        <span className="text-sm text-gray-700">{recommendedVehicle.location || "Location not specified"}</span>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Capabilities:</p>
                        <div className="flex flex-wrap gap-2">
                          {parseCapabilities(recommendedVehicle.capabilities).slice(0, 3).map((cap, idx) => (
                            <CapabilityBadge key={idx} capability={cap} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedVehicleDetail(recommendedVehicle);
                          setShowVehicleModal(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye size={18} /> View Full Details
                      </Button>
                      <Button
                        onClick={() => setSelectedVehicleId(String(recommendedVehicle.id))}
                        variant={selectedVehicleId === String(recommendedVehicle.id) ? "success" : "primary"}
                        className="flex-1"
                      >
                        {selectedVehicleId === String(recommendedVehicle.id) ? (
                          <>
                            <CheckCircle size={20} /> Selected
                          </>
                        ) : (
                          <>
                            <Star size={20} /> Select
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No vehicle recommendation available</p>
                    <p className="text-gray-500 text-sm">Please select manually from available vehicles</p>
                  </div>
                )}
              </Card>

              {/* Recommended Responder */}
              <Card highlighted={true}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="text-yellow-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-green-900">RECOMMENDED RESPONDER</h3>
                  </div>
                  {recommendedResponder && selectedResponderId === String(recommendedResponder.id) && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      ✓ SELECTED
                    </span>
                  )}
                </div>
                
                {recommendedResponder ? (
                  <div>
                    <h4 className="text-2xl font-bold text-green-900 mb-2">{recommendedResponder.full_name || recommendedResponder.name}</h4>
                    <p className="text-gray-600 font-medium mb-4">{recommendedResponder.responder_code || "RSP-001"}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={recommendedResponder.status} />
                        <span className="font-semibold text-green-700">
                          {recommendedResponder.years_experience || "5"} years experience
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-blue-600" />
                        <span className="font-semibold">{fmt.phone(recommendedResponder.contact_number || recommendedResponder.phone) || "No contact"}</span>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Capabilities:</p>
                        <div className="flex flex-wrap gap-2">
                          {parseCapabilities(recommendedResponder.handling_capabilities).slice(0, 3).map((cap, idx) => (
                            <CapabilityBadge key={idx} capability={cap} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedResponderDetail(recommendedResponder);
                          setShowResponderModal(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye size={18} /> View Profile
                      </Button>
                      <Button
                        onClick={() => setSelectedResponderId(String(recommendedResponder.id))}
                        variant={selectedResponderId === String(recommendedResponder.id) ? "success" : "primary"}
                        className="flex-1"
                      >
                        {selectedResponderId === String(recommendedResponder.id) ? (
                          <>
                            <CheckCircle size={20} /> Selected
                          </>
                        ) : (
                          <>
                            <Star size={20} /> Select
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No responder recommendation available</p>
                    <p className="text-gray-500 text-sm">Please select manually from available responders</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Smart Filters */}
        <SmartFilters 
          filters={filters} 
          setFilters={setFilters} 
          activeTab={activeTab}
          vehicles={vehicles}
          responders={responders}
        />

        {/* TAB SWITCHER */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-3 px-8 py-4 font-bold text-lg transition-all duration-300 border-b-4 ${
              activeTab === 'vehicles'
                ? 'border-green-600 text-green-800 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Truck size={24} />
            Available Vehicles
            <span className="ml-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-bold">
              {filteredVehicles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('responders')}
            className={`flex items-center gap-3 px-8 py-4 font-bold text-lg transition-all duration-300 border-b-4 ${
              activeTab === 'responders'
                ? 'border-blue-600 text-blue-800 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User size={24} />
            Available Responders
            <span className="ml-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-bold">
              {filteredResponders.length}
            </span>
          </button>
        </div>

        {/* MAIN CONTENT — SHOW ALL OPTIONS, NOT JUST RECOMMENDED */}
        <div className="space-y-10">
          {/* VEHICLES TAB */}
          {activeTab === 'vehicles' ? (
            <Card title={`Available Vehicles (${filteredVehicles.length})`} icon={Truck}>
              {isLoadingVehicles ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
                  <p className="text-gray-600 font-medium">Loading available vehicles...</p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-16">
                  <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">No vehicles available</p>
                  <p className="text-gray-500">
                    {vehicles.length === 0 
                      ? "No vehicles match the handling requirements at this time"
                      : "No vehicles match the current filters"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      const defaultStatus = 'Operational';
                      setFilters({
                        region: 'all',
                        capability: [],
                        showAvailableOnly: true,
                        search: '',
                        status: defaultStatus
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Show ALL vehicles, including recommended one if it exists */}
                  {filteredVehicles.map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      isSelected={selectedVehicleId === String(vehicle.id)}
                      isRecommended={recommendedVehicle?.id === vehicle.id}
                      onSelect={() => setSelectedVehicleId(String(vehicle.id))}
                      onViewDetail={() => {
                        setSelectedVehicleDetail(vehicle);
                        setShowVehicleModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          ) : (
            /* RESPONDERS TAB */
            <Card title={`Available Responders (${filteredResponders.length})`} icon={User}>
              {isLoadingResponders ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
                  <p className="text-gray-600 font-medium">Loading available responders...</p>
                </div>
              ) : filteredResponders.length === 0 ? (
                <div className="text-center py-16">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">No responders available</p>
                  <p className="text-gray-500">
                    {responders.length === 0 
                      ? "All responders are currently assigned to other allocations"
                      : "No responders match the current filters"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      const defaultStatus = 'Available';
                      setFilters({
                        region: 'all',
                        capability: [],
                        showAvailableOnly: true,
                        search: '',
                        status: defaultStatus
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Show ALL responders, including recommended one if it exists */}
                  {filteredResponders.map(responder => (
                    <ResponderCard
                      key={responder.id}
                      responder={responder}
                      isSelected={selectedResponderId === String(responder.id)}
                      isRecommended={recommendedResponder?.id === responder.id}
                      onSelect={() => setSelectedResponderId(String(responder.id))}
                      onViewDetail={() => {
                        setSelectedResponderDetail(responder);
                        setShowResponderModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Route Visualization */}
        <Card className="my-8">
          <RouteVisualization
            source={source}
            destination={destination}
            distance_km={details?.meta?.distance_km}
            estimated_eta={details?.meta?.estimated_eta}
          />
        </Card>

        {/* Final Assignment Button */}
        <Card className="mb-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-900 mb-4">Ready to Dispatch</h3>
            <p className="text-gray-600 mb-8">
              Review your selections and assign logistics to proceed to live tracking
            </p>
            
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="text-green-600" size={20} />
                    <h5 className="font-bold text-green-900">Selected Vehicle</h5>
                  </div>
                  {selectedVehicleId ? (
                    <>
                      <p className="text-2xl font-bold text-green-900">
                        {vehicles.find(v => String(v.id) === selectedVehicleId)?.plate_number || 
                         vehicles.find(v => String(v.id) === selectedVehicleId)?.asset_code}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {vehicles.find(v => String(v.id) === selectedVehicleId)?.type}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No vehicle selected</p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="text-blue-600" size={20} />
                    <h5 className="font-bold text-blue-900">Selected Responder</h5>
                  </div>
                  {selectedResponderId ? (
                    <>
                      <p className="text-2xl font-bold text-blue-900">
                        {responders.find(r => String(r.id) === selectedResponderId)?.full_name || 
                         responders.find(r => String(r.id) === selectedResponderId)?.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {responders.find(r => String(r.id) === selectedResponderId)?.responder_code}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No responder selected</p>
                  )}
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              disabled={!selectedVehicleId || !selectedResponderId || isAssigning || details?.status !== 'confirmed'}
              onClick={handleAssign}
              className="px-16 py-6 text-xl"
            >
              <Truck className="mr-3" />
              {isAssigning ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={24} />
                  Assigning Logistics...
                </>
              ) : (
                <>
                  Assign Vehicle & Responder → Proceed to Live Tracking
                </>
              )}
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              This will assign the selected resources and transition the allocation to "In Transit" status
            </p>
          </div>
        </Card>

        {/* Floating Assignment Button */}
        {(selectedVehicleId || selectedResponderId) && allocation?.status === 'confirmed' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                {selectedVehicleId && (
                  <div className="flex items-center gap-2">
                    <Truck className="text-green-600" size={20} />
                    <p className="text-lg font-bold text-green-800">Vehicle Selected</p>
                  </div>
                )}
                {selectedResponderId && (
                  <div className="flex items-center gap-2">
                    <User className="text-blue-600" size={20} />
                    <p className="text-lg font-bold text-blue-800">Responder Selected</p>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleAssign}
                disabled={!selectedVehicleId || !selectedResponderId || isAssigning}
              >
                {isAssigning ? (
                  <><Loader2 className="animate-spin mr-2" /> Assigning...</>
                ) : (
                  <><Truck className="mr-3" />Assign Logistics & Start Live Tracking</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* VEHICLE DETAIL MODAL */}
      {showVehicleModal && selectedVehicleDetail && (
        <VehicleDetailModal
          vehicle={selectedVehicleDetail}
          onClose={() => setShowVehicleModal(false)}
          onSelect={() => {
            setSelectedVehicleId(String(selectedVehicleDetail.id));
            setShowVehicleModal(false);
          }}
        />
      )}

      {/* RESPONDER DETAIL MODAL */}
      {showResponderModal && selectedResponderDetail && (
        <ResponderDetailModal
          responder={selectedResponderDetail}
          onClose={() => setShowResponderModal(false)}
          onSelect={() => {
            setSelectedResponderId(String(selectedResponderDetail.id));
            setShowResponderModal(false);
          }}
        />
      )}
    </div>
  );
}