// src/components/logistics/ResourceMngmt/RequestsView.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  List,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Building,
  Package,
  ChevronDown,
  Loader2,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  Download,
  Clipboard,
  BarChart3,
  Truck,
  User,
  MapPin,
  Thermometer,
  Shield,
  DollarSign,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
  Upload,
  Camera,
  FileCheck,
  ShieldCheck,
  MessageSquare,
  Home,
  ClipboardCheck,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import requestService from "../../../services/requestService";

// Import DeliveryConfirmModal for reuse in its own tab
import DeliveryConfirmModal from "./DeliveryConfirmModal";

// Status configuration with enhanced styling following the green theme
const statusConfig = {
  draft: { 
    color: "gray", 
    label: "Draft", 
    icon: FileText, 
    bgColor: "bg-gradient-to-r from-gray-100 to-gray-50", 
    textColor: "text-gray-800", 
    borderColor: "border-gray-300",
    badgeVariant: "secondary"
  },
  pending: { 
    color: "amber", 
    label: "Pending", 
    icon: Clock, 
    bgColor: "bg-gradient-to-r from-amber-100 to-yellow-50", 
    textColor: "text-amber-800", 
    borderColor: "border-amber-300",
    badgeVariant: "warning"
  },
  matched: { 
    color: "blue", 
    label: "Matched", 
    icon: AlertCircle, 
    bgColor: "bg-gradient-to-r from-blue-100 to-blue-50", 
    textColor: "text-blue-800", 
    borderColor: "border-blue-300",
    badgeVariant: "info"
  },
  allocated: { 
    color: "indigo", 
    label: "Allocated", 
    icon: Package, 
    bgColor: "bg-gradient-to-r from-purple-100 to-purple-50", 
    textColor: "text-purple-800", 
    borderColor: "border-purple-300",
    badgeVariant: "purple"
  },
  in_transit: { 
    color: "blue", 
    label: "In Transit", 
    icon: Truck, 
    bgColor: "bg-gradient-to-r from-blue-100 to-blue-50", 
    textColor: "text-blue-800", 
    borderColor: "border-blue-300",
    badgeVariant: "info"
  },
  delivered: { 
    color: "indigo", 
    label: "Delivered", 
    icon: Package, 
    bgColor: "bg-gradient-to-r from-indigo-100 to-indigo-50", 
    textColor: "text-indigo-800", 
    borderColor: "border-indigo-300",
    badgeVariant: "purple"
  },
  verified: { 
    color: "green", 
    label: "Verified", 
    icon: CheckCircle, 
    bgColor: "bg-gradient-to-r from-green-100 to-emerald-50", 
    textColor: "text-green-800", 
    borderColor: "border-green-300",
    badgeVariant: "success"
  },
  rejected: { 
    color: "red", 
    label: "Rejected", 
    icon: XCircle, 
    bgColor: "bg-gradient-to-r from-red-100 to-red-50", 
    textColor: "text-red-800", 
    borderColor: "border-red-300",
    badgeVariant: "destructive"
  },
};

// Reusable UI Components following the theme
const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
  
  const variants = {
    default: "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:from-green-700 hover:to-emerald-700 hover:shadow-lg",
    outline: "border-2 border-green-300 bg-white text-green-800 hover:bg-green-50 hover:border-green-400 hover:shadow-md",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800",
    secondary: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 shadow-sm hover:from-gray-300 hover:to-gray-400",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:from-green-600 hover:to-emerald-600",
    ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm",
    info: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800"
  };
  
  const sizes = {
    default: "h-11 px-6 py-2.5 text-sm rounded-xl",
    sm: "h-9 px-4 py-1.5 text-sm rounded-lg",
    lg: "h-12 px-8 py-3 text-base rounded-xl",
    icon: "h-10 w-10 rounded-full"
  };
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const Badge = ({ children, variant = "secondary", className = "", icon: Icon }) => {
  const variants = {
    secondary: "bg-gray-100 text-gray-700 border-2 border-gray-300",
    destructive: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-2 border-red-300",
    success: "bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 border-2 border-green-300",
    warning: "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border-2 border-amber-300",
    info: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-2 border-blue-300",
    purple: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-2 border-purple-300"
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

const Card = ({ children, className = "", hoverable = true }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-xl border-2 bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-green-300 ${hoverable ? 'hover:border-green-400' : ''} ${className}`}
  >
    {children}
  </motion.div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-xl font-bold leading-none tracking-tight text-green-900 flex items-center gap-2">
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const InfoChip = ({ icon: Icon, label, value, color = "green" }) => {
  const colors = {
    green: "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200",
    blue: "text-blue-700 bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-200",
    amber: "text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200",
    purple: "text-purple-700 bg-gradient-to-r from-purple-50 to-purple-50 border-2 border-purple-200",
    gray: "text-gray-700 bg-gradient-to-r from-gray-50 to-gray-50 border-2 border-gray-200",
    red: "text-red-700 bg-gradient-to-r from-red-50 to-red-50 border-2 border-red-200"
  };
  
  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${colors[color]}`}>
      {Icon && <Icon size={18} className="text-green-600" />}
      <div>
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
};

// Delivery Status Chip Component
const DeliveryStatusChip = ({ status, hasPOD = false }) => {
  const configs = {
    allocated: {
      label: "Vehicle Assigned",
      color: "purple",
      icon: Truck
    },
    in_transit: {
      label: "In Transit",
      color: "info",
      icon: Truck
    },
    delivered: {
      label: "Ready for POD",
      color: "purple",
      icon: Package
    },
    verified: {
      label: "Delivery Verified",
      color: "success",
      icon: CheckCircle
    }
  };

  const config = configs[status] || configs.allocated;
  const Icon = config.icon;

  return (
    <Badge variant={config.color} icon={Icon} className="gap-2">
      {config.label}
      {hasPOD && <FileCheck className="h-3 w-3" />}
    </Badge>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'all',
      label: 'All Requests',
      icon: <List className="w-5 h-5" />,
      color: 'from-green-600 to-emerald-600'
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-amber-600 to-yellow-600'
    },
    {
      id: 'in_transit',
      label: 'In Transit',
      icon: <Truck className="w-5 h-5" />,
      color: 'from-blue-600 to-blue-700'
    },
    {
      id: 'delivery_confirmation',
      label: 'Delivery Confirmation',
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'from-emerald-600 to-green-700'
    }
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-green-300 shadow-md p-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Pending Delivery Confirmation Component
const PendingDeliveryConfirmation = ({ requests, onConfirmDelivery }) => {
  const pendingDeliveries = requests.filter(r => r.status === 'delivered');

  if (pendingDeliveries.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-900">No Pending Deliveries</p>
          <p className="text-gray-600 mt-2">All deliveries have been confirmed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDeliveries.map((delivery, index) => (
        <motion.div
          key={delivery.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Delivery Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-green-900">
                          {delivery.resource_name || "Unnamed Resource"}
                        </h3>
                        <Badge variant="purple" icon={Package} className="px-4 py-1.5">
                          Ready for Confirmation
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>Delivery ID: {delivery.id}</span>
                        <span className="text-gray-400">•</span>
                        <Calendar className="h-4 w-4" />
                        <span>Arrived: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <InfoChip 
                      icon={Package}
                      label="Quantity" 
                      value={`${delivery.quantity} ${delivery.unit || 'units'}`}
                      color="green"
                    />
                    <InfoChip 
                      icon={Truck}
                      label="Vehicle" 
                      value={delivery.allocation?.vehicle_plate || 'DOH-REF-07'}
                      color="blue"
                    />
                    <InfoChip 
                      icon={Building}
                      label="Source Hospital" 
                      value={delivery.allocation?.source_hospital || 'General Hospital B'}
                      color="purple"
                    />
                    <InfoChip 
                      icon={User}
                      label="Driver" 
                      value={delivery.allocation?.driver || 'John Doe'}
                      color="gray"
                    />
                    <InfoChip 
                      icon={MapPin}
                      label="Location" 
                      value={delivery.facility?.name || 'Main Warehouse'}
                      color="amber"
                    />
                    <InfoChip 
                      icon={Clock}
                      label="Arrival Time" 
                      value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      color="blue"
                    />
                  </div>

                  {/* Action Required Alert */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-800">Action Required</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Please confirm delivery by verifying the items and uploading Proof of Delivery (POD) within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="lg:w-64 flex flex-col gap-3">
                  <Button
                    variant="default"
                    onClick={() => onConfirmDelivery(delivery)}
                    className="w-full justify-start gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <Upload className="h-4 w-4" />
                    Start Confirmation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      // Open details
                      const details = await requestService.getById(delivery.id);
                      // You would need to pass this to a details view
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {/* Contact driver */}}
                    className="w-full justify-start gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Driver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const RequestsView = ({ facility, hospitalId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showStatistics, setShowStatistics] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');
  
  // Delivery Confirmation Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryToConfirm, setDeliveryToConfirm] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestService.getMyRequests({
        hospital_id: hospitalId,
        include_drafts: true,
      });
      // Add mock delivery data for demonstration
      const mockRequests = data.data ? data.data.map(req => ({
        ...req,
        allocation: req.allocation || {
          vehicle_plate: 'DOH-REF-07',
          vehicle_type: 'Refrigerated Van',
          driver: 'John Doe',
          source_hospital: 'General Hospital B',
          eta: '30 minutes'
        }
      })) : [];
      
      // Add some delivered requests for demonstration
      if (mockRequests.length === 0) {
        mockRequests.push(
          {
            id: 'DEL-001',
            resource_name: 'IV Fluids',
            quantity: 500,
            status: 'delivered',
            created_at: new Date().toISOString(),
            urgency_level: 'Critical',
            unit: 'units',
            facility: { name: 'Main Warehouse' },
            allocation: {
              vehicle_plate: 'DOH-REF-07',
              vehicle_type: 'Refrigerated Van',
              driver: 'John Doe',
              source_hospital: 'General Hospital B',
              eta: 'Arrived'
            }
          },
          {
            id: 'DEL-002',
            resource_name: 'Surgical Masks',
            quantity: 1000,
            status: 'in_transit',
            created_at: new Date().toISOString(),
            urgency_level: 'High',
            unit: 'pieces',
            facility: { name: 'Main Warehouse' },
            allocation: {
              vehicle_plate: 'DOH-VAN-12',
              vehicle_type: 'Delivery Van',
              driver: 'Jane Smith',
              source_hospital: 'City Medical Center',
              eta: '1.5 hours'
            }
          }
        );
      }
      
      setRequests(mockRequests);
    } catch (err) {
      setError("Failed to load requests. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) fetchRequests();
  }, [hospitalId, fetchRequests]);

  const handleSubmitDraft = async (id) => {
    try {
      await requestService.submitFromDraft(id);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDraft = async (id) => {
    try {
      await requestService.deleteDraft(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDraft = (req) => {
    setEditingRequest(req);
    setShowEditDrawer(true);
  };

  const handleSaveDraft = async () => {
    try {
      await requestService.updateDraft(editingRequest.id, {
        quantity: editingRequest.quantity,
        urgency_level: editingRequest.urgency_level,
        handling_class: editingRequest.handling_class,
        reason: editingRequest.reason,
      });
      fetchRequests();
      setShowEditDrawer(false);
      setEditingRequest(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delivery Confirmation
  const handleConfirmDelivery = (request) => {
    setDeliveryToConfirm({
      id: request.id,
      resource: request.resource_name,
      quantity: request.quantity,
      vehicle: request.allocation?.vehicle_plate || 'Delivery Vehicle',
      source: request.allocation?.source_hospital || 'Source Hospital'
    });
    setShowDeliveryModal(true);
  };

  const handleDeliveryConfirmation = async (confirmationData) => {
    try {
      // API call to confirm delivery
      console.log('Confirming delivery:', confirmationData);
      // Update request status locally
      setRequests(prev => prev.map(req => 
        req.id === deliveryToConfirm.id 
          ? { ...req, status: 'verified' }
          : req
      ));
      setShowDeliveryModal(false);
      setDeliveryToConfirm(null);
    } catch (err) {
      console.error('Error confirming delivery:', err);
    }
  };

  // Filter requests based on active tab
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    // Apply tab filter
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(r => r.status === 'pending' || r.status === 'matched');
        break;
      case 'in_transit':
        filtered = filtered.filter(r => r.status === 'allocated' || r.status === 'in_transit');
        break;
      case 'delivery_confirmation':
        filtered = filtered.filter(r => r.status === 'delivered');
        break;
      case 'completed':
        filtered = filtered.filter(r => r.status === 'verified');
        break;
      default:
        // 'all' tab - apply search and filters
        break;
    }

    // Apply search filter for 'all' tab
    if (activeTab === 'all' && searchTerm) {
      filtered = filtered.filter(request => 
        request.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id?.toString().includes(searchTerm)
      );
    }

    // Apply status and urgency filters for 'all' tab
    if (activeTab === 'all') {
      if (statusFilter !== "all") {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
      if (urgencyFilter !== "all") {
        filtered = filtered.filter(r => r.urgency_level === urgencyFilter);
      }
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'quantity':
          aValue = parseInt(a.quantity) || 0;
          bValue = parseInt(b.quantity) || 0;
          break;
        case 'urgency':
          const urgencyOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aValue = urgencyOrder[a.urgency_level] || 0;
          bValue = urgencyOrder[b.urgency_level] || 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      return sortOrder === 'desc' ? (bValue > aValue ? 1 : -1) : (aValue > bValue ? 1 : -1);
    });

    return filtered;
  }, [requests, activeTab, searchTerm, statusFilter, urgencyFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'destructive';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const getHandlingIcon = (handlingClass) => {
    switch (handlingClass) {
      case 'ColdChain': return Thermometer;
      case 'HighValue': return DollarSign;
      case 'Narcotics': return Shield;
      default: return Package;
    }
  };

  // Statistics calculation
  const statistics = useMemo(() => {
    const total = requests.length;
    const drafts = requests.filter(r => r.status === 'draft').length;
    const pending = requests.filter(r => r.status === 'pending' || r.status === 'matched').length;
    const inTransit = requests.filter(r => r.status === 'allocated' || r.status === 'in_transit').length;
    const delivered = requests.filter(r => r.status === 'delivered').length;
    const verified = requests.filter(r => r.status === 'verified').length;
    
    const critical = requests.filter(r => r.urgency_level === 'Critical').length;
    const high = requests.filter(r => r.urgency_level === 'High').length;
    
    const totalQuantity = requests.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);
    
    return {
      total, drafts, pending, inTransit, delivered, verified,
      critical, high,
      totalQuantity,
      pendingPercentage: total ? ((pending / total) * 100).toFixed(1) : '0',
      criticalPercentage: total ? ((critical / total) * 100).toFixed(1) : '0'
    };
  }, [requests]);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'delivery_confirmation':
        return (
          <PendingDeliveryConfirmation
            requests={requests}
            onConfirmDelivery={handleConfirmDelivery}
          />
        );
      default:
        return renderAllRequests();
    }
  };

  // Render all requests (for 'all' tab)
  const renderAllRequests = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
              <p className="text-lg font-semibold text-green-900">Loading Requests</p>
              <p className="text-gray-600 mt-2">Please wait while we fetch your requests...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
              <List className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-900">No requests found</p>
            <p className="text-gray-600 mt-2">
              {searchTerm || statusFilter !== "all" || urgencyFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Create a request from the Inventory tab"}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRequests.map((req, index) => {
            const status = statusConfig[req.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            const HandlingIcon = getHandlingIcon(req.handling_class);

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Column - Main Info */}
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-green-900">
                                {req.resource_name || "Unnamed Resource"}
                              </h3>
                              <Badge variant={status.badgeVariant} icon={StatusIcon} className="px-4 py-1.5">
                                {status.label}
                              </Badge>
                              {(req.status === 'allocated' || req.status === 'in_transit' || req.status === 'delivered') && (
                                <DeliveryStatusChip status={req.status} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>ID: {req.id}</span>
                              <span className="text-gray-400">•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getUrgencyColor(req.urgency_level)} icon={Zap}>
                              {req.urgency_level}
                            </Badge>
                            {req.handling_class && (
                              <Badge variant="info" icon={HandlingIcon}>
                                {req.handling_class}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <InfoChip 
                            icon={Package}
                            label="Quantity" 
                            value={`${req.quantity} ${req.unit || 'units'}`}
                            color="green"
                          />
                          <InfoChip 
                            icon={MapPin}
                            label="Facility" 
                            value={facility?.name || 'Hospital'}
                            color="blue"
                          />
                          <InfoChip 
                            icon={User}
                            label="Requester" 
                            value={req.created_by?.name || 'Unknown'}
                            color="purple"
                          />
                        </div>

                        {/* Delivery Information */}
                        {(req.status === 'allocated' || req.status === 'in_transit' || req.status === 'delivered') && req.allocation && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-green-800">Delivery Information</span>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-200 rounded-xl p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-gray-600">Vehicle</div>
                                  <div className="font-semibold text-blue-900">
                                    {req.allocation.vehicle_plate} ({req.allocation.vehicle_type})
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-600">Driver</div>
                                  <div className="font-semibold text-blue-900">
                                    {req.allocation.driver || 'Assigned'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {req.reason && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="h-5 w-5 text-amber-600" />
                              <span className="font-semibold text-green-800">Reason for Request</span>
                            </div>
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4">
                              <p className="text-amber-900 leading-relaxed">
                                {req.reason}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Actions */}
                      <div className="lg:w-64 flex flex-col gap-3">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const details = await requestService.getById(req.id);
                            setSelectedRequest(details);
                            setShowDetails(true);
                          }}
                          className="w-full justify-start gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>

                        {req.status === 'draft' && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleEditDraft(req)}
                              className="w-full justify-start gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Draft
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => handleSubmitDraft(req.id)}
                              className="w-full justify-start gap-2"
                            >
                              <Send className="h-4 w-4" />
                              Submit Request
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteDraft(req.id)}
                              className="w-full justify-start gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Draft
                            </Button>
                          </>
                        )}
                        
                        {req.status === 'pending' && (
                          <Button
                            variant="outline"
                            onClick={() => {}}
                            className="w-full justify-start gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Check Status
                          </Button>
                        )}
                        
                        {req.status === 'delivered' && (
                          <Button
                            variant="success"
                            onClick={() => handleConfirmDelivery(req)}
                            className="w-full justify-start gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Confirm Delivery
                          </Button>
                        )}
                        
                        {(req.status === 'allocated' || req.status === 'in_transit') && (
                          <Button
                            variant="info"
                            onClick={() => {}}
                            className="w-full justify-start gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            Track Delivery
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FBF8] to-[#F0F7F0] p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
            My Supply Requests
          </h1>
          <p className="text-gray-700 mt-2">Manage and track your resource requests for {facility?.name || 'your facility'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setShowStatistics(!showStatistics)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showStatistics ? "Hide Stats" : "Show Stats"}
          </Button>
          <Button
            variant="outline"
            onClick={fetchRequests}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      {showStatistics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="text-green-600" />
                Request Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <InfoChip 
                  icon={FileText} 
                  label="Drafts" 
                  value={statistics.drafts}
                  color="gray"
                />
                <InfoChip 
                  icon={Clock} 
                  label="Pending" 
                  value={statistics.pending}
                  color="amber"
                />
                <InfoChip 
                  icon={Truck} 
                  label="In Transit" 
                  value={statistics.inTransit}
                  color="blue"
                />
                <InfoChip 
                  icon={Package} 
                  label="Delivered" 
                  value={statistics.delivered}
                  color="indigo"
                />
                <InfoChip 
                  icon={Upload} 
                  label="Awaiting POD" 
                  value={statistics.delivered}
                  color="purple"
                />
                <InfoChip 
                  icon={CheckCircle} 
                  label="Verified" 
                  value={statistics.verified}
                  color="green"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Search and Filters (Only for 'all' tab) */}
      {activeTab === 'all' && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by resource, reason, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="matched">Matched</option>
                  <option value="allocated">Allocated</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="verified">Verified</option>
                </select>
                
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[140px]"
                >
                  <option value="all">All Urgency</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-green-200">
              <div className="text-sm text-gray-600">
                Showing {filteredRequests.length} of {requests.length} requests
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Sort by:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('created_at')}
                  className={`gap-1 ${sortBy === 'created_at' ? 'bg-green-50 text-green-800' : ''}`}
                >
                  <Calendar className="h-4 w-4" />
                  Date
                  <ArrowUpDown className={`h-3 w-3 ${sortBy === 'created_at' ? 'text-green-600' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('urgency')}
                  className={`gap-1 ${sortBy === 'urgency' ? 'bg-green-50 text-green-800' : ''}`}
                >
                  <AlertCircle className="h-4 w-4" />
                  Urgency
                  <ArrowUpDown className={`h-3 w-3 ${sortBy === 'urgency' ? 'text-green-600' : 'text-gray-400'}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      {renderTabContent()}

      {/* Delivery Confirmation Modal */}
      {showDeliveryModal && deliveryToConfirm && (
        <DeliveryConfirmModal
          delivery={deliveryToConfirm}
          onConfirm={handleDeliveryConfirmation}
          onClose={() => {
            setShowDeliveryModal(false);
            setDeliveryToConfirm(null);
          }}
        />
      )}
    </div>
  );
};

export default RequestsView;