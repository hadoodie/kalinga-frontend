// CoordinationPanel.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  X,
  Loader2,
  CheckCircle,
  Plus,
  Eye,
  Bell,
  ListChecks,
  ShieldAlert,
  Building2,
  Search,
  Filter,
  Table,
  LayoutGrid,
  CheckSquare,
  Square,
  ChevronDown,
  MoreVertical,
  BarChart3,
  Download,
  Clipboard,
  AlertCircle,
  Check,
  Clock,
  Truck,
  User,
  MapPin,
  Thermometer,
  Shield,
  DollarSign,
  Zap,
  TrendingUp,
  Package,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import allocationService from "@/services/allocationService";
import MatchSuggestions from "./MatchSuggestions";

// ==================== TOAST NOTIFICATION SYSTEM ====================
const ToastContext = React.createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    if (!toast.persist) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              className={`flex items-center justify-between p-4 rounded-lg shadow-lg border ${
                toast.variant === "destructive"
                  ? "bg-red-50 border-red-300 text-red-800"
                  : toast.variant === "warning"
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : toast.variant === "info"
                      ? "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-green-50 border-green-300 text-green-800"
              } min-w-[300px] max-w-[400px]`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-1 ${
                    toast.variant === "destructive"
                      ? "bg-red-100"
                      : toast.variant === "warning"
                        ? "bg-amber-100"
                        : toast.variant === "info"
                          ? "bg-blue-100"
                          : "bg-green-100"
                  }`}
                >
                  {toast.variant === "destructive" ? (
                    <AlertCircle size={16} className="text-red-600" />
                  ) : toast.variant === "warning" ? (
                    <AlertCircle size={16} className="text-amber-600" />
                  ) : toast.variant === "info" ? (
                    <Bell size={16} className="text-blue-600" />
                  ) : (
                    <Check size={16} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{toast.title}</h4>
                  {toast.description && (
                    <p className="text-sm opacity-90 mt-1">
                      {toast.description}
                    </p>
                  )}
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action.onClick();
                        removeToast(toast.id);
                      }}
                      className="text-sm font-medium underline mt-2"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

// ==================== UI COMPONENTS ====================
const Button = ({
  children,
  onClick,
  disabled,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

  const variants = {
    default:
      "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:from-green-700 hover:to-emerald-700 hover:shadow-lg",
    outline:
      "border-2 border-green-300 bg-white text-green-800 hover:bg-green-50 hover:border-green-400",
    destructive:
      "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800",
    secondary:
      "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 shadow-sm hover:from-gray-300 hover:to-gray-400",
    success:
      "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:from-green-600 hover:to-emerald-600",
    ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  };

  const sizes = {
    default: "h-10 px-6 py-2 text-sm",
    sm: "h-9 px-4 py-1.5 text-sm rounded-md",
    lg: "h-12 px-8 py-3 text-base rounded-xl",
    icon: "h-10 w-10 rounded-full",
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

const Badge = ({
  children,
  variant = "secondary",
  className = "",
  icon: Icon,
}) => {
  const variants = {
    secondary: "bg-gray-100 text-gray-700 border border-gray-300",
    destructive:
      "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-300",
    success:
      "bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 border border-green-300",
    warning:
      "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border border-amber-300",
    info: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-300",
    purple:
      "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

const Card = ({ children, className = "", hoverable = true }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-xl border-2 bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-green-300 ${hoverable ? "hover:border-green-400" : ""} ${className}`}
  >
    {children}
  </motion.div>
);

const CardHeader = ({ children, className = "" }) => (
  <div
    className={`flex flex-col space-y-1.5 p-6 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl ${className}`}
  >
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-xl font-bold leading-none tracking-tight text-green-900 flex items-center gap-2">
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const InfoChip = ({ icon: Icon, label, value, color = "green" }) => {
  const colors = {
    green: "text-green-700 bg-green-50 border-green-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    purple: "text-purple-700 bg-purple-50 border-purple-200",
    gray: "text-gray-700 bg-gray-50 border-gray-200",
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 ${colors[color]}`}
    >
      {Icon && <Icon size={16} />}
      <div>
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  showClose = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto border-2 border-green-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b-2 border-green-300 flex justify-between items-center sticky top-0 bg-white z-10 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            {title}
          </h2>
          {showClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-green-100"
            >
              <X size={20} className="text-gray-600" />
            </Button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// ==================== STATISTICS COMPONENT ====================
const StatisticsDashboard = ({ requests }) => {
  const stats = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter(
      (r) => r.urgency_level === "Critical",
    ).length;
    const high = requests.filter((r) => r.urgency_level === "High").length;
    const medium = requests.filter((r) => r.urgency_level === "Medium").length;
    const low = requests.filter((r) => r.urgency_level === "Low").length;

    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;

    const uniqueHospitals = new Set(requests.map((r) => r.hospital_id)).size;
    const uniqueResources = new Set(requests.map((r) => r.resource_name)).size;

    const totalQuantity = requests.reduce(
      (sum, r) => sum + (parseInt(r.quantity) || 0),
      0,
    );

    return {
      total,
      critical,
      high,
      medium,
      low,
      pending,
      approved,
      uniqueHospitals,
      uniqueResources,
      totalQuantity,
      criticalPercentage: total ? ((critical / total) * 100).toFixed(1) : "0",
      pendingPercentage: total ? ((pending / total) * 100).toFixed(1) : "0",
    };
  }, [requests]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            <TrendingUp className="text-green-600" />
            Dashboard Statistics
          </CardTitle>
          <Badge variant="success" icon={Package}>
            {stats.total} Total Requests
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoChip
            icon={AlertCircle}
            label="Critical"
            value={`${stats.critical} (${stats.criticalPercentage}%)`}
            color="destructive"
          />
          <InfoChip
            icon={Zap}
            label="High Urgency"
            value={stats.high}
            color="warning"
          />
          <InfoChip
            icon={Clock}
            label="Pending"
            value={`${stats.pending} (${stats.pendingPercentage}%)`}
            color="amber"
          />
          <InfoChip
            icon={Building2}
            label="Hospitals"
            value={stats.uniqueHospitals}
            color="blue"
          />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Urgency Distribution</span>
              <span className="font-semibold">{stats.total} requests</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(stats.critical / stats.total) * 100}%`,
                  }}
                  className="bg-red-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.high / stats.total) * 100}%` }}
                  className="bg-amber-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.medium / stats.total) * 100}%` }}
                  className="bg-blue-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.low / stats.total) * 100}%` }}
                  className="bg-green-500"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Critical: {stats.critical}</span>
              <span>High: {stats.high}</span>
              <span>Medium: {stats.medium}</span>
              <span>Low: {stats.low}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-800">
                Total Quantity Requested
              </span>
              <span className="text-xl font-bold text-green-900">
                {stats.totalQuantity.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Across {stats.uniqueResources} different resource types
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== DROPDOWN MENU ====================
const DropdownMenu = ({ trigger, items, align = "end", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-menu")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
  };

  return (
    <div className={`relative dropdown-menu ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute top-full mt-2 ${alignmentClasses[align]} z-50 w-64 bg-white rounded-xl shadow-lg border-2 border-green-300 py-1`}
          >
            {items.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  item.variant === "destructive"
                    ? "text-red-700 hover:bg-red-50"
                    : item.variant === "default"
                      ? "text-green-700 hover:bg-green-50 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                } ${item.highlight ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500" : ""}`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span className="text-left flex-1">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== LOADING SKELETON ====================
const LoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
      </div>
    ))}
  </div>
);

// ==================== CONFIRMATION DIALOG ====================
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-4">
        <div
          className={`p-4 rounded-xl border-2 ${
            variant === "destructive"
              ? "bg-red-50 border-red-300"
              : "bg-green-50 border-green-300"
          }`}
        >
          <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================
const CoordinationPanel = () => {
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRequest, setViewRequest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedRequestForMatch, setSelectedRequestForMatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatistics, setShowStatistics] = useState(true);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { addToast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPending = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const response = await allocationService.getPendingRequests();
        const data = response.data?.data || response.data || [];
        setRequests(data);

        addToast({
          title: "Data refreshed",
          description: `Loaded ${data.length} pending requests`,
          variant: "success",
        });
      } catch (err) {
        addToast({
          title: "Failed to load requests",
          description: "Please check your connection and try again",
          variant: "destructive",
          action: {
            label: "Retry",
            onClick: () => fetchPending(),
          },
        });
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Filter requests
  useEffect(() => {
    let result = requests;

    if (debouncedSearchTerm) {
      result = result.filter(
        (req) =>
          req.resource_name
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          req.hospital?.name
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          req.hospital_id?.toString().includes(debouncedSearchTerm),
      );
    }

    if (urgencyFilter !== "all") {
      result = result.filter((req) => req.urgency_level === urgencyFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(result);
  }, [requests, debouncedSearchTerm, urgencyFilter, statusFilter]);

  const toggleSelection = useCallback((id) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map((req) => req.id));
    }
  }, [filteredRequests, selectedRequests.length]);

  const handleBulkCreate = async () => {
    if (selectedRequests.length === 0) return;

    setBulkProgress({
      total: selectedRequests.length,
      completed: 0,
      current: null,
    });

    const success = [];
    const failed = [];

    for (const requestId of selectedRequests) {
      const request = requests.find((r) => r.id === requestId);
      setBulkProgress((prev) => ({
        ...prev,
        current: request?.resource_name,
      }));

      try {
        // Simulate API call - replace with actual bulkCreate
        await new Promise((resolve) => setTimeout(resolve, 500));
        success.push(requestId);

        addToast({
          title: "Allocation created",
          description: `${request?.resource_name} - ${request?.hospital?.name}`,
          variant: "success",
        });
      } catch (err) {
        failed.push(requestId);

        addToast({
          title: "Allocation failed",
          description: `${request?.resource_name} - ${request?.hospital?.name}`,
          variant: "destructive",
        });
      }

      setBulkProgress((prev) => ({
        ...prev,
        completed: prev.completed + 1,
      }));
    }

    setBulkProgress(null);
    setSelectedRequests([]);
    setShowCheckboxes(false);
    fetchPending(false);

    addToast({
      title: "Bulk operation completed",
      description: `${success.length} succeeded, ${failed.length} failed`,
      variant:
        success.length === selectedRequests.length ? "success" : "warning",
      persist: true,
    });
  };

  const handleAction = useCallback((action, request) => {
    switch (action) {
      case "view":
        setViewRequest(request);
        break;
      case "match":
        setSelectedRequestForMatch(request);
        setShowMatchModal(true);
        break;
      case "notify":
        handleNotify(request.hospital_id, request.hospital?.name);
        break;
      case "escalate":
        handleEscalate(request.id);
        break;
      case "archive":
        handleArchive(request);
        break;
      default:
        break;
    }
  }, []);

  const handleArchive = async (request) => {
    try {
      await allocationService.updateLogisticsStatus(request.id, "archived");
      addToast({
        title: "Request Archived",
        description: `Request ${request.id} has been successfully archived.`,
        variant: "success",
      });
      // Optionally re-fetch or clear from local state
      fetchPending(false);
    } catch {
      addToast({
        title: "Archiving Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNotify = async (hospitalId, hospitalName) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addToast({
        title: "Notification sent",
        description: `Hospital: ${hospitalName || hospitalId}`,
        variant: "success",
      });
    } catch {
      addToast({
        title: "Notification failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEscalate = async (requestId) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addToast({
        title: "Request escalated",
        description: "Sent to central buffer for immediate attention",
        variant: "warning",
        persist: true,
      });
    } catch {
      addToast({
        title: "Escalation failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        title: "Copied to clipboard",
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: "Copy failed",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    const data = filteredRequests.map((req) => ({
      Hospital: req.hospital?.name,
      Resource: req.resource_name,
      Quantity: req.quantity,
      Urgency: req.urgency_level,
      Status: req.status,
      "Hospital ID": req.hospital_id,
      "Request ID": req.id,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allocations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    addToast({
      title: "Data exported",
      description: `${filteredRequests.length} records downloaded`,
      variant: "success",
    });
  };

  const getActionItems = useCallback(
    (request) => {
      const isTerminal = ["verified", "failed", "rejected"].includes(
        request.status,
      );
      const actions = [
        {
          label: "View Request Details",
          icon: Eye,
          variant: "outline",
          onClick: () => handleAction("view", request),
        },
      ];

      if (!isTerminal) {
        actions.push({
          label: "Auto-Rank & Match Sources",
          icon: ListChecks,
          variant: "default",
          onClick: () => handleAction("match", request),
          highlight: true,
        });
        actions.push({
          label: "Send Notification",
          icon: Bell,
          variant: "outline",
          onClick: () => handleAction("notify", request),
        });
      }

      actions.push({
        label: "Copy Request ID",
        icon: Clipboard,
        variant: "outline",
        onClick: () => handleCopyToClipboard(request.id),
      });

      if (!isTerminal) {
        actions.push({
          label: "Escalate to Central Buffer",
          icon: ShieldAlert,
          variant: "destructive",
          onClick: () => handleAction("escalate", request),
        });
      } else {
        actions.push({
          label: "Confirm & Archive",
          icon: Archive,
          variant: "outline",
          onClick: () => handleAction("archive", request),
        });
      }

      return actions;
    },
    [handleAction, handleCopyToClipboard],
  );

  // Card view component
  const RequestCard = ({ request }) => {
    const actionItems = getActionItems(request);

    return (
      <Card className="hover:shadow-xl transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {showCheckboxes && (
                <input
                  type="checkbox"
                  checked={selectedRequests.includes(request.id)}
                  onChange={() => toggleSelection(request.id)}
                  className="h-5 w-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              )}
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-5 w-5 text-green-800" />
              </div>
              <div>
                <div className="font-bold text-green-900">
                  {request.hospital?.name || "Unknown Hospital"}
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin size={12} />
                  ID: {request.hospital_id}
                </div>
              </div>
            </div>
            <Badge
              variant={
                request.urgency_level === "Critical"
                  ? "destructive"
                  : request.urgency_level === "High"
                    ? "warning"
                    : request.urgency_level === "Medium"
                      ? "info"
                      : "success"
              }
              icon={
                request.urgency_level === "Critical"
                  ? AlertCircle
                  : request.urgency_level === "High"
                    ? Zap
                    : request.urgency_level === "Medium"
                      ? Clock
                      : Check
              }
            >
              {request.urgency_level}
            </Badge>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-lg text-green-900">
                {request.resource_name}
              </h4>
              <span className="text-xl font-bold text-green-800 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-lg">
                {request.quantity}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {request.handling_class === "ColdChain" && (
                <Badge variant="info" icon={Thermometer}>
                  Cold Chain
                </Badge>
              )}
              {request.handling_class === "HighValue" && (
                <Badge variant="purple" icon={DollarSign}>
                  High Value
                </Badge>
              )}
              {request.handling_class === "Narcotics" && (
                <Badge variant="destructive" icon={Shield}>
                  Narcotics
                </Badge>
              )}
              <Badge variant="secondary" icon={Clock}>
                {request.status}
              </Badge>
            </div>

            {request.reason && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Reason:
                </div>
                <div className="text-sm text-gray-600 bg-amber-50 border-2 border-amber-200 rounded-lg p-3 italic">
                  "{request.reason}"
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("view", request)}
              className="flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              View
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAction("match", request)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <ListChecks size={16} />
              Auto-Rank
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Table row component with dropdown
  const RequestTableRow = ({ request }) => {
    const actionItems = getActionItems(request);

    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`border-b-2 border-green-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors duration-200 ${
          selectedRequests.includes(request.id)
            ? "bg-gradient-to-r from-green-50 to-emerald-50"
            : ""
        }`}
      >
        <td className="p-4">
          {showCheckboxes && (
            <input
              type="checkbox"
              checked={selectedRequests.includes(request.id)}
              onChange={() => toggleSelection(request.id)}
              className="h-5 w-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
          )}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-5 w-5 text-green-800" />
            </div>
            <div>
              <div className="font-semibold text-green-900">
                {request.hospital?.name || "Unknown Hospital"}
              </div>
              <div className="text-xs text-gray-600">
                ID: {request.hospital_id}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="font-bold text-green-900">
            {request.resource_name}
          </div>
        </td>
        <td className="p-4">
          <span className="font-bold text-xl text-green-800 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-lg">
            {request.quantity}
          </span>
        </td>
        <td className="p-4">
          <Badge
            variant={
              request.urgency_level === "Critical"
                ? "destructive"
                : request.urgency_level === "High"
                  ? "warning"
                  : request.urgency_level === "Medium"
                    ? "info"
                    : "success"
            }
          >
            {request.urgency_level}
          </Badge>
        </td>
        <td className="p-4">
          <Badge
            variant={
              request.status === "pending"
                ? "warning"
                : request.status === "approved"
                  ? "success"
                  : "secondary"
            }
          >
            {request.status}
          </Badge>
        </td>
        <td className="p-4">
          <DropdownMenu
            align="end"
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <MoreVertical className="h-4 w-4" />
                Actions
                <ChevronDown className="h-3 w-3" />
              </Button>
            }
            items={actionItems}
          />
        </td>
      </motion.tr>
    );
  };

  return (
    <>
      <div className="space-y-6 p-6 bg-gradient-to-br from-[#F8FBF8] to-[#F0F7F0] min-h-screen">
        {/* Header with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
              Coordination Center
            </h1>
            <p className="text-gray-700 mt-2">
              Manage and coordinate resource allocation requests
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={fetchPending} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
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
              onClick={handleExportData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Statistics Dashboard */}
        {showStatistics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <StatisticsDashboard requests={requests} />
          </motion.div>
        )}

        {/* Selection Controls Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by resource, hospital, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 border-2 border-gray-300 rounded-xl p-1 bg-white">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="px-4"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="px-4"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="all">All Urgency</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {(showCheckboxes || selectedRequests.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-40"
          >
            <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-green-500 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={
                        selectedRequests.length === filteredRequests.length &&
                        filteredRequests.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-2 border-white bg-transparent checked:bg-white focus:ring-white"
                    />
                    <div>
                      <div className="font-bold">
                        {selectedRequests.length} of {filteredRequests.length}{" "}
                        requests selected
                      </div>
                      <div className="text-sm opacity-90">
                        Select all requests on this page
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCheckboxes(!showCheckboxes)}
                      className="bg-white text-green-800 hover:bg-green-50"
                    >
                      {showCheckboxes ? (
                        <CheckSquare className="mr-2 h-4 w-4" />
                      ) : (
                        <Square className="mr-2 h-4 w-4" />
                      )}
                      Select Mode
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequests([])}
                      disabled={selectedRequests.length === 0}
                      className="bg-white text-green-800 hover:bg-green-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Clear
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                      disabled={selectedRequests.length === 0}
                      className="bg-white text-green-800 hover:bg-green-100"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Create Allocation
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setConfirmDialog({
                          title: "Confirm Bulk Create",
                          message: `Are you sure you want to create allocations for ${selectedRequests.length} selected requests?`,
                          onConfirm: handleBulkCreate,
                          variant: "default",
                        });
                      }}
                      disabled={selectedRequests.length === 0}
                      className="bg-gradient-to-r from-white to-green-50 text-green-800 shadow-lg"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Bulk Create ({selectedRequests.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bulk Progress Modal */}
        {bulkProgress && (
          <Modal
            isOpen={!!bulkProgress}
            onClose={() => {}}
            title="Bulk Operation Progress"
          >
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900 mb-2">
                  {bulkProgress.completed}/{bulkProgress.total} Completed
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${(bulkProgress.completed / bulkProgress.total) * 100}%`,
                    }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>

              {bulkProgress.current && (
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    Currently processing:
                  </div>
                  <div className="font-semibold text-green-900">
                    {bulkProgress.current}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                Please don't close this window...
              </div>
            </div>
          </Modal>
        )}

        {/* Main Content Card */}
        <Card hoverable={false}>
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-green-500">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">
                Pending Requests ({filteredRequests.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCheckboxes(!showCheckboxes)}
                  className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                >
                  {showCheckboxes ? (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  ) : (
                    <Square className="mr-2 h-4 w-4" />
                  )}
                  Select
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-700 text-lg font-medium mb-2">
                  No requests found
                </p>
                <p className="text-gray-500">
                  {searchTerm ||
                  urgencyFilter !== "all" ||
                  statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "All requests have been processed"}
                </p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <AnimatePresence>
                  {filteredRequests.map((req, index) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <RequestCard request={req} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-300">
                    <tr>
                      <th className="p-4 text-left w-12">
                        {showCheckboxes && (
                          <input
                            type="checkbox"
                            checked={
                              selectedRequests.length ===
                                filteredRequests.length &&
                              filteredRequests.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="h-5 w-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        )}
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Hospital
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Resource
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Quantity
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Urgency
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Status
                      </th>
                      <th className="p-4 text-left font-bold text-green-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredRequests.map((req) => (
                        <RequestTableRow key={req.id} request={req} />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Request Modal */}
        <Modal
          isOpen={!!viewRequest}
          onClose={() => setViewRequest(null)}
          title="Request Details"
          size="lg"
        >
          {viewRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoChip
                  icon={Package}
                  label="Resource"
                  value={viewRequest.resource_name}
                  color="green"
                />
                <InfoChip
                  icon={Building2}
                  label="Hospital"
                  value={viewRequest.hospital?.name || "Unknown"}
                  color="blue"
                />
                <InfoChip
                  icon={DollarSign}
                  label="Quantity"
                  value={viewRequest.quantity}
                  color="amber"
                />
                <InfoChip
                  icon={Zap}
                  label="Urgency"
                  value={viewRequest.urgency_level}
                  color={
                    viewRequest.urgency_level === "Critical"
                      ? "destructive"
                      : viewRequest.urgency_level === "High"
                        ? "warning"
                        : "info"
                  }
                />
                <InfoChip
                  icon={Clock}
                  label="Status"
                  value={viewRequest.status}
                  color={
                    viewRequest.status === "pending"
                      ? "warning"
                      : viewRequest.status === "approved"
                        ? "success"
                        : "gray"
                  }
                />
                <InfoChip
                  icon={MapPin}
                  label="Hospital ID"
                  value={viewRequest.hospital_id}
                  color="purple"
                />
              </div>

              {viewRequest.reason && (
                <div>
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">
                    Request Reason
                  </h4>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5">
                    <p className="text-amber-900 italic text-lg leading-relaxed">
                      "{viewRequest.reason}"
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-4 text-lg">
                  Handling Information
                </h4>
                <div className="flex flex-wrap gap-3">
                  {viewRequest.handling_class === "ColdChain" && (
                    <Badge
                      variant="info"
                      icon={Thermometer}
                      className="px-4 py-2"
                    >
                      Cold Chain Required
                    </Badge>
                  )}
                  {viewRequest.handling_class === "HighValue" && (
                    <Badge variant="purple" icon={Shield} className="px-4 py-2">
                      High Value Security
                    </Badge>
                  )}
                  {viewRequest.handling_class === "Narcotics" && (
                    <Badge
                      variant="destructive"
                      icon={ShieldAlert}
                      className="px-4 py-2"
                    >
                      Narcotics Handling
                    </Badge>
                  )}
                  {!["ColdChain", "HighValue", "Narcotics"].includes(
                    viewRequest.handling_class,
                  ) && (
                    <Badge
                      variant="secondary"
                      icon={Package}
                      className="px-4 py-2"
                    >
                      General Handling
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t-2 border-green-200">
                <Button
                  variant="outline"
                  onClick={() => handleAction("notify", viewRequest)}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Notify Hospital
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleAction("match", viewRequest)}
                  className="gap-2"
                >
                  <ListChecks className="h-4 w-4" />
                  Auto-Rank & Match
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction("escalate", viewRequest)}
                  className="gap-2"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Escalate to Buffer
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Match Suggestions Modal */}
        <Modal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedRequestForMatch(null);
          }}
          title="Auto-Rank & Match Sources"
          size="xl"
        >
          {selectedRequestForMatch && (
            <MatchSuggestions
              request={selectedRequestForMatch}
              onAllocationCreated={(newAllocation) => {
                addToast({
                  title: "Allocation created successfully!",
                  description: "Resource allocation has been planned",
                  variant: "success",
                });
                setShowMatchModal(false);
                setSelectedRequestForMatch(null);
                fetchPending(false);
              }}
              onClose={() => {
                setShowMatchModal(false);
                setSelectedRequestForMatch(null);
              }}
            />
          )}
        </Modal>

        {/* Create Allocation Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Allocation"
          size="md"
        >
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-300">
              <h4 className="font-bold text-green-900 mb-3">
                You are about to create allocations for:
              </h4>
              <div className="space-y-2">
                {selectedRequests.slice(0, 5).map((id, index) => {
                  const request = requests.find((req) => req.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-200"
                    >
                      <div>
                        <div className="font-medium text-green-900">
                          {request?.resource_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request?.hospital?.name}
                        </div>
                      </div>
                      <Badge variant="success" className="px-3">
                        Qty: {request?.quantity}
                      </Badge>
                    </div>
                  );
                })}
                {selectedRequests.length > 5 && (
                  <div className="text-center py-2 text-gray-600 border-t border-green-200">
                    ... and {selectedRequests.length - 5} more requests
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowCreateModal(false);
                  setConfirmDialog({
                    title: "Confirm Allocation Creation",
                    message: `Create allocations for ${selectedRequests.length} selected requests?`,
                    onConfirm: handleBulkCreate,
                    variant: "default",
                  });
                }}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Create
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
        />
      )}
    </>
  );
};

// Export wrapped component with ToastProvider
const CoordinationPanelWithToast = () => (
  <ToastProvider>
    <CoordinationPanel />
  </ToastProvider>
);

export default CoordinationPanelWithToast;
