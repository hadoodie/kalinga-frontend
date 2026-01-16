// Allocation.jsx - COMPLETE ENHANCED VERSION WITH FIXED MODALS (2500+ lines)
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  List,
  Check,
  X,
  ArrowRightLeft,
  Package,
  PackageOpen,
  PackageCheck,
  Truck,
  Clock,
  Loader2,
  RefreshCw,
  MapPin,
  Building2,
  Phone,
  Mail,
  Info,
  Search,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Navigation,
  FileText,
  Award,
  Shield,
  Route,
  Play,
  TrendingUp,
  Activity,
  Gauge,
  ThermometerSnowflake,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Map,
  Home,
  Fuel,
  ClipboardList,
  ChevronRight,
  Filter as FilterIcon,
  Mail as MailIcon,
  Home as HomeIcon,
  User as UserIcon,
  Map as MapIcon,
  Shield as ShieldIcon,
  Truck as TruckIcon,
  MapPin as MapPinIcon,
  PhoneCall,
  MessageSquare,
  Printer,
  Share2,
  Video as VideoIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  List as ListIcon,
  Target as TargetIcon,
  Map as MapIcon2,
  Globe as GlobeIcon,
  Navigation as NavigationIcon,
  Compass as CompassIcon,
  MapPin as MapPinIcon2,
  Flag as FlagIcon,
  Navigation2 as Navigation2Icon,
  Eye,
  Settings,
  Wrench,
  Battery,
  Zap,
  Star,
  BadgeCheck,
  DollarSign,
  Users,
  BarChart3,
  Percent,
  Target,
  ShieldOff,
  Bell,
  Download,
  Upload,
  Link,
  Lock,
  Unlock,
  Heart,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  HelpCircle,
  Minimize2,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Grid,
  Layout,
  Sidebar,
  Menu,
  MoreVertical,
  MoreHorizontal,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Copy,
  Scissors,
  Type,
  Bold,
  Italic,
  Underline,
  Link2,
  Image,
  Film,
  Music,
  Mic,
  Volume2,
  Headphones,
  Camera,
  Video,
  MicOff,
  VolumeX,
  Airplay,
  Cast,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  BatteryCharging,
  Power,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Sparkles,
  Command,
  Hash,
  AtSign,
  Asterisk,
  Percent as PercentIcon,
  Ampersand,
  PlusCircle,
  MinusCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import allocationService from "../../services/allocationService";
import CoordinationPanel from '@/components/logistics/allocation/CoordinationPanel';
import LogisticsAssignment from '@/components/logistics/allocation/LogisticsAssignment';
import VehicleDetailsModal from '@/components/logistics/allocation/VehicleDetailsModal';
import ResponderViewModal from '@/components/logistics/allocation/ResponderViewModal';

// Toast Notification Component
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-gradient-to-r from-green-600 to-emerald-600" : 
                  type === "error" ? "bg-gradient-to-r from-red-600 to-rose-600" : 
                  type === "info" ? "bg-gradient-to-r from-blue-600 to-cyan-600" : 
                  "bg-gradient-to-r from-amber-600 to-yellow-600";

  return (
    <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-in flex items-center gap-3 min-w-[320px] max-w-md`}>
      {type === "success" && <CheckCircle size={24} className="animate-pulse" />}
      {type === "error" && <AlertCircle size={24} />}
      {type === "info" && <Info size={24} />}
      <div className="flex-1">
        <p className="font-semibold text-lg">{message}</p>
      </div>
      <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1.5 transition-all duration-200 hover:scale-110">
        <X size={20} />
      </button>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = "lg", showCloseButton = true }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-7xl"
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-[100] animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto border-2 border-green-300/50`}>
        <div className="p-6 border-b-2 border-green-300/50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-bold text-green-900 bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
            {title}
          </h2>
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:rotate-90 transform"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Tab Button with Live Counts
const TabButton = ({ label, isActive, onClick, icon: Icon, count = 0, variant = "primary" }) => {
  const variants = {
    primary: isActive 
      ? "border-green-700 text-green-900 bg-gradient-to-r from-green-50 to-emerald-50" 
      : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50",
    secondary: isActive
      ? "border-blue-700 text-blue-900 bg-gradient-to-r from-blue-50 to-cyan-50"
      : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 text-base font-semibold border-b-4 transition-all duration-300 relative ${variants[variant]}`}
    >
      {Icon && <Icon size={20} className={isActive ? "animate-pulse" : ""} />}
      {label}
      {count > 0 && (
        <span className="ml-2 px-2.5 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full">
          {count}
        </span>
      )}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
      )}
    </button>
  );
};

// Badge Component
const Badge = ({ children, variant = "default", className = "", icon: Icon, pulse = false }) => {
  const variants = {
    default: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
    success: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300",
    warning: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300",
    danger: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300",
    info: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300",
    purple: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${variants[variant]} ${pulse ? 'animate-pulse' : ''} ${className}`}>
      {Icon && <Icon size={14} className="mr-1.5" />}
      {children}
    </span>
  );
};

// Card Components
const Card = ({ children, className = "", hover = false, elevated = false, border = true }) => (
  <div className={`bg-white rounded-2xl shadow-lg ${border ? 'border border-green-300/50' : ''} ${hover ? "hover:shadow-2xl hover:border-green-400 transition-all duration-300 hover:-translate-y-1" : ""} ${elevated ? "shadow-xl" : ""} ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 border-b border-green-300/50 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "", padding = true }) => (
  <div className={`${padding ? 'p-6' : ''} ${className}`}>
    {children}
  </div>
);

// Button Component
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = "primary", 
  size = "md", 
  className = "",
  icon: Icon,
  fullWidth = false,
  loading = false
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-green-700 via-green-600 to-emerald-700 hover:from-green-600 hover:via-green-500 hover:to-emerald-600 text-white focus:ring-green-500",
    secondary: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white focus:ring-green-400",
    outline: "border-2 border-green-300 bg-white hover:bg-green-50 text-green-900 focus:ring-green-300 hover:border-green-400 hover:text-green-800",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white focus:ring-red-500",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white focus:ring-emerald-500",
    ghost: "bg-transparent hover:bg-green-100 text-gray-700 border border-gray-300 hover:border-green-300 hover:text-green-800",
    info: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white focus:ring-blue-500",
    warning: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white focus:ring-amber-500"
  };

  const sizes = {
    sm: "px-4 py-2.5 text-sm gap-2",
    md: "px-6 py-3 text-base gap-3",
    lg: "px-8 py-4 text-lg gap-4"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === "sm" ? 16 : size === "lg" ? 22 : 20} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === "sm" ? 16 : size === "lg" ? 22 : 20} />}
          {children}
        </>
      )}
    </button>
  );
};

// Info Chip Component
const InfoChip = ({ label, value, icon: Icon, color = "green", size = "md" }) => {
  const colors = {
    green: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200",
    blue: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border border-blue-200",
    amber: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border border-amber-200",
    gray: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200",
    purple: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 border border-purple-200",
    red: "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200",
    emerald: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-200",
    cyan: "bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-800 border border-cyan-200"
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-5 py-4 text-base"
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl ${sizes[size]} ${colors[color]} transition-all duration-200 hover:scale-[1.02] hover:shadow-sm`}>
      {Icon && <Icon size={size === "lg" ? 20 : size === "sm" ? 14 : 18} className="flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium opacity-75 mb-0.5">{label}</p>
        <p className="font-semibold truncate">{value || "—"}</p>
      </div>
    </div>
  );
};

// Route Visualization Component
const RouteVisualization = ({ source, destination, distance_km, estimated_eta }) => (
  <div className="bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/80 rounded-2xl border border-green-300/50 p-6 backdrop-blur-sm">
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h4 className="text-xl font-bold text-green-900 bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
          Route Overview
        </h4>
        <p className="text-sm text-gray-600">Source to destination navigation with live tracking</p>
      </div>
      <div className="flex gap-3">
        <InfoChip label="Distance" value={distance_km ? `${Number(distance_km).toFixed(1)} km` : "Calculating..."} icon={Route} color="green" />
        <InfoChip label="Est. Duration" value={estimated_eta || "Calculating..."} icon={Clock} color="blue" />
      </div>
    </div>
    <div className="relative py-10">
      <div className="absolute inset-0 flex items-center px-8 md:px-16">
        <div className="w-full h-2 bg-gradient-to-r from-green-300 via-green-400 to-emerald-300 rounded-full opacity-60"></div>
        <div className="absolute inset-0 w-full h-2 bg-gradient-to-r from-green-200 via-emerald-200 to-green-200 rounded-full blur-sm"></div>
      </div>
      <div className="relative flex justify-between px-2 md:px-8">
        <div className="flex flex-col items-center">
          <div className="w-18 h-18 md:w-20 md:h-20 bg-white border-4 border-green-600 rounded-full flex items-center justify-center shadow-xl mb-3 animate-pulse">
            <Building2 className="text-green-600" size={32} />
          </div>
          <div className="text-center max-w-[160px]">
            <p className="font-bold text-green-900 text-sm md:text-base">{source?.name || "—"}</p>
            <p className="text-xs text-gray-600 truncate">{source?.address || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center -translate-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 rounded-full flex items-center justify-center shadow-2xl mb-3 animate-bounce">
            <Navigation className="text-white" size={40} />
          </div>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
            <p className="font-bold">Active Route</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-18 h-18 md:w-20 md:h-20 bg-white border-4 border-green-600 rounded-full flex items-center justify-center shadow-xl mb-3 animate-pulse">
            <Building2 className="text-green-600" size={32} />
          </div>
          <div className="text-center max-w-[160px]">
            <p className="font-bold text-green-900 text-sm md:text-base">{destination?.name || "—"}</p>
            <p className="text-xs text-gray-600 truncate">{destination?.address || "—"}</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-center mt-6">
      <Button variant="outline" size="sm" icon={Map}>
        View Full Route Map
      </Button>
    </div>
  </div>
);


// Helper getters for assignment data (safe fallbacks)
function getAssignedVehicle(allocation, assignmentDetails) {
  return (
    assignmentDetails?.allocationVehicles?.[0]?.asset
    ?? assignmentDetails?.allocation_vehicles?.[0]?.asset
    ?? allocation?.allocationVehicles?.[0]?.asset
    ?? allocation?.allocation_vehicles?.[0]?.asset
    ?? null
  );
}

function getAssignedResponder(allocation, assignmentDetails) {
  return (
    assignmentDetails?.allocationVehicles?.[0]?.responder
    ?? assignmentDetails?.allocation_vehicles?.[0]?.responder
    ?? allocation?.allocationVehicles?.[0]?.responder
    ?? allocation?.allocation_vehicles?.[0]?.responder
    ?? null
  );
}

function getAssignedBy(allocation, assignmentDetails) {
  const raw = (
    assignmentDetails?.allocationVehicles?.[0]?.assignedBy
    ?? assignmentDetails?.allocation_vehicles?.[0]?.assignedBy
    ?? assignmentDetails?.allocationVehicles?.[0]?.assignedByUser
    ?? assignmentDetails?.allocation_vehicles?.[0]?.assignedByUser
    ?? allocation?.allocationVehicles?.[0]?.assignedBy
    ?? allocation?.allocation_vehicles?.[0]?.assignedBy
    ?? allocation?.allocationVehicles?.[0]?.assignedByUser
    ?? allocation?.allocation_vehicles?.[0]?.assignedByUser
    ?? null
  );

  // If the backend only returned a numeric id for assigned_by, normalize to an object
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') return raw;
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    return { id: numeric, name: null };
  }
  return { id: raw, name: String(raw) };
}

function getAssignedAt(allocation, assignmentDetails) {
  return (
    assignmentDetails?.allocationVehicles?.[0]?.assigned_at
    ?? assignmentDetails?.allocation_vehicles?.[0]?.assigned_at
    ?? allocation?.allocationVehicles?.[0]?.assigned_at
    ?? allocation?.allocation_vehicles?.[0]?.assigned_at
    ?? allocation?.assigned_at
    ?? null
  );
}

function getSourceHospital(allocation, assignmentDetails) {
  return assignmentDetails?.sourceHospital ?? allocation?.sourceHospital ?? null;
}

function getDestinationHospital(allocation, assignmentDetails) {
  return assignmentDetails?.destinationHospital ?? allocation?.destinationHospital ?? null;
}

function getAssignmentMeta(assignmentDetails, allocation) {
  return assignmentDetails?.meta ?? allocation?.meta ?? {};
}

// Shared parse helper for capabilities (file-scope)
function parseCapabilitiesShared(capabilitiesString) {
  if (!capabilitiesString) return [];
  try {
    if (Array.isArray(capabilitiesString)) return capabilitiesString;
    if (typeof capabilitiesString === 'string' && (capabilitiesString.startsWith('[') || capabilitiesString.startsWith('{'))) {
      const parsed = JSON.parse(capabilitiesString);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (typeof capabilitiesString === 'string' && capabilitiesString.includes(',')) {
      return capabilitiesString.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [capabilitiesString];
  } catch (err) {
    return [];
  }
}

// Enhanced Assignment Summary Modal Component
const AssignmentSummaryModal = ({ 
  isOpen, 
  onClose, 
  allocation, 
  assignmentDetails,
  loading = false,
  onViewVehicleDetails,
  onViewResponderProfile
}) => {
  if (!isOpen) return null;

  const vehicle = getAssignedVehicle(allocation, assignmentDetails);
  const responder = getAssignedResponder(allocation, assignmentDetails);
  const assignedBy = getAssignedBy(allocation, assignmentDetails);
  const assignedAt = getAssignedAt(allocation, assignmentDetails);

  const sourceHospital = getSourceHospital(allocation, assignmentDetails);
  const destinationHospital = getDestinationHospital(allocation, assignmentDetails);
  const assignmentMeta = getAssignmentMeta(assignmentDetails, allocation);

  // Parse capabilities safely
  const parseCapabilities = (capabilitiesString) => {
    if (!capabilitiesString) return [];
    try {
      if (Array.isArray(capabilitiesString)) return capabilitiesString;
      if (capabilitiesString.startsWith('[') || capabilitiesString.startsWith('{')) {
        const parsed = JSON.parse(capabilitiesString);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      if (capabilitiesString.includes(',')) {
        return capabilitiesString.split(',').map(item => item.trim()).filter(item => item);
      }
      return [capabilitiesString];
    } catch (error) {
      console.error('Error parsing capabilities:', error);
      return [];
    }
  };

  const vehicleCapabilities = parseCapabilities(vehicle?.capabilities);
  const responderCapabilities = parseCapabilities(responder?.handling_capabilities);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Assignment Summary" 
      size="full"
    >
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-20 w-20 animate-spin text-green-600 mx-auto mb-6" />
          <p className="text-xl text-gray-700 font-semibold">Loading assignment details...</p>
          <p className="text-gray-600 mt-2">Please wait while we fetch the complete information</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border-2 border-green-300 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <CheckCircle className="text-white" size={36} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-green-900 mb-2">
                  Logistics Successfully Assigned!
                </h3>
                <p className="text-green-800 text-lg">
                  Allocation #{allocation?.id} is now ready for live tracking and dispatch
                </p>
              </div>
              <Badge variant="success" className="text-lg px-5 py-2.5 animate-pulse">
                STATUS: {allocation?.status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Allocation Info (1/4) */}
            <div className="lg:col-span-1 space-y-6">
              <Card hover elevated>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
                  <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                    <Package size={20} className="text-green-700" />
                    Allocation Info
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <Badge variant="success" className="text-base px-5 py-2.5 animate-pulse">
                        <CheckCircle size={18} className="mr-2" />
                        {ALLOCATION_STATUS_UI_LABELS[allocation?.status] || allocation?.status}
                      </Badge>
                    </div>
                    
                    <InfoChip 
                      label="Allocation ID" 
                      value={`#${allocation?.id}`} 
                      icon={FileText} 
                    />
                    <InfoChip 
                      label="Resource Type" 
                      value={allocation?.resource_type} 
                      icon={Package} 
                    />
                    <InfoChip 
                      label="Quantity" 
                      value={allocation?.quantity} 
                      icon={Gauge} 
                    />
                    <InfoChip 
                      label="Handling Class" 
                      value={allocation?.handling_class || "General"} 
                      icon={Shield}
                      color="blue"
                    />
                    <InfoChip 
                      label="Urgency Level" 
                      value={allocation?.request?.urgency_level || "Medium"} 
                      icon={AlertCircle}
                      color={allocation?.request?.urgency_level === "Critical" ? "danger" : "warning"}
                    />
                    
                    {/* Timestamps */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <Clock size={16} />
                        Timeline
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1.5">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium text-gray-900">
                            {formatDateLabel(allocation?.created_at)}
                          </span>
                        </div>
                        {allocation?.confirmed_at && (
                          <div className="flex justify-between py-1.5">
                            <span className="text-gray-600">Confirmed:</span>
                            <span className="font-medium text-gray-900">
                              {formatDateLabel(allocation?.confirmed_at)}
                            </span>
                          </div>
                        )}
                        {assignedAt && (
                          <div className="flex justify-between py-1.5 bg-green-50 px-2 rounded">
                            <span className="text-gray-600">Assigned:</span>
                            <span className="font-bold text-green-900">
                              {formatDateLabel(assignedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card hover>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <Activity size={20} />
                    Quick Actions
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="primary" size="sm" fullWidth icon={Play}>
                      Start Live Tracking
                    </Button>
                    <Button variant="outline" size="sm" fullWidth icon={ExternalLink}>
                      View Full Details
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth icon={Printer}>
                      Print Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Assignment Details (3/4) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Vehicle & Responder Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicle Details Card - Clickable */}
                <Card hover elevated>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                        <Truck size={20} className="text-green-700" />
                        Assigned Vehicle
                      </h3>
                      <Badge variant="success" pulse>ACTIVE</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div 
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300 hover:border-green-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          if (vehicle && onViewVehicleDetails) {
                            console.log("Vehicle clicked in summary modal:", vehicle);
                            onViewVehicleDetails(vehicle);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-2xl font-bold text-green-900">
                            {vehicle?.plate_number || vehicle?.asset_code || "—"}
                          </h4>
                          <Eye size={20} className="text-green-600 hover:text-green-800" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoChip 
                            label="Vehicle Type" 
                            value={vehicle?.type} 
                            icon={Truck} 
                          />
                          <InfoChip 
                            label="Model" 
                            value={vehicle?.model || "N/A"} 
                            icon={FileText} 
                          />
                          <InfoChip 
                            label="Category" 
                            value={vehicle?.category || "N/A"} 
                            icon={Package} 
                          />
                          <InfoChip 
                            label="Status" 
                            value={vehicle?.status || "Operational"} 
                            icon={CheckCircle}
                            color="green"
                          />
                          <InfoChip 
                            label="Asset Code" 
                            value={vehicle?.asset_code} 
                            icon={FileText}
                            color="blue"
                          />
                          <InfoChip 
                            label="Location" 
                            value={vehicle?.location || "Not specified"} 
                            icon={MapPin}
                            color="amber"
                          />
                          <InfoChip 
                            label="Condition" 
                            value={vehicle?.condition || "Excellent"} 
                            icon={Award}
                            color="emerald"
                          />
                          <InfoChip 
                            label="Fuel Type" 
                            value={vehicle?.fuel_type || "N/A"} 
                            icon={Fuel}
                            color="gray"
                          />
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Award size={16} />
                          Vehicle Condition & Metrics
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Operational Status</span>
                              <span className="text-sm font-semibold text-green-900">85%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Fuel Level</span>
                              <span className="text-sm font-semibold text-amber-900">{vehicle?.current_fuel_level || 75}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full" style={{ width: `${vehicle?.current_fuel_level || 75}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h5 className="font-semibold text-green-900 mb-2">Capabilities</h5>
                        <div className="flex flex-wrap gap-2">
                          {vehicleCapabilities.slice(0, 4).map((cap, idx) => (
                            <Badge key={idx} variant="info" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                          {(!vehicle?.capabilities || vehicleCapabilities.length === 0) && (
                            <span className="text-sm text-gray-500">No special capabilities</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Responder Details Card - Clickable */}
                <Card hover elevated>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <User size={20} className="text-blue-700" />
                        Assigned Responder
                      </h3>
                      <Badge variant="info" pulse>ON DUTY</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div 
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-300 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          if (responder && onViewResponderProfile) {
                            console.log("Responder clicked in summary modal:", responder);
                            onViewResponderProfile(responder);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {responder?.user?.profile_image ? (
                            <img
                              src={`${import.meta.env.VITE_APP_URL || ''}${responder.user.profile_image}`}
                              alt="Responder"
                              className="w-16 h-16 rounded-full object-cover border-3 border-blue-400 shadow-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {responder?.full_name?.charAt(0) || "R"}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-2xl font-bold text-blue-900 mb-1">
                                  {responder?.full_name || responder?.name || "—"}
                                </h4>
                                <p className="text-gray-700 font-medium">
                                  {responder?.responder_code || "—"} • {responder?.years_experience || "5"} yrs exp
                                </p>
                              </div>
                              <Eye size={20} className="text-blue-600 hover:text-blue-800" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoChip 
                            label="Responder Code" 
                            value={responder?.responder_code} 
                            icon={FileText}
                            color="blue"
                          />
                          <InfoChip 
                            label="Contact Number" 
                            value={formatPhone(responder?.contact_number || responder?.phone)} 
                            icon={Phone}
                            color="blue"
                          />
                          <InfoChip 
                            label="Email" 
                            value={responder?.user?.email || responder?.email || "N/A"} 
                            icon={Mail}
                            color="blue"
                          />
                          <InfoChip 
                            label="Status" 
                            value={responder?.status || "Available"} 
                            icon={CheckCircle}
                            color="green"
                          />
                          <InfoChip 
                            label="Experience" 
                            value={`${responder?.years_experience || "5"} years`} 
                            icon={Award}
                            color="amber"
                          />
                          <InfoChip 
                            label="License Number" 
                            value={responder?.license_number || "Not provided"} 
                            icon={ShieldCheck}
                            color="purple"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Activity size={16} />
                          Availability & Contact
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Available for dispatch</span>
                          </div>
                          {responder?.user?.address && (
                            <div className="flex items-start gap-2 text-sm">
                              <Home size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-gray-800">{responder.user.address}</p>
                                {responder.user.barangay && responder.user.city && (
                                  <p className="text-gray-600 text-xs">
                                    {responder.user.barangay}, {responder.user.city} {responder.user.zip_code}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4 pt-2">
                            <Button variant="ghost" size="sm" icon={PhoneCall}>
                              Call
                            </Button>
                            <Button variant="ghost" size="sm" icon={MessageSquare}>
                              Message
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              icon={User}
                              onClick={() => responder && onViewResponderProfile && onViewResponderProfile(responder)}
                              className="ml-auto"
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h5 className="font-semibold text-blue-900 mb-2">Handling Capabilities</h5>
                        <div className="flex flex-wrap gap-2">
                          {responderCapabilities.slice(0, 3).map((cap, idx) => (
                            <Badge key={idx} variant="info" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                          {(!responder?.handling_capabilities || responderCapabilities.length === 0) && (
                            <span className="text-sm text-gray-500">Standard handling</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ASSIGNED LOGISTICS SUMMARY CARD - Enhanced Version */}
              {["logistics_assigned", "in_transit", "delivered", "verified"].includes(allocation?.status) && allocation?.allocationVehicles?.[0] && (
                <Card title="Assigned Logistics" icon={Truck} hover elevated className="mb-8 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Responder Full Profile */}
                    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-2xl p-6 border border-blue-300/50 shadow-inner">
                      <div className="flex items-center gap-5 mb-6">
                        {responder?.user?.profile_image ? (
                          <div className="relative">
                            <img
                              src={`${import.meta.env.VITE_APP_URL || ''}${responder.user.profile_image}`}
                              alt="Responder"
                              className="w-20 h-20 rounded-full object-cover border-4 border-blue-400 shadow-xl"
                            />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <CheckCircle size={14} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                            {responder?.full_name?.charAt(0) || "R"}
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-blue-900">
                            {responder?.full_name}
                          </h3>
                          <p className="text-lg font-semibold text-blue-700">
                            {responder?.responder_code}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="info" className="text-xs animate-pulse">
                              {responder?.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={User}
                              onClick={() => {
                                if (responder && onViewResponderProfile) {
                                    onViewResponderProfile(responder);
                                  }
                              }}
                              className="text-xs"
                            >
                              View Full Profile
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-100/50 rounded-xl">
                          <Mail className="text-blue-600" size={18} />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Email Address</p>
                            <p className="font-medium text-blue-900">{responder?.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-100/50 rounded-xl">
                          <Phone className="text-blue-600" size={18} />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Contact Number</p>
                            <p className="font-medium text-blue-900">{formatPhone(responder?.contact_number)}</p>
                          </div>
                        </div>
                        {responder?.user?.address && (
                          <div className="flex items-start gap-3 p-3 bg-blue-100/50 rounded-xl">
                            <Home className="text-blue-600 mt-1" size={18} />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600">Complete Address</p>
                              <p className="font-medium text-blue-900">{responder?.user?.address}</p>
                              {(responder?.user?.barangay || responder?.user?.city) && (
                                <p className="text-sm text-gray-700 mt-1">
                                  {responder?.user?.barangay && `${responder.user.barangay}, `}
                                  {responder?.user?.city} 
                                  {responder?.user?.zip_code && ` ${responder.user.zip_code}`}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-blue-100/50 rounded-xl">
                          <Shield className="text-green-600" size={18} />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Handling Capabilities</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {responderCapabilities.map((cap, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={User}
                          fullWidth
                          onClick={() => {
                            if (responder && onViewResponderProfile) {
                              onViewResponderProfile(responder);
                            }
                          }}
                        >
                          <User size={16} className="mr-2" />
                          View Complete Responder Profile
                        </Button>
                      </div>
                    </div>

                    {/* RIGHT: Vehicle Info */}
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 rounded-2xl p-6 border border-emerald-300/50 shadow-inner">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl">
                          <Truck className="text-white" size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-emerald-900">Assigned Vehicle</h3>
                          <p className="text-gray-600">Complete vehicle specifications</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div 
                          className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl p-5 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            if (vehicle && onViewVehicleDetails) {
                              onViewVehicleDetails(vehicle);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-3xl font-black text-emerald-800 mb-2">
                                {vehicle?.plate_number}
                              </h4>
                              <p className="text-lg font-medium text-gray-700 mb-4">
                                {vehicle?.type} • {vehicle?.model}
                              </p>
                            </div>
                            <Eye size={20} className="text-emerald-600 hover:text-emerald-800" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <InfoChip label="Asset Code" value={vehicle?.asset_code} color="green" size="sm" />
                            <InfoChip label="Category" value={vehicle?.category} color="green" size="sm" />
                            <InfoChip label="Status" value={vehicle?.status} color="success" size="sm" />
                            <InfoChip label="Condition" value={vehicle?.condition || 'Excellent'} color="emerald" size="sm" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                              <Award size={16} />
                              Vehicle Specifications
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <InfoChip label="Manufacturer" value={vehicle?.manufacturer} color="gray" size="sm" />
                              <InfoChip label="Year" value={vehicle?.year_manufactured} color="gray" size="sm" />
                              <InfoChip label="Capacity" value={vehicle?.capacity} color="gray" size="sm" />
                              <InfoChip label="Fuel Type" value={vehicle?.fuel_type} color="gray" size="sm" />
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                              <ShieldCheck size={16} />
                              Capabilities
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {vehicleCapabilities.map((cap, idx) => (
                                <Badge key={idx} variant="success" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                              <MapPin size={16} />
                              Location & Maintenance
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <InfoChip label="Current Location" value={vehicle?.location} color="blue" size="sm" />
                              <InfoChip label="Next Maintenance" value={formatDateLabel(vehicle?.next_maintenance)} color="amber" size="sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Info Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Assigned by</p>
                            <p className="font-bold text-gray-900">
                              {assignedBy?.name || 'Logistic Dispatcher'}
                            </p>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Assigned at</p>
                            <p className="font-bold text-gray-900">
                              {formatDateLabel(assignedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="success" className="text-lg px-4 py-2 animate-pulse">
                          {allocation.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm" icon={Share2}>
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Route Visualization Card */}
              <Card hover elevated>
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-300">
                  <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    <Map size={20} className="text-emerald-700" />
                    Route Visualization
                  </h3>
                </CardHeader>
                <CardContent>
                  <RouteVisualization
                    source={sourceHospital}
                    destination={destinationHospital}
                    distance_km={assignmentDetails?.meta?.distance_km}
                    estimated_eta={assignmentDetails?.meta?.estimated_eta}
                  />
                </CardContent>
              </Card>

              {/* Assignment Metadata Card */}
              <Card hover>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={20} className="text-gray-700" />
                    Assignment Information
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoChip 
                      label="Assigned By" 
                      value={assignedBy?.name || "Logistic Dispatcher"} 
                      icon={User}
                      color="gray"
                    />
                    <InfoChip 
                      label="Assigned At" 
                      value={formatDateLabel(assignedAt)} 
                      icon={Calendar}
                      color="gray"
                    />
                    <InfoChip 
                      label="Assignment Status" 
                      value="Active" 
                      icon={Activity}
                      color="green"
                    />
                    <InfoChip 
                      label="Current Phase" 
                      value="Phase 3: Logistics Assigned" 
                      icon={TrendingUp}
                      color="blue"
                    />
                    <InfoChip 
                      label="Next Action" 
                      value="Live Tracking" 
                      icon={Navigation}
                      color="purple"
                    />
                    <InfoChip 
                      label="Estimated Delivery" 
                      value={formatDateLabel(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())} 
                      icon={Clock}
                      color="amber"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Play}
                  className="flex-1 sm:flex-none"
                >
                  <Play size={22} className="mr-3" />
                  Start Live Tracking
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  icon={ExternalLink}
                  className="flex-1 sm:flex-none"
                >
                  <ExternalLink size={22} className="mr-3" />
                  View Full Route Details
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  icon={X}
                  onClick={onClose}
                  className="flex-1 sm:flex-none"
                >
                  <X size={22} className="mr-3" />
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Enhanced Allocation Card Component with Live Counts
function EnhancedAllocationCard({ 
  allocation, 
  onConfirm, 
  onAssign, 
  onViewSummary, 
  onViewVehicleDetails, 
  onViewResponderProfile, // ADDED THIS
  assignmentDetails 
}) {
  const statusLabel = ALLOCATION_STATUS_UI_LABELS[allocation.status] ?? allocation.status;
  const canConfirm = allocation.status === "planned";
  const canAssign = ["planned", "confirmed"].includes(allocation.status);
  const hasLogisticsAssigned = allocation.status === "logistics_assigned";
  const hasAssignmentDetails = !!assignmentDetails;
  
  // Local assignment helpers for this card
  const vehicle = getAssignedVehicle(allocation, assignmentDetails);
  const responder = getAssignedResponder(allocation, assignmentDetails);
  const assignedBy = getAssignedBy(allocation, assignmentDetails);
  const assignedAt = getAssignedAt(allocation, assignmentDetails);
  const assignmentMeta = getAssignmentMeta(assignmentDetails, allocation);
  const vehicleCapabilities = parseCapabilitiesShared(vehicle?.capabilities);
  const responderCapabilities = parseCapabilitiesShared(responder?.handling_capabilities);
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "planned": return <Clock className="text-amber-600" size={20} />;
      case "confirmed": return <Check className="text-blue-600" size={20} />;
      case "logistics_assigned": return <Truck className="text-green-600" size={20} />;
      case "in_transit": return <Navigation className="text-purple-600" size={20} />;
      case "delivered": return <PackageCheck className="text-emerald-600" size={20} />;
      default: return <Package className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planned": return "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-300";
      case "confirmed": return "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border-blue-300";
      case "logistics_assigned": return "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300";
      case "in_transit": return "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 border-purple-300";
      case "delivered": return "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-300";
      default: return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card hover elevated className="border-l-4 border-l-green-500 hover:border-l-green-600 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getStatusColor(allocation.status).split(' ')[0]}`}>
              {getStatusIcon(allocation.status)}
            </div>
            <div>
              <h4 className="text-xl font-bold text-green-900">
                Allocation #{allocation.id}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {formatDateLabel(allocation.created_at)}
                </Badge>
                {allocation.handling_class && (
                  <Badge variant="info" className="text-xs">
                    {allocation.handling_class}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${getStatusColor(allocation.status)}`}>
            {statusLabel}
          </div>
        </div>

        {/* Resource and Route Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Resource Details</h5>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-900 text-lg">{allocation.resource_type}</span>
                  <span className="text-2xl font-bold text-green-900">{allocation.quantity}</span>
                </div>
                <p className="text-xl text-gray-600">
                  {allocation.request?.resource_name || `Request #${allocation.request_id || 'N/A'}`}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Route</h5>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-900">Source</span>
                </div>
                <Navigation size={16} className="text-blue-600" />
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-900">Destination</span>
                </div>
              </div>
              <div className="text-xl">
                <p className="font-semibold text-gray-900 truncate">
                  {allocation.sourceHospital?.name || allocation.source_hospital_id || 'N/A'} → {allocation.destinationHospital?.name || allocation.destination_hospital_id || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ASSIGNED LOGISTICS SUMMARY - Enhanced Version with Clickable Vehicle and Responder */}
        {hasLogisticsAssigned && (vehicle || responder) && (
          <div className="mb-6 animate-fade-in">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Assigned Logistics</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:border-green-400 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  if (onViewVehicleDetails && vehicle) {
                    console.log("Vehicle clicked in card:", vehicle);
                    onViewVehicleDetails(vehicle);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Truck size={16} className="text-green-600" />
                      <span className="font-medium text-green-900">Vehicle</span>
                    </div>
                    <span className="font-bold text-green-900 text-lg">
                      {vehicle?.plate_number || vehicle?.asset_code || "Vehicle"}
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Click to View
                  </Badge>
                </div>
                {vehicle?.type && (
                  <p className="text-sm text-gray-600 mt-2">
                    {vehicle?.type} • {vehicle?.model || ""}
                  </p>
                )}
              </div>
              
              <div 
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  if (onViewResponderProfile && responder) {
                    console.log("Responder clicked in card:", responder);
                    onViewResponderProfile(responder);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-blue-600" />
                      <span className="font-medium text-blue-900">Responder</span>
                    </div>
                    <span className="font-bold text-blue-900 text-lg truncate">
                      {responder?.full_name || "Responder"}
                    </span>
                  </div>
                  <Badge variant="info" className="text-xs">
                    View Profile
                  </Badge>
                </div>
                {responder?.responder_code && (
                  <p className="text-sm text-gray-600 mt-2">
                    {responder?.responder_code}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          {canConfirm && (
            <Button
              onClick={onConfirm}
              variant="primary"
              size="sm"
              icon={Check}
              className="flex-1"
            >
              Confirm Allocation
            </Button>
          )}
          
          {canAssign && !hasLogisticsAssigned && (
            <Button
              onClick={onAssign}
              variant="secondary"
              size="sm"
              icon={Truck}
              className="flex-1"
            >
              Assign Logistics
            </Button>
          )}
          
          {hasLogisticsAssigned && (
            <Button
              onClick={onViewSummary}
              variant="success"
              size="sm"
              icon={hasAssignmentDetails ? FileText : Loader2}
              className="flex-1"
            >
              {hasAssignmentDetails ? "View Assignment Summary" : "Loading Summary..."}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Status Badge Component
const StatusBadge = ({ status, className = "" }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "planned":
        return {
          bg: "bg-gradient-to-r from-amber-100 to-yellow-100",
          text: "text-amber-800",
          border: "border-amber-300",
          icon: Clock
        };
      case "confirmed":
        return {
          bg: "bg-gradient-to-r from-blue-100 to-cyan-100",
          text: "text-blue-800",
          border: "border-blue-300",
          icon: Check
        };
      case "logistics_assigned":
        return {
          bg: "bg-gradient-to-r from-green-100 to-emerald-100",
          text: "text-green-800",
          border: "border-green-300",
          icon: Truck
        };
      case "in_transit":
        return {
          bg: "bg-gradient-to-r from-purple-100 to-violet-100",
          text: "text-purple-800",
          border: "border-purple-300",
          icon: Navigation
        };
      case "delivered":
        return {
          bg: "bg-gradient-to-r from-emerald-100 to-teal-100",
          text: "text-emerald-800",
          border: "border-emerald-300",
          icon: PackageCheck
        };
      case "verified":
        return {
          bg: "bg-gradient-to-r from-teal-100 to-cyan-100",
          text: "text-teal-800",
          border: "border-teal-300",
          icon: ShieldCheck
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-100 to-gray-200",
          text: "text-gray-800",
          border: "border-gray-300",
          icon: Package
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const displayStatus = status?.replace(/_/g, ' ')?.toUpperCase() || "UNKNOWN";

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold ${config.bg} ${config.text} ${config.border} ${className}`}>
      <Icon size={16} />
      <span>{displayStatus}</span>
    </div>
  );
};

// Incoming Requests Panel 
function IncomingRequestsPanel({ setActiveTab, updateCount }) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const response = await allocationService.getPendingRequests();
      const requestsArray = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setRequests(requestsArray);
      
      // Update live count for tab
      if (updateCount) {
        updateCount(requestsArray.length);
      }
      
      if (requestsArray.length > 0) setSelected(requestsArray[0]);
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // Set up polling for live updates every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRequests = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const values = [
        r?.resource_name ?? "",
        r?.handling_class ?? "", 
        r?.urgency_level ?? "",
        r?.status ?? "",
      ].map((v) => String(v).toLowerCase());
      return values.some((v) => v.includes(q));
    });
  }, [filter, requests]);

  const handleRefreshQueue = () => {
    fetchPending();
  };

  return (
    <div className="space-y-8">
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-green-900 bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
            Incoming Requests
          </h2>
          <p className="text-gray-700 mt-1 text-lg">
            {requests.length} pending request{requests.length !== 1 ? 's' : ''} • Live updates every 30s
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search requests by resource, hospital, or urgency..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshQueue}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Improved Layout: Better balanced columns */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Request Queue - Better proportion (2/5) */}
        <div className="xl:col-span-2">
          <Card hover elevated className="h-[700px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-900">
                  Request Queue
                </h3>
                <Badge variant="secondary" pulse={filteredRequests.length > 0}>
                  {filteredRequests.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelected(req)}
                      className={`p-4 cursor-pointer transition-all duration-300 rounded-xl border ${selected?.id === req.id 
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-lg scale-[1.02]" 
                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-green-900 text-base mb-1">
                            {req.resource_name || "Unnamed Resource"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Hospital ID: {req.hospital_id || "N/A"}
                          </p>
                        </div>
                        <Badge variant={
                          req.urgency_level === "Critical" ? "danger" :
                          req.urgency_level === "High" ? "warning" : "success"
                        } className="text-xs whitespace-nowrap">
                          {req.urgency_level || "Medium"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span className="font-medium">Qty: {req.quantity || 0}</span>
                        <span>{REQUEST_STATUS_UI_LABELS[req.status] || "Pending"}</span>
                      </div>

                      {req.handling_class && (
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {req.handling_class}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Request Details - Better proportion (3/5) */}
        <div className="xl:col-span-3">
          <Card hover elevated className="h-[700px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-green-900">
                  Request Details
                </h3>
                {selected && (
                  <Badge variant="default">
                    ID: {selected.id}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {selected ? (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-2xl p-8 border border-green-300 shadow-inner">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-green-900 mb-3">
                          {selected.resource_name}
                        </h2>
                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge variant="default" className="text-base px-4 py-2">
                            Request #{selected.id}
                          </Badge>
                          <Badge variant={
                            selected.urgency_level === "Critical" ? "danger" :
                            selected.urgency_level === "High" ? "warning" : "success"
                          } className="text-base px-4 py-2 animate-pulse">
                            {selected.urgency_level}
                          </Badge>
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            {REQUEST_STATUS_UI_LABELS[selected.status] || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Hospital Information */}
                      <Card hover>
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
                          <h4 className="font-semibold text-green-900 flex items-center gap-3 text-lg">
                            <Building2 size={24} className="text-green-700" />
                            Hospital Information
                          </h4>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-gray-700 font-medium">Hospital ID:</span>
                              <span className="font-semibold text-green-900">{selected.hospital_id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-700 font-medium">Request Status:</span>
                              <Badge variant="secondary">
                                {REQUEST_STATUS_UI_LABELS[selected.status] || "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resource Details */}
                      <Card hover>
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
                          <h4 className="font-semibold text-green-900 flex items-center gap-3 text-lg">
                            <Package size={24} className="text-green-700" />
                            Resource Details
                          </h4>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-gray-700 font-medium">Quantity Requested:</span>
                              <span className="font-semibold text-green-900 text-xl">{selected.quantity || 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-gray-700 font-medium">Handling Class:</span>
                              <span className="font-semibold text-green-900">{selected.handling_class || "General"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-700 font-medium">Urgency Level:</span>
                              <span className="font-semibold text-green-900">{selected.urgency_level || "Medium"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      {/* Status Information */}
                      <Card hover>
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300">
                          <h4 className="font-semibold text-green-900 flex items-center gap-3 text-lg">
                            <Clock size={24} className="text-green-700" />
                            Status Overview
                          </h4>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-green-50 rounded-xl border border-green-300">
                              <span className="text-gray-700">Current Priority</span>
                              <Badge variant={
                                selected.urgency_level === "Critical" ? "danger" :
                                selected.urgency_level === "High" ? "warning" : "success"
                              }>
                                {selected.urgency_level}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-green-50 rounded-xl border border-green-300">
                              <span className="text-gray-700">Allocation Status</span>
                              <Badge variant="default">
                                {REQUEST_STATUS_UI_LABELS[selected.status] || "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Action Panel */}
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-inner">
                        <CardContent>
                          <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                            This request has been submitted and is now visible to DOH Dispatchers.
                            They will coordinate the allocation from available hospitals using the 
                            <strong className="text-green-800"> Coordination Panel</strong>.
                          </p>
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                              <p className="text-amber-900 font-semibold">
                                Status: Waiting for DOH Dispatcher Action
                              </p>
                              <p className="text-sm text-amber-800 mt-1">
                                A dispatcher is reviewing all urgent requests and will allocate resources shortly.
                              </p>
                            </div>

                            <Button
                              onClick={() => setActiveTab("coordination")}
                              variant="primary"
                              size="lg"
                              className="w-full py-5 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                              Open Coordination Panel → Create Allocation
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <Info size={64} className="mb-4 text-green-600 opacity-60" />
                  <p className="text-xl font-semibold text-green-900 mb-2">Select a Request</p>
                  <p className="text-center text-gray-600 max-w-md">
                    Choose a request from the queue to view detailed information and take allocation actions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Session Allocations Panel
function EnhancedSessionAllocationsPanel({ showToast, updateCount }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [assignmentDetailsMap, setAssignmentDetailsMap] = useState({});
  
  // MODAL STATES - FIXED
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showResponderModal, setShowResponderModal] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState(null);
  
  // Live counts
  const [counts, setCounts] = useState({
    logistics_assigned: 0,
    confirmed: 0,
    planned: 0,
    other: 0,
    total: 0
  });

  // Debug logging for modal states
  useEffect(() => {
    console.log("Vehicle Modal State:", { showVehicleModal, selectedVehicle });
  }, [showVehicleModal, selectedVehicle]);

  useEffect(() => {
    console.log("Responder Modal State:", { showResponderModal, selectedResponder });
  }, [showResponderModal, selectedResponder]);

  const fetchMyAllocations = async () => {
    try {
      setLoading(true);
      const response = await allocationService.getMyAllocations();
      const allocationsData = response.data || [];
      setAllocations(allocationsData);
      
      // Calculate live counts
      const newCounts = {
        logistics_assigned: allocationsData.filter(a => a.status === "logistics_assigned").length,
        confirmed: allocationsData.filter(a => a.status === "confirmed").length,
        planned: allocationsData.filter(a => a.status === "planned").length,
        other: allocationsData.filter(a => !["logistics_assigned", "confirmed", "planned"].includes(a.status)).length,
        total: allocationsData.length
      };
      setCounts(newCounts);
      
      // Update parent tab count
      if (updateCount) {
        updateCount(allocationsData.length);
      }
      
      // Pre-fetch details for allocations with logistics assigned
      allocationsData.forEach(async (alloc) => {
        if (["logistics_assigned", "in_transit", "delivered"].includes(alloc.status) && !assignmentDetailsMap[alloc.id]) {
          try {
            const details = await allocationService.getAllocationDetails(alloc.id);
            setAssignmentDetailsMap(prev => ({
              ...prev,
              [alloc.id]: details.data
            }));
          } catch (err) {
            console.error(`Failed to fetch details for allocation ${alloc.id}:`, err);
          }
        }
      });
    } catch (err) {
      console.error("Failed to load allocations:", err);
      showToast?.("Could not load your allocations — please refresh", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAllocations();
    // Live updates every 5 minutes
    const interval = setInterval(fetchMyAllocations, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (id) => {
    try {
      await allocationService.confirmAllocation(id);
      showToast?.("Allocation confirmed successfully!", "success");
      fetchMyAllocations();
    } catch (err) {
      console.error("Failed to confirm:", err);
      showToast?.("Failed to confirm allocation", "error");
    }
  };

  const handleAssignLogistics = (allocation) => {
    console.log("Assign logistics clicked for:", allocation);
    setSelectedAllocation(allocation);
    setShowLogisticsModal(true);
  };

  // FIXED: Proper click handlers for modals
  const handleViewVehicleDetails = (vehicle) => {
    console.log("handleViewVehicleDetails called with:", vehicle);
    if (!vehicle) {
      console.error("No vehicle provided to handleViewVehicleDetails");
      showToast?.("No vehicle data available", "error");
      return;
    }
    setSelectedVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const handleViewResponderProfile = (responder) => {
    console.log("handleViewResponderProfile called with:", responder);
    if (!responder) {
      console.error("No responder provided to handleViewResponderProfile");
      showToast?.("No responder data available", "error");
      return;
    }
    setSelectedResponder(responder);
    setShowResponderModal(true);
  };

  const loadAssignmentDetails = async (allocationId, silent = false) => {
    if (!silent) {
      setLoadingAssignment(true);
    }
    
    try {
      // Check if we already have details cached
      if (assignmentDetailsMap[allocationId]) {
        setAssignmentDetails(assignmentDetailsMap[allocationId]);
        return assignmentDetailsMap[allocationId];
      }
      
      // Use the new endpoint with responder.user relationship
      const response = await allocationService.getAllocationDetails(allocationId);
      const details = response.data;
      
      // Cache the details
      setAssignmentDetailsMap(prev => ({
        ...prev,
        [allocationId]: details
      }));
      
      setAssignmentDetails(details);
      return details;
    } catch (err) {
      console.error("Failed to load assignment details:", err);
      if (!silent) {
        showToast?.("Could not load assignment details. Please try again.", "info");
      }
      return null;
    } finally {
      if (!silent) {
        setLoadingAssignment(false);
      }
    }
  };

  const handleViewSummary = async (allocation) => {
    console.log("View summary clicked for:", allocation);
    setSelectedAllocation(allocation);
    
    // Try to load details if not already cached
    const details = await loadAssignmentDetails(allocation.id, true);
    
    if (details) {
      setAssignmentDetails(details);
      setShowSummaryModal(true);
    } else {
      // If details not available, still open modal but show loading state
      setAssignmentDetails(null);
      setShowSummaryModal(true);
      // Try to load in background
      loadAssignmentDetails(allocation.id);
    }
  };

  const handleLogisticsSuccess = async (allocationId) => {
    setShowLogisticsModal(false);
    showToast?.("✅ Logistics assigned successfully!", "success");
    
    // Fetch the assignment details
    const details = await loadAssignmentDetails(allocationId);
    
    // Find the allocation
    const allocation = allocations.find(a => a.id === allocationId);
    if (allocation) {
      setSelectedAllocation(allocation);
      setAssignmentDetails(details);
      
      // Auto-open the summary modal
      setShowSummaryModal(true);
    }
    
    // Refresh allocations list
    fetchMyAllocations();
  };

  // Group allocations by status for better organization
  const groupedAllocations = useMemo(() => {
    const groups = {
      logistics_assigned: [],
      confirmed: [],
      planned: [],
      other: []
    };
    
    allocations.forEach(allocation => {
      if (allocation.status === "logistics_assigned") {
        groups.logistics_assigned.push(allocation);
      } else if (allocation.status === "confirmed") {
        groups.confirmed.push(allocation);
      } else if (allocation.status === "planned") {
        groups.planned.push(allocation);
      } else {
        groups.other.push(allocation);
      }
    });
    
    return groups;
  }, [allocations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-green-600 mb-4" />
        <span className="text-lg text-gray-700 font-medium">Loading your allocations...</span>
        <p className="text-gray-500 mt-2">Fetching data from DOH Central Database</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-green-300/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8 border-b border-green-300/50">
          <div>
            <h2 className="text-2xl font-bold text-green-900 bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
              My Allocations
            </h2>
            <p className="text-gray-700 mt-1 text-lg">
              Live from DOH Central Database • {counts.total} total allocation{counts.total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchMyAllocations} size="md" variant="outline" icon={RefreshCw}>
              Refresh Data
            </Button>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {counts.total} allocation{counts.total !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Allocations List */}
      <div className="space-y-8">
        {/* Logistics Assigned Section */}
        {groupedAllocations.logistics_assigned.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-green-900">Ready for Dispatch</h3>
              <Badge variant="success" className="ml-2 animate-pulse">
                {groupedAllocations.logistics_assigned.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupedAllocations.logistics_assigned.map((alloc) => {
                const details = assignmentDetailsMap[alloc.id];
                const vehicle = details?.allocationVehicles?.[0]?.asset;
                const responder = details?.allocationVehicles?.[0]?.responder;
                
                return (
                  <EnhancedAllocationCard
                    key={alloc.id}
                    allocation={{
                      ...alloc,
                      ...(details || {})
                    }}
                    onConfirm={() => handleConfirm(alloc.id)}
                    onAssign={() => handleAssignLogistics(alloc)}
                    onViewSummary={() => handleViewSummary(alloc)}
                    onViewVehicleDetails={(vehicleData) => {
                      console.log("Vehicle clicked in card - data:", vehicleData || vehicle);
                      handleViewVehicleDetails(vehicleData || vehicle);
                    }}
                    onViewResponderProfile={(responderData) => {
                      console.log("Responder clicked in card - data:", responderData || responder);
                      handleViewResponderProfile(responderData || responder);
                    }}
                    assignmentDetails={details}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmed Section */}
        {groupedAllocations.confirmed.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-blue-900">Awaiting Logistics</h3>
              <Badge variant="info" className="ml-2">
                {groupedAllocations.confirmed.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupedAllocations.confirmed.map((alloc) => {
                const details = assignmentDetailsMap[alloc.id];
                const vehicle = details?.allocationVehicles?.[0]?.asset;
                const responder = details?.allocationVehicles?.[0]?.responder;
                
                return (
                  <EnhancedAllocationCard
                    key={alloc.id}
                    allocation={alloc}
                    onConfirm={() => handleConfirm(alloc.id)}
                    onAssign={() => handleAssignLogistics(alloc)}
                    onViewSummary={() => handleViewSummary(alloc)}
                    onViewVehicleDetails={(vehicleData) => handleViewVehicleDetails(vehicleData || vehicle)}
                    onViewResponderProfile={(responderData) => handleViewResponderProfile(responderData || responder)}
                    assignmentDetails={details}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Planned Section */}
        {groupedAllocations.planned.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-600 to-yellow-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-amber-900">Needs Confirmation</h3>
              <Badge variant="warning" className="ml-2">
                {groupedAllocations.planned.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupedAllocations.planned.map((alloc) => {
                const details = assignmentDetailsMap[alloc.id];
                const vehicle = details?.allocationVehicles?.[0]?.asset;
                const responder = details?.allocationVehicles?.[0]?.responder;
                
                return (
                  <EnhancedAllocationCard
                    key={alloc.id}
                    allocation={alloc}
                    onConfirm={() => handleConfirm(alloc.id)}
                    onAssign={() => handleAssignLogistics(alloc)}
                    onViewSummary={() => handleViewSummary(alloc)}
                    onViewVehicleDetails={(vehicleData) => handleViewVehicleDetails(vehicleData || vehicle)}
                    onViewResponderProfile={(responderData) => handleViewResponderProfile(responderData || responder)}
                    assignmentDetails={details}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Other Statuses */}
        {groupedAllocations.other.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Other Allocations</h3>
              <Badge variant="secondary" className="ml-2">
                {groupedAllocations.other.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupedAllocations.other.map((alloc) => {
                const details = assignmentDetailsMap[alloc.id];
                const vehicle = details?.allocationVehicles?.[0]?.asset;
                const responder = details?.allocationVehicles?.[0]?.responder;
                
                return (
                  <EnhancedAllocationCard
                    key={alloc.id}
                    allocation={alloc}
                    onConfirm={() => handleConfirm(alloc.id)}
                    onAssign={() => handleAssignLogistics(alloc)}
                    onViewSummary={() => handleViewSummary(alloc)}
                    onViewVehicleDetails={(vehicleData) => handleViewVehicleDetails(vehicleData || vehicle)}
                    onViewResponderProfile={(responderData) => handleViewResponderProfile(responderData || responder)}
                    assignmentDetails={details}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allocations.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-300">
            <CardContent className="py-20 text-center">
              <PackageOpen size={80} className="mx-auto mb-6 text-green-600 opacity-50" />
              <h3 className="text-2xl font-bold text-green-900 mb-4">No Active Allocations</h3>
              <p className="text-lg text-gray-700 mb-6 max-w-md mx-auto">
                Create allocations in <strong className="text-green-800">Coordination Panel</strong> to see them here
              </p>
              <Button 
                variant="outline" 
                size="lg"
                icon={ArrowRightLeft}
                onClick={() => window.location.hash = "#coordination"}
              >
                Go to Coordination Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Logistics Assignment Modal */}
      {selectedAllocation && (
        <Modal
          isOpen={showLogisticsModal}
          onClose={() => setShowLogisticsModal(false)}
          title="Logistics Assignment"
          size="full"
        >
          <LogisticsAssignment 
            allocation={selectedAllocation}
            onSuccess={() => handleLogisticsSuccess(selectedAllocation.id)}
          />
        </Modal>
      )}

      {/* Assignment Summary Modal */}
      {selectedAllocation && (
        <AssignmentSummaryModal
          isOpen={showSummaryModal}
          onClose={() => {
            console.log("Closing summary modal");
            setShowSummaryModal(false);
            setAssignmentDetails(null);
          }}
          allocation={selectedAllocation}
          assignmentDetails={assignmentDetails}
          loading={loadingAssignment && !assignmentDetails}
          onViewVehicleDetails={handleViewVehicleDetails}
          onViewResponderProfile={handleViewResponderProfile}
        />
      )}

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleModal}
        onClose={() => {
          console.log("Closing vehicle modal");
          setShowVehicleModal(false);
          setSelectedVehicle(null);
        }}
      />

      {/* Responder View Modal */}
      <ResponderViewModal
        responder={selectedResponder}
        isOpen={showResponderModal}
        onClose={() => {
          console.log("Closing responder modal");
          setShowResponderModal(false);
          setSelectedResponder(null);
        }}
      />
    </div>
  );
}

// Main Allocation Component
export function Allocation() {
  const [activeTab, setActiveTab] = useState("incoming");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Live tab counts state
  const [tabCounts, setTabCounts] = useState({
    incoming: 0,
    allocations: 0,
    coordination: 0,
    tracking: 0
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Function to update tab counts
  const updateTabCounts = (type, count) => {
    setTabCounts(prev => ({
      ...prev,
      [type]: count
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-emerald-50/20 to-green-50/30">
      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl m-6 border border-green-300/50">
        <header className="flex flex-col md:flex-row justify-between items-center md:items-center p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
              <Package className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
                Allocation Management
              </h1>
              <p className="text-gray-700 mt-2 text-lg">Coordinate and manage resource allocations across DOH network</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge variant="info" className="text-base px-4 py-2 animate-pulse">
              <Activity size={16} className="mr-2" />
              Live System • Phase 3 Active
            </Badge>
          </div>
        </header>

        {/* Tab Navigation with LIVE COUNTS */}
        <div className="flex flex-wrap border-t border-green-300/50 px-8">
          <TabButton 
            label="Incoming Requests" 
            isActive={activeTab === "incoming"} 
            onClick={() => setActiveTab("incoming")}
            icon={Package}
            count={tabCounts.incoming}
          />
          <TabButton 
            label="Coordination Panel" 
            isActive={activeTab === "coordination"} 
            onClick={() => setActiveTab("coordination")}
            icon={List}
            count={tabCounts.coordination}
          />
          <TabButton 
            label="My Allocations" 
            isActive={activeTab === "allocations"} 
            onClick={() => setActiveTab("allocations")}
            icon={PackageCheck}
            count={tabCounts.allocations}
          />
          <TabButton 
            label="Live Tracking" 
            isActive={activeTab === "tracking"} 
            onClick={() => setActiveTab("tracking")}
            icon={Navigation}
            variant="secondary"
            count={tabCounts.tracking}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <main>
          {activeTab === "incoming" && (
            <IncomingRequestsPanel
              setActiveTab={setActiveTab}
              updateCount={(count) => updateTabCounts('incoming', count)}
            />
          )}
          {activeTab === "allocations" && (
            <EnhancedSessionAllocationsPanel
              showToast={showToast}
              updateCount={(count) => updateTabCounts('allocations', count)}
            />
          )}
          {activeTab === "coordination" && (
            <Card className="shadow-xl border-2 border-green-300/50">
              <CardContent>
                <CoordinationPanel />
              </CardContent>
            </Card>
          )}
          {activeTab === "tracking" && (
            <Card className="shadow-xl">
              <CardContent className="text-center py-12">
                <Navigation className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">Live Tracking Dashboard</h2>
                <p className="text-gray-600">Coming soon - Real-time tracking of all active allocations</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

// Constants & Helper Functions
const REQUEST_STATUS_UI_LABELS = {
  draft: "Draft",
  pending: "Pending",
  under_review: "Under Review", 
  matched: "Matched",
  allocated: "Allocated",
  in_transit: "In Transit",
  delivered: "Delivered",
  verified: "Verified",
  rejected: "Rejected",
  failed: "Failed",
};

const ALLOCATION_STATUS_UI_LABELS = {
  planned: "Planned",
  confirmed: "Confirmed", 
  logistics_assigned: "Logistics Assigned",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

// Format date helper
function formatDateLabel(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dt);
  }
}

// Format phone helper
function formatPhone(phone) {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
}

// Parse capabilities helper
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
    console.error('Error parsing capabilities:', error);
    return [];
  }
};

// Capability Badge Component
const CapabilityBadge = ({ capability }) => {
  const config = {
    ColdChain: { color: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800", icon: ThermometerSnowflake, label: "Cold Chain" },
    cold_chain: { color: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800", icon: ThermometerSnowflake, label: "Cold Chain" },
    Narcotics: { color: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800", icon: ShieldAlert, label: "Narcotics" },
    narcotics: { color: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800", icon: ShieldAlert, label: "Narcotics" },
    HighValue: { color: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800", icon: ShieldCheck, label: "High Value" },
    high_value: { color: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800", icon: ShieldCheck, label: "High Value" },
    GPS: { color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800", icon: MapPin, label: "GPS" },
    General: { color: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800", icon: Package, label: "General" },
    general: { color: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800", icon: Package, label: "General" },
    Refrigerated: { color: "bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-800", icon: ThermometerSnowflake, label: "Refrigerated" },
    refrigerated: { color: "bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-800", icon: ThermometerSnowflake, label: "Refrigerated" },
    Security: { color: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800", icon: Shield, label: "Security" },
    security: { color: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800", icon: Shield, label: "Security" },
  };

  const cfg = config[capability] || { color: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800", label: capability };
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color} shadow-sm`}>
      {Icon && <Icon size={12} />}
      {cfg.label || capability}
    </span>
  );
};

// Additional Helper Components
const ProgressBar = ({ value, max = 100, color = "green", showLabel = true, className = "" }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colors = {
    green: "bg-gradient-to-r from-green-500 to-emerald-500",
    blue: "bg-gradient-to-r from-blue-500 to-cyan-500",
    amber: "bg-gradient-to-r from-amber-500 to-yellow-500",
    red: "bg-gradient-to-r from-red-500 to-rose-500",
    purple: "bg-gradient-to-r from-purple-500 to-violet-500",
    gray: "bg-gradient-to-r from-gray-400 to-gray-500"
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{value}/{max}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${sizes[size]} animate-spin text-green-600`} />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

const EmptyState = ({ 
  icon: Icon = Package, 
  title = "No Data Available", 
  description = "There's nothing to display here yet.",
  action = null 
}) => (
  <div className="text-center py-12">
    <Icon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
    <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-md mx-auto mb-8">{description}</p>
    {action}
  </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon, badge, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
          <Icon className="text-green-600" size={24} />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-green-900">{title}</h2>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {badge && (
        <div className="ml-4">
          {badge}
        </div>
      )}
    </div>
    {action && (
      <div>
        {action}
      </div>
    )}
  </div>
);

// Utility function for currency formatting
const formatCurrency = (amount, currency = 'PHP') => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Utility function for distance formatting
const formatDistance = (km) => {
  if (!km && km !== 0) return "—";
  return `${Number(km).toFixed(1)} km`;
};

// Utility function for time formatting
const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
};

export default Allocation;