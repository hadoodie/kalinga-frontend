// src/components/logistics/registry/overview/AssetRegistry.jsx
import { useState, useEffect, useRef } from "react";
import { 
  Search, Filter, X, RefreshCw, ChevronDown, Plus, 
  ChevronLeft, ChevronRight, Package, MapPin, MoreVertical,
  Eye, Edit, Wrench, Truck, Trash2, CheckCircle, AlertCircle,
  Clock, Shield, Battery, Thermometer, Zap, Users, Calendar,
  Check, Grid, List, Download, Upload, Settings, Info,
  Activity, HardDrive, Cpu, Database, Server, Power
} from "lucide-react";
import assetService from "@/services/assetService";
import AddAssetModal from "./AddAssetModal";
import ViewAssetModal from "./ViewAssetModal";
import EditAssetModal from "./EditAssetModal";
import ScheduleMaintenanceModal from "./ScheduleMaintenanceModal";
import AssignAssetModal from "./AssignAssetModal";

// Enhanced Theme CSS with Blur Effects
const enhancedThemeStyles = `
/* Enhanced Theme Variables */
:root {
  --primary-green: #059669;
  --primary-green-dark: #047857;
  --primary-green-light: #d1fae5;
  --emerald-600: #059669;
  --emerald-700: #047857;
  --emerald-800: #065f46;
  --green-600: #16a34a;
  --green-800: #166534;
  --blue-600: #2563eb;
  --amber-600: #d97706;
  --purple-600: #9333ea;
  --gray-600: #4b5563;
  --success-green: #10b981;
  --warning-yellow: #f59e0b;
  --danger-red: #ef4444;
  --info-blue: #3b82f6;
}

/* Enhanced Modal Backdrop */
.enhanced-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.enhanced-modal-container {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

.enhanced-modal {
  background: white;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced Card Styles */
.enhanced-card {
  background: white;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.enhanced-card:hover {
  box-shadow: 0 25px 50px -12px rgba(5, 150, 105, 0.15);
  border-color: #34d399;
  transform: translateY(-2px);
}

/* Enhanced Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-operational {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border-color: #10b981;
}

.status-under-repair {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-color: #f59e0b;
}

.status-standby {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #3b82f6;
}

.status-decommissioned {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border-color: #9ca3af;
}

/* Enhanced Action Menu */
.action-menu-wrapper {
  position: relative;
}

.action-menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
  margin-top: 0.5rem;
  min-width: 220px;
  border-radius: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideDown 0.2s ease;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-menu-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  width: 100%;
  text-align: left;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(243, 244, 246, 0.8);
}

.action-menu-item:hover {
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.5) 0%, rgba(167, 243, 208, 0.5) 100%);
  color: #065f46;
  padding-left: 1.5rem;
}

.action-menu-item.danger:hover {
  background: linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, rgba(254, 202, 202, 0.5) 100%);
  color: #dc2626;
}

/* Enhanced Table */
.table-container {
  overflow-x: auto;
  border-radius: 1rem;
}

.enhanced-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

.enhanced-table thead {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 3px solid #0ea5e9;
}

.enhanced-table th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #0369a1;
  white-space: nowrap;
}

.enhanced-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.enhanced-table tbody tr:hover {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  transform: scale(1.002);
}

.enhanced-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

/* Enhanced Search */
.enhanced-search-wrapper {
  position: relative;
  flex: 1;
}

.enhanced-search {
  width: 100%;
  background: white;
  border: 2px solid #cbd5e1;
  border-radius: 1rem;
  padding: 1rem 1.25rem 1rem 3.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 1.25rem center;
}

.enhanced-search:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.15);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
}

/* Enhanced Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  font-weight: 700;
  padding: 1rem 2rem;
  border-radius: 1rem;
  border: none;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.2);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(5, 150, 105, 0.25);
}

/* Enhanced Secondary Button */
.btn-secondary {
  background: white;
  color: #334155;
  font-weight: 600;
  padding: 1rem 1.75rem;
  border-radius: 1rem;
  border: 2px solid #cbd5e1;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

/* Metric Cards */
.metric-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 1.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: var(--gradient-start);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

/* Filter Chips */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #cbd5e1;
  transition: all 0.2s ease;
  cursor: pointer;
}

.filter-chip:hover {
  background: #e2e8f0;
  color: #334155;
  border-color: #94a3b8;
}

.filter-chip.active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border-color: #34d399;
  box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.1);
}

/* Enhanced Checkbox */
.enhanced-checkbox {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 0.5rem;
  border: 2px solid #cbd5e1;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  position: relative;
}

.enhanced-checkbox:checked {
  background-color: #059669;
  border-color: #059669;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
  background-position: center;
  background-repeat: no-repeat;
}

.enhanced-checkbox:hover {
  border-color: #059669;
}

/* Pagination */
.pagination-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-item {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #64748b;
  background: white;
  border: 2px solid #e2e8f0;
  transition: all 0.2s ease;
  cursor: pointer;
}

.pagination-item:hover {
  background: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}

.pagination-item.active {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border-color: #059669;
}

.pagination-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Bulk Actions Bar */
.bulk-actions-bar {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

/* Section Headers */
.section-header {
  font-size: 1.5rem;
  font-weight: 800;
  color: #065f46;
  letter-spacing: -0.025em;
}

.section-subheader {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* Info Chip */
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.info-chip.green {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.info-chip.blue {
  background: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}

.info-chip.amber {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}
`;

// Inject styles
if (!document.querySelector('#enhanced-asset-registry-theme')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'enhanced-asset-registry-theme';
  styleElement.textContent = enhancedThemeStyles;
  document.head.appendChild(styleElement);
}

// Action Menu Component
const ActionMenu = ({ asset, onClose, onAction }) => {
  const menuItems = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      action: 'view',
      color: 'text-green-600'
    },
    {
      label: 'Edit Asset',
      icon: <Edit className="h-4 w-4" />,
      action: 'edit',
      color: 'text-blue-600'
    },
    {
      label: 'Schedule Maintenance',
      icon: <Wrench className="h-4 w-4" />,
      action: 'maintenance',
      color: 'text-amber-600'
    },
    ...(asset.status === 'Standby' ? [{
      label: 'Assign to Allocation',
      icon: <Truck className="h-4 w-4" />,
      action: 'assign',
      color: 'text-purple-600'
    }] : []),
    {
      label: 'Delete Asset',
      icon: <Trash2 className="h-4 w-4" />,
      action: 'delete',
      color: 'text-red-600',
      danger: true
    }
  ];
  
  return (
    <div className="action-menu-dropdown">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            onAction(item.action, asset);
            onClose();
          }}
          className={`action-menu-item ${item.danger ? 'danger' : ''}`}
        >
          <span className={item.color}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, color, icon: Icon, onClick }) => {
  const gradientColors = {
    total: { start: '#059669', end: '#10b981' },
    operational: { start: '#10b981', end: '#34d399' },
    underRepair: { start: '#f59e0b', end: '#fbbf24' },
    standby: { start: '#3b82f6', end: '#60a5fa' }
  };

  return (
    <div 
      className="metric-card"
      style={{
        '--gradient-start': gradientColors[color]?.start || '#059669',
        '--gradient-end': gradientColors[color]?.end || '#10b981'
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
        {Icon && (
          <div className="p-3 rounded-full bg-green-50">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default function AssetRegistry({ loading: initialLoading, assets: propAssets, onRefresh, metrics: propMetrics }) {
  // ========== STATE ==========
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UI State
  const [viewMode, setViewMode] = useState("table");
  
  // Filters
  const [filters, setFilters] = useState({
    status: "All Status",
    category: "All Categories",
    location: "All Locations",
    search: ""
  });
  
  // Selection - FIXED: Using Map for better performance
  const [selectedAssets, setSelectedAssets] = useState(new Map());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Action Menu - FIXED: Proper state management per row
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRefs = useRef(new Map());
  
  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Data State
  const [loading, setLoading] = useState(initialLoading);
  const [metrics, setMetrics] = useState({
    total: 0,
    operational: 0,
    underRepair: 0,
    standby: 0,
    decommissioned: 0
  });

  // ========== EFFECTS ==========
  useEffect(() => {
    // Load initial data
    if (propAssets && propAssets.length > 0) {
      setAssets(propAssets);
      calculateMetrics(propAssets);
      setFilteredAssets(propAssets);
    } else {
      fetchAssets();
    }
    
    // Close action menu on outside click
    const handleClickOutside = (event) => {
      let clickedOutside = true;
      
      actionMenuRefs.current.forEach((ref, assetCode) => {
        if (ref && ref.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside) {
        setActiveActionMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, filters]);

  // ========== API FUNCTIONS ==========
  const fetchAssets = async () => {
    setIsRefreshing(true);
    try {
      const assetsData = await assetService.getAssets();
      setAssets(assetsData);
      setFilteredAssets(assetsData);
      calculateMetrics(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const calculateMetrics = (assetsData) => {
    const total = assetsData.length;
    const operational = assetsData.filter(a => a.status === 'Operational').length;
    const underRepair = assetsData.filter(a => a.status === 'Under Repair').length;
    const standby = assetsData.filter(a => a.status === 'Standby').length;
    const decommissioned = assetsData.filter(a => a.status === 'Decommissioned').length;
    
    setMetrics({
      total,
      operational,
      underRepair,
      standby,
      decommissioned
    });
  };

  // ========== FILTER FUNCTIONS ==========
  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(asset => {
        const code = (getAssetCodeDisplay(asset) || '').toLowerCase();
        const type = (getAssetTypeDisplay(asset) || '').toLowerCase();
        const category = (asset.category ?? '').toLowerCase();
        const location = (asset.location ?? '').toLowerCase();
        const plate = (asset.plate_number ?? asset.plateNumber ?? '').toLowerCase();

        return (
          code.includes(searchLower) ||
          type.includes(searchLower) ||
          category.includes(searchLower) ||
          location.includes(searchLower) ||
          plate.includes(searchLower)
        );
      });
    }

    // Status filter
    if (filters.status !== "All Status") {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    // Category filter
    if (filters.category !== "All Categories") {
      filtered = filtered.filter(asset => asset.category === filters.category);
    }

    // Location filter
    if (filters.location !== "All Locations") {
      filtered = filtered.filter(asset => asset.location === filters.location);
    }

    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  // ========== ASSET ACTIONS ==========
  const handleAction = (action, asset) => {
    setSelectedAsset(asset);
    
    switch(action) {
      case 'view':
        setActiveModal('view');
        break;
      case 'edit':
        setActiveModal('edit');
        break;
      case 'maintenance':
        setActiveModal('maintenance');
        break;
      case 'assign':
        setActiveModal('assign');
        break;
      case 'delete':
        handleDeleteAsset(getAssetKey(asset));
        break;
    }
  };

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    setActiveModal('view');
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setActiveModal('edit');
  };

  const handleDeleteAsset = async (assetCode) => {
    if (window.confirm(`Are you sure you want to delete asset ${assetCode}? This action cannot be undone.`)) {
      try {
        await assetService.deleteAsset(assetCode);
        
        // Remove from selected assets
        const newSelected = new Map(selectedAssets);
        newSelected.delete(assetCode);
        setSelectedAssets(newSelected);
        setShowBulkActions(newSelected.size > 0);
        
        // Refresh data
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset. Please try again.');
      }
    }
  };

  const handleScheduleMaintenance = (asset) => {
    setSelectedAsset(asset);
    setActiveModal('maintenance');
  };

  const handleAssignAsset = (asset) => {
    setSelectedAsset(asset);
    setActiveModal('assign');
  };

  const handleAddAsset = () => {
    setActiveModal('add');
  };

  // ========== BULK OPERATIONS - FIXED ==========
  const toggleSelectAsset = (assetKey, e) => {
    e?.stopPropagation();
    const newSelected = new Map(selectedAssets);

    if (newSelected.has(assetKey)) {
      newSelected.delete(assetKey);
    } else {
      const asset = assets.find(a => getAssetKey(a) === assetKey);
      if (asset) {
        newSelected.set(assetKey, asset);
      }
    }

    setSelectedAssets(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === currentAssets.length) {
      setSelectedAssets(new Map());
      setShowBulkActions(false);
    } else {
      const newSelected = new Map();
      currentAssets.forEach(asset => {
        newSelected.set(getAssetKey(asset), asset);
      });
      setSelectedAssets(newSelected);
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedAssets.size === 0) return;
    
    switch(action) {
      case 'delete':
        if (window.confirm(`Delete ${selectedAssets.size} selected assets?`)) {
          // Implement bulk delete
          console.log(`Bulk delete ${selectedAssets.size} assets`, Array.from(selectedAssets.keys()));
          setSelectedAssets(new Map());
          setShowBulkActions(false);
        }
        break;
      case 'export':
        console.log(`Export ${selectedAssets.size} assets`, Array.from(selectedAssets.keys()));
        break;
      case 'maintenance':
        console.log(`Schedule maintenance for ${selectedAssets.size} assets`);
        break;
    }
  };

  // ========== UTILITIES ==========
  // Stable key helper: backend sometimes returns different shapes (asset_code vs id vs name)
  const getAssetKey = (asset) => asset?.asset_code ?? asset?.id ?? asset?.assetCode ?? asset?.name ?? asset?.plate_number ?? '';

  const getAssetCodeDisplay = (asset) => asset?.asset_code ?? asset?.id ?? asset?.assetCode ?? asset?.name ?? '';
  const getAssetTypeDisplay = (asset) => asset?.type ?? asset?.name ?? '';

  const getStatusOptions = () => {
    const statuses = [...new Set(assets.map(asset => asset.status).filter(Boolean))];
    return ['All Status', ...statuses];
  };

  const getCategoryOptions = () => {
    const categories = [...new Set(assets.map(asset => asset.category).filter(Boolean))];
    return ['All Categories', ...categories];
  };

  const getLocationOptions = () => {
    const locations = [...new Set(assets.map(asset => asset.location).filter(Boolean))];
    return ['All Locations', ...locations];
  };

  const clearFilters = () => {
    setFilters({
      status: "All Status",
      category: "All Categories",
      location: "All Locations",
      search: ""
    });
  };

  // ========== PAGINATION ==========
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // ========== RENDER COMPONENTS ==========
  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading asset registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header with Metrics */}
      <div className="enhanced-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="section-header">Asset Registry</h1>
            <p className="section-subheader mt-2">
              Manage and monitor all emergency response assets in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRefresh?.() || fetchAssets()}
              disabled={isRefreshing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleAddAsset}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Assets"
            value={metrics.total}
            color="total"
            icon={Package}
            onClick={() => setFilters({...filters, status: "All Status"})}
          />
          <MetricCard
            title="Operational"
            value={metrics.operational}
            color="operational"
            icon={CheckCircle}
            onClick={() => setFilters({...filters, status: "Operational"})}
          />
          <MetricCard
            title="Under Repair"
            value={metrics.underRepair}
            color="underRepair"
            icon={AlertCircle}
            onClick={() => setFilters({...filters, status: "Under Repair"})}
          />
          <MetricCard
            title="Standby"
            value={metrics.standby}
            color="standby"
            icon={Clock}
            onClick={() => setFilters({...filters, status: "Standby"})}
          />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="enhanced-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="enhanced-search-wrapper">
            <input
              type="text"
              placeholder="Search assets by code, type, category, or location..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="enhanced-search"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {getCategoryOptions().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="p-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              title={viewMode === 'table' ? 'Switch to Grid View' : 'Switch to Table View'}
            >
              {viewMode === 'table' ? (
                <Grid className="h-5 w-5 text-gray-600" />
              ) : (
                <List className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2">
          {(filters.status !== "All Status" || filters.category !== "All Categories" || filters.search) && (
            <>
              {filters.status !== "All Status" && (
                <button
                  onClick={() => setFilters({...filters, status: "All Status"})}
                  className="filter-chip active"
                >
                  Status: {filters.status}
                  <X className="h-3 w-3" />
                </button>
              )}
              
              {filters.category !== "All Categories" && (
                <button
                  onClick={() => setFilters({...filters, category: "All Categories"})}
                  className="filter-chip active"
                >
                  Category: {filters.category}
                  <X className="h-3 w-3" />
                </button>
              )}
              
              {filters.search && (
                <button
                  onClick={() => setFilters({...filters, search: ""})}
                  className="filter-chip active"
                >
                  Search: "{filters.search}"
                  <X className="h-3 w-3" />
                </button>
              )}
              
              <button
                onClick={clearFilters}
                className="filter-chip"
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAssets.size > 0}
                  onChange={toggleSelectAll}
                  className="enhanced-checkbox"
                />
                <span className="font-bold text-gray-900">
                  {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('maintenance')}
                className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-semibold text-sm hover:bg-amber-100 border border-amber-200"
              >
                Schedule Maintenance
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-100 border border-blue-200"
              >
                Export Selected
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-100 border border-red-200"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Table */}
      <div className="enhanced-card overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-header">Assets</h2>
              <p className="section-subheader mt-1">
                {filteredAssets.length} assets found
                {selectedAssets.size > 0 && ` • ${selectedAssets.size} selected`}
              </p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.status !== "All Status" || filters.category !== "All Categories"
                ? "No assets match your current filters. Try adjusting your search criteria."
                : 'Get started by adding your first asset'
              }
            </p>
            {!filters.search && filters.status === "All Status" && filters.category === "All Categories" && (
              <button
                onClick={handleAddAsset}
                className="btn-primary"
              >
                <Plus className="h-5 w-5" />
                Add Your First Asset
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <>
            <div className="table-container">
              <table className="enhanced-table">
                <thead>
                  <tr>
                    <th className="w-14 pl-6">
                      <input
                        type="checkbox"
                        className="enhanced-checkbox"
                        checked={selectedAssets.size === currentAssets.length && currentAssets.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Asset Code</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th className="pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAssets.map((asset) => (
                    <tr 
                          key={getAssetKey(asset)}
                          className="cursor-pointer hover:bg-green-50 transition-all duration-200"
                          onClick={() => handleViewDetails(asset)}
                        >
                      <td className="pl-6" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="enhanced-checkbox"
                          checked={selectedAssets.has(getAssetKey(asset))}
                          onChange={(e) => toggleSelectAsset(getAssetKey(asset), e)}
                        />
                      </td>
                      <td>
                        <div className="font-bold text-green-900">{getAssetCodeDisplay(asset)}</div>
                        {asset.plate_number && (
                          <div className="text-xs text-gray-500 mt-1 font-medium">Plate: {asset.plate_number}</div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-gray-900">{getAssetTypeDisplay(asset)}</div>
                        {asset.capacity && (
                          <div className="text-sm text-gray-600 font-medium">{asset.capacity}</div>
                        )}
                      </td>
                      <td>
                        <span className="text-gray-700 font-medium">{asset.category}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${asset.status.toLowerCase().replace(' ', '-')}`}>
                          {asset.status === 'Operational' && <CheckCircle className="h-3 w-3" />}
                          {asset.status === 'Under Repair' && <AlertCircle className="h-3 w-3" />}
                          {asset.status === 'Standby' && <Clock className="h-3 w-3" />}
                          {asset.status === 'Decommissioned' && <Shield className="h-3 w-3" />}
                          {asset.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {asset.location || 'Not assigned'}
                        </div>
                      </td>
                      <td className="pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="action-menu-wrapper flex justify-center">
                          <button
                            ref={el => actionMenuRefs.current.set(getAssetKey(asset), el)}
                            onClick={(e) => {
                              e.stopPropagation();
                              const k = getAssetKey(asset);
                              setActiveActionMenuId(activeActionMenuId === k ? null : k);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>
                          
                          {activeActionMenuId === getAssetKey(asset) && (
                            <div 
                              ref={el => actionMenuRefs.current.set(getAssetKey(asset), el)}
                              className="absolute z-50"
                            >
                              <ActionMenu 
                                asset={asset} 
                                onClose={() => setActiveActionMenuId(null)}
                                onAction={handleAction}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredAssets.length > itemsPerPage && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm text-gray-600 font-medium">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
                  </p>
                  
                  <div className="pagination-container">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="pagination-item disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      
                      if (showPage) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`pagination-item ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="pagination-item text-gray-400 border-none">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="pagination-item disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Grid View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentAssets.map((asset) => (
                <div 
                  key={getAssetKey(asset)}
                  className="enhanced-card p-5 cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => handleViewDetails(asset)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-green-900 text-lg">{getAssetCodeDisplay(asset)}</h3>
                      <p className="text-sm text-gray-600 font-medium">{getAssetTypeDisplay(asset)}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="enhanced-checkbox"
                      checked={selectedAssets.has(getAssetKey(asset))}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectAsset(getAssetKey(asset), e);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Category</span>
                      <span className="font-bold text-gray-800">{asset.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Status</span>
                      <span className={`status-badge status-${asset.status.toLowerCase().replace(' ', '-')}`}>
                        {asset.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Location</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span className="font-bold text-gray-800">{asset.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      {asset.capacity && (
                        <div className="text-sm text-gray-600 font-semibold">{asset.capacity}</div>
                      )}
                      <button
                        ref={el => actionMenuRefs.current.set(getAssetKey(asset), el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const k = getAssetKey(asset);
                          setActiveActionMenuId(activeActionMenuId === k ? null : k);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination for Grid View */}
            {filteredAssets.length > itemsPerPage && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm text-gray-600 font-medium">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
                  </p>
                  
                  <div className="pagination-container">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="pagination-item disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      
                      if (showPage) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`pagination-item ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="pagination-item text-gray-400 border-none">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="pagination-item disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals with Enhanced Blur Backgrounds */}
      {activeModal && (
        <>
          <div className="enhanced-modal-backdrop" />
          
          <div className="enhanced-modal-container">
            {activeModal === 'add' && (
              <AddAssetModal
                isOpen={true}
                onClose={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                }}
                onSuccess={() => {
                  setActiveModal(null);
                  fetchAssets();
                  onRefresh?.();
                }}
              />
            )}
            
            {activeModal === 'view' && selectedAsset && (
              <ViewAssetModal
                isOpen={true}
                onClose={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onEdit={() => {
                  setActiveModal('edit');
                }}
                onScheduleMaintenance={() => {
                  setActiveModal('maintenance');
                }}
                onAssign={() => {
                  setActiveModal('assign');
                }}
                onDelete={() => handleDeleteAsset(getAssetKey(selectedAsset))}
              />
            )}
            
            {activeModal === 'edit' && selectedAsset && (
              <EditAssetModal
                isOpen={true}
                onClose={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                  fetchAssets();
                  onRefresh?.();
                }}
              />
            )}
            
            {activeModal === 'maintenance' && selectedAsset && (
              <ScheduleMaintenanceModal
                isOpen={true}
                onClose={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                  fetchAssets();
                  onRefresh?.();
                }}
              />
            )}
            
            {activeModal === 'assign' && selectedAsset && (
              <AssignAssetModal
                isOpen={true}
                onClose={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={() => {
                  setActiveModal(null);
                  setSelectedAsset(null);
                  fetchAssets();
                  onRefresh?.();
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}