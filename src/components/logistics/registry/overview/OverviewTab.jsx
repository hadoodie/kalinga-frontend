// src/components/logistics/registry/overview/OverviewTab.jsx
import { useState, useEffect } from "react";
import { Search, Filter, X, RefreshCw, ClipboardClock, Boxes, Truck, Wrench, Users, ChevronDown } from "lucide-react";
import AssetTable from "./AssetTable";
import { mockAssetService } from "../../../../services/mockAssetService";
import { useNavigate } from 'react-router-dom';

// Enhanced CSS animations and styles
const enhancedStyles = `
/* ======== Enhanced Search Bar Animations ======== */
.enhanced-search-container {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.enhanced-search-input {
  border: 2px solid #e5e7eb;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.enhanced-search-input:hover {
  border-color: #a7f3d0;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.enhanced-search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2),
              0 0 20px rgba(16, 185, 129, 0.3);
  transform: scale(1.02);
}

.enhanced-search-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #00B97C, #4CAF50, #A8FF78, #00B97C);
  background-size: 400% 400%;
  border-radius: 12px;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  animation: gradientFlow 3s ease infinite;
}

.enhanced-search-input:hover ~ .enhanced-search-glow,
.enhanced-search-input:focus ~ .enhanced-search-glow {
  opacity: 0.6;
}

@keyframes gradientFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.enhanced-search-icon {
  transition: all 0.3s ease;
}

.enhanced-search-input:hover ~ .enhanced-search-icon,
.enhanced-search-input:focus ~ .enhanced-search-icon {
  color: #10b981;
  transform: scale(1.1) rotate(5deg);
}

/* ======== Automated Hover Dropdown ======== */
.enhanced-dropdown {
  position: relative;
}

.enhanced-dropdown:hover .enhanced-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.enhanced-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
}

.enhanced-dropdown-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.enhanced-dropdown-option:last-child {
  border-bottom: none;
}

.enhanced-dropdown-option:hover {
  background: #f0fdf4;
  color: #059669;
}

.enhanced-dropdown-select {
  cursor: pointer;
}

/* ======== Enhanced Refresh Button ======== */
.enhanced-refresh-btn {
  background: linear-gradient(135deg, #00B97C 0%, #4CAF50 50%, #00B97C 100%);
  background-size: 200% 200%;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.enhanced-refresh-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.enhanced-refresh-btn:hover::before {
  left: 100%;
}

.enhanced-refresh-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  background-position: 100% 100%;
}

.enhanced-refresh-btn:active {
  transform: scale(0.98);
}

.enhanced-refresh-icon {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.enhanced-refresh-btn:hover .enhanced-refresh-icon {
  transform: rotate(180deg);
}

.enhanced-refresh-btn.loading .enhanced-refresh-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ======== Enhanced Metric Cards ======== */
.enhanced-metric-card {
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  background: white;
  cursor: pointer;
}

.enhanced-metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.03), transparent);
  transition: left 0.6s ease;
  z-index: 1;
}

.enhanced-metric-card:hover::before {
  left: 100%;
}

.enhanced-metric-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #10b981;
}

.enhanced-metric-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  opacity: 1;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.enhanced-metric-card:hover .enhanced-metric-bg {
  opacity: 0.7;
}

.enhanced-metric-content {
  position: relative;
  z-index: 1;
}

/* Tooltip styles */
.enhanced-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: #064e3b;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.enhanced-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #064e3b;
}

.enhanced-refresh-btn:hover .enhanced-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-12px);
}

/* Metric card navigation tooltip */
.metric-tooltip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 10;
}

.enhanced-metric-card:hover .metric-tooltip {
  opacity: 1;
}
`;

// Inject styles
if (!document.querySelector('#enhanced-overview-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'enhanced-overview-styles';
  styleElement.textContent = enhancedStyles;
  document.head.appendChild(styleElement);
}

export default function OverviewTab({ loading }) {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [filters, setFilters] = useState({
    status: "All Status",
    category: "All Categories", 
    location: "All Locations",
    dateFrom: "",
    dateTo: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Import metric card images
  const metricImages = {
    total: '/src/assets/images/MetricCardTotal.png',
    active: '/src/assets/images/MetricCardActive.png',
    maintenance: '/src/assets/images/MetricCardMaintenance.jpeg',
    unassigned: '/src/assets/images/MetricCardUnassigned.png'
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, filters, searchQuery]);

  const fetchAssets = async () => {
    setIsRefreshing(true);
    try {
      const assetsData = await mockAssetService.getAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const applyFilters = () => {
    setIsFiltering(true);
    
    setTimeout(() => {
      let filtered = assets;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filtered = filtered.filter(asset =>
          asset.id.toLowerCase().includes(searchLower) ||
          asset.type.toLowerCase().includes(searchLower) ||
          asset.location.toLowerCase().includes(searchLower) ||
          asset.personnel.toLowerCase().includes(searchLower) ||
          (asset.capacity && asset.capacity.toLowerCase().includes(searchLower))
        );
      }

      if (filters.status !== "All Status") {
        filtered = filtered.filter(asset => asset.status === filters.status);
      }

      if (filters.category !== "All Categories") {
        filtered = filtered.filter(asset => asset.category === filters.category);
      }

      if (filters.location !== "All Locations") {
        filtered = filtered.filter(asset => asset.location === filters.location);
      }

      if (filters.dateFrom || filters.dateTo) {
        filtered = filtered.filter(asset => {
          if (!asset.lastMaintenance) return true;
          
          try {
            const assetDate = new Date(asset.lastMaintenance);
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            assetDate.setHours(0, 0, 0, 0);

            if (fromDate && toDate) {
              return assetDate >= fromDate && assetDate <= toDate;
            } else if (fromDate) {
              return assetDate >= fromDate;
            } else if (toDate) {
              return assetDate <= toDate;
            }
            return true;
          } catch (error) {
            console.error('Date parsing error:', error);
            return true;
          }
        });
      }

      setFilteredAssets(filtered);
      setIsFiltering(false);
    }, 300);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const clearAllFilters = () => {
    setFilters({
      status: "All Status",
      category: "All Categories", 
      location: "All Locations",
      dateFrom: "",
      dateTo: ""
    });
    setSearchQuery("");
  };

  const statusOptions = ["All Status", ...new Set(assets.map(asset => asset.status))];
  const categoryOptions = ["All Categories", ...new Set(assets.map(asset => asset.category))];
  const locationOptions = ["All Locations", ...new Set(assets.map(asset => asset.location))];

  const activeAssets = assets.filter(a => a.status === 'Operational').length;
  const underRepair = assets.filter(a => a.status === 'Under Repair').length;
  const unassignedAssets = assets.filter(a => a.status === 'Unassigned').length;

  const hasActiveFilters = filters.status !== "All Status" || 
                          filters.category !== "All Categories" || 
                          filters.location !== "All Locations" || 
                          filters.dateFrom || 
                          filters.dateTo || 
                          searchQuery;

  // Metric card navigation handlers
  const handleTotalAssetsClick = () => {
    // Navigate to main asset registry
    navigate('/logistics/asset-registry');
  };

  const handleActiveAssetsClick = () => {
    navigate('/logistics/assets/operational');
  };

  const handleUnderRepairClick = () => {
    navigate('/logistics/assets/under-repair');
  };

  const handleUnassignedClick = () => {
    navigate('/logistics/assets/standby');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 registry-header">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-green-100 rounded-xl registry-header-icon">
                <ClipboardClock className="h-8 w-8 sm:h-10 sm:w-10 text-green-800" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold text-green-900 mb-1">Asset Registry</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage and track all emergency response assets efficiently in the asset registry
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <span className="text-green-900 text-sm font-medium">
                {filteredAssets.length} of {assets.length}
              </span>
            </div>
            
            {/* Enhanced Refresh Button */}
            <div className="relative">
              <button
                onClick={fetchAssets}
                disabled={loading || isRefreshing}
                className={`enhanced-refresh-btn flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition text-sm ${
                  isRefreshing ? 'loading' : ''
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`enhanced-refresh-icon h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <div className="enhanced-tooltip">Refresh Data</div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Enhanced Search Bar */}
            <div className="flex-1 enhanced-search-container">
              <input
                type="text"
                placeholder="Search assets by ID, type, location, or personnel..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="enhanced-search-input w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none text-sm bg-white transition-colors"
              />
              <div className="enhanced-search-glow"></div>
              <Search className="enhanced-search-icon absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium enhanced-dropdown-select"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Enhanced Desktop Dropdowns with Hover Expansion */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Status Dropdown */}
              <div className="enhanced-dropdown">
                <div className="enhanced-dropdown-select px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px] cursor-pointer flex items-center justify-between">
                  <span>{filters.status}</span>
                  <ChevronDown className="enhanced-dropdown-caret h-4 w-4 text-gray-400 transition-transform" />
                </div>
                
                <div className="enhanced-dropdown-menu">
                  {statusOptions.map(status => (
                    <div
                      key={status}
                      onClick={() => handleFiltersChange({...filters, status})}
                      className="enhanced-dropdown-option"
                    >
                      {status}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="enhanced-dropdown">
                <div className="enhanced-dropdown-select px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px] cursor-pointer flex items-center justify-between">
                  <span>{filters.category}</span>
                  <ChevronDown className="enhanced-dropdown-caret h-4 w-4 text-gray-400 transition-transform" />
                </div>
                
                <div className="enhanced-dropdown-menu">
                  {categoryOptions.map(category => (
                    <div
                      key={category}
                      onClick={() => handleFiltersChange({...filters, category})}
                      className="enhanced-dropdown-option"
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Dropdown */}
              <div className="enhanced-dropdown">
                <div className="enhanced-dropdown-select px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px] cursor-pointer flex items-center justify-between">
                  <span>{filters.location}</span>
                  <ChevronDown className="enhanced-dropdown-caret h-4 w-4 text-gray-400 transition-transform" />
                </div>
                
                <div className="enhanced-dropdown-menu">
                  {locationOptions.map(location => (
                    <div
                      key={location}
                      onClick={() => handleFiltersChange({...filters, location})}
                      className="enhanced-dropdown-option"
                    >
                      {location}
                    </div>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-2.5 text-gray-600 hover:text-gray-800 transition-colors text-sm enhanced-dropdown-select"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => handleFiltersChange({...filters, status: e.target.value})}
                  className="enhanced-dropdown-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none text-sm bg-white"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFiltersChange({...filters, category: e.target.value})}
                  className="enhanced-dropdown-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none text-sm bg-white"
                >
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={filters.location}
                  onChange={(e) => handleFiltersChange({...filters, location: e.target.value})}
                  className="enhanced-dropdown-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none text-sm bg-white"
                >
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium enhanced-dropdown-select"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Metric Cards with Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assets */}
        <div 
          className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden"
          onClick={handleTotalAssetsClick}
        >
          <div 
            className="enhanced-metric-bg"
            style={{ backgroundImage: `url(${metricImages.total})` }}
          ></div>
          <div className="metric-tooltip">View All Assets</div>
          
          <div className="enhanced-metric-content flex items-center justify-between mb-4">
            <div className="p-2 sm:p-3 bg-black/40 rounded-lg backdrop-blur-sm z-10">
              <Boxes className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="text-right relative">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg -m-2 z-0"></div>
              <div className="relative z-10">
                <p className="text-xs sm:text-xl font-medium text-green-600 mb-1">Total Assets</p>
                <p className="text-3xl sm:text-8xl font-bold text-white">{assets.length}</p>
              </div>
            </div>
          </div>
          <div className="enhanced-metric-content bg-black/40 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
            <p className="text-xs text-white font-medium">All registered assets</p>
          </div>
        </div>

        {/* Active / Deployed */}
        <div 
          className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden"
          onClick={handleActiveAssetsClick}
        >
          <div 
            className="enhanced-metric-bg"
            style={{ backgroundImage: `url(${metricImages.active})` }}
          ></div>
          <div className="metric-tooltip">View Operational Assets</div>
          
          <div className="enhanced-metric-content flex items-center justify-between mb-4">
            <div className="p-2 sm:p-3 bg-black/40 rounded-lg backdrop-blur-sm z-10">
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="text-right relative">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg -m-2 z-0"></div>
              <div className="relative z-10">
                <p className="text-xs sm:text-xl font-medium text-green-600 mb-1">Operational</p>
                <p className="text-3xl sm:text-8xl font-bold text-white">{activeAssets}</p>
              </div>
            </div>
          </div>
          <div className="enhanced-metric-content bg-black/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
            <p className="text-xs text-white font-medium">Currently deployed</p>
          </div>
        </div>

        {/* Under Repair */}
        <div 
          className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden"
          onClick={handleUnderRepairClick}
        >
          <div 
            className="enhanced-metric-bg"
            style={{ backgroundImage: `url(${metricImages.maintenance})` }}
          ></div>
          <div className="metric-tooltip">View Assets Under Repair</div>
          
          <div className="enhanced-metric-content flex items-center justify-between mb-4">
            <div className="p-2 sm:p-3 bg-black/40 rounded-lg backdrop-blur-sm z-10">
              <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="text-right relative">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg -m-2 z-0"></div>
              <div className="relative z-10">
                <p className="text-xs sm:text-xl font-medium text-green-600 mb-1">Under Repair</p>
                <p className="text-3xl sm:text-8xl font-bold text-white">{underRepair}</p>
              </div>
            </div>
          </div>
          <div className="enhanced-metric-content bg-black/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
            <p className="text-xs text-white font-medium">Maintenance needed</p>
          </div>
        </div>

        {/* Unassigned */}
        <div 
          className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden"
          onClick={handleUnassignedClick}
        >
          <div 
            className="enhanced-metric-bg"
            style={{ backgroundImage: `url(${metricImages.unassigned})` }}
          ></div>
          <div className="metric-tooltip">View Unassigned Assets</div>
          
          <div className="enhanced-metric-content flex items-center justify-between mb-4">
            <div className="p-2 sm:p-3 bg-black/40 rounded-lg backdrop-blur-sm z-10">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="text-right relative">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg -m-2 z-0"></div>
              <div className="relative z-10">
                <p className="text-xs sm:text-xl font-medium text-green-600 mb-1">Unassigned</p>
                <p className="text-3xl sm:text-8xl font-bold text-white">{unassignedAssets}</p>
              </div>
            </div>
          </div>
          <div className="enhanced-metric-content bg-black/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
            <p className="text-xs text-white font-medium">Available for assignment</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isFiltering && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-green-700">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="font-medium">Applying filters...</span>
          </div>
        </div>
      )}

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <AssetTable 
          assets={filteredAssets} 
          loading={loading || isFiltering}
          onRefresh={fetchAssets}
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 text-sm sm:text-base">Active Filters</h4>
              <p className="text-yellow-700 text-xs sm:text-sm mt-1">
                {filteredAssets.length === 0 
                  ? "No assets match your current filters." 
                  : `Showing ${filteredAssets.length} filtered assets.`
                }
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 rounded-lg transition-colors text-sm font-medium whitespace-nowrap enhanced-dropdown-select"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}