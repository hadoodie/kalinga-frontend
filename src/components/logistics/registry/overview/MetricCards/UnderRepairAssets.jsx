// src/components/logistics/registry/overview/MetricCards/UnderRepairAssets.jsx
import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, RefreshCw, Boxes, Truck, Wrench, Users, ChevronDown } from "lucide-react";
import AssetTable from "../AssetTable";
import { useAssets } from "../../../../../services/mockAssetService";
import { useNavigate } from 'react-router-dom';

// Import metric card images
const metricImages = {
  total: '/src/assets/images/MetricCardTotal.png',
  active: '/src/assets/images/MetricCardActive.png',
  maintenance: '/src/assets/images/MetricCardMaintenance.jpeg',
  unassigned: '/src/assets/images/MetricCardUnassigned.png'
};

export default function UnderRepairAssets() {
  const { assets, loading, refresh } = useAssets();
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "All Categories",
    location: "All Locations"
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // ✅ FIX: Memoize underRepairAssets to prevent infinite update loops
  const underRepairAssets = useMemo(
    () => assets.filter(asset => asset.status === 'Under Repair'),
    [assets]
  );

  useEffect(() => {
    applyFilters();
  }, [underRepairAssets, filters, searchQuery]);

  const applyFilters = () => {
    let filtered = underRepairAssets;

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

    if (filters.category !== "All Categories") {
      filtered = filtered.filter(asset => asset.category === filters.category);
    }

    if (filters.location !== "All Locations") {
      filtered = filtered.filter(asset => asset.location === filters.location);
    }

    setFilteredAssets(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({
      category: "All Categories", 
      location: "All Locations"
    });
    setSearchQuery("");
  };

  const categoryOptions = ["All Categories", ...new Set(underRepairAssets.map(asset => asset.category))];
  const locationOptions = ["All Locations", ...new Set(underRepairAssets.map(asset => asset.location))];

  const hasActiveFilters = filters.category !== "All Categories" || 
                          filters.location !== "All Locations" || 
                          searchQuery;

  // Get counts for metric cards
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'Operational').length;
  const underRepairCount = underRepairAssets.length;
  const unassignedAssets = assets.filter(a => a.status === 'Unassigned').length;

  // Metric card navigation handlers
  const handleTotalAssetsClick = () => {
    navigate('/logistics/asset-registry');
  };

  const handleActiveAssetsClick = () => {
    navigate('/logistics/assets/operational');
  };

  const handleUnderRepairClick = () => {
    // Already on under repair page
  };
   const handleUnassignedClick = () => {
    navigate('/logistics/assets/standby');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-900">Assets Under Repair</h1>
          <p className="text-gray-600 mt-2">Assets currently undergoing maintenance</p>
        </div>

        {/* Enhanced Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Total Assets */}
          <div 
            className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden cursor-pointer"
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
                  <p className="text-3xl sm:text-8xl font-bold text-white">{totalAssets}</p>
                </div>
              </div>
            </div>
            <div className="enhanced-metric-content bg-white/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
              <p className="text-xs text-white font-medium">All registered assets</p>
            </div>
          </div>

          {/* Active / Operational */}
          <div 
            className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden cursor-pointer"
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
            <div className="enhanced-metric-content bg-white/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
              <p className="text-xs text-white font-medium">Currently deployed</p>
            </div>
          </div>

          {/* Under Repair */}
          <div 
            className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden cursor-pointer border-2 border-green-500"
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
                  <p className="text-xs sm:text-xl font-medium text-green-600 mb-1">Repair</p>
                  <p className="text-3xl sm:text-8xl font-bold text-white">{underRepairCount}</p>
                </div>
              </div>
            </div>
            <div className="enhanced-metric-content bg-white/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
              <p className="text-xs text-white font-medium">Maintenance needed</p>
            </div>
          </div>

          {/* Unassigned */}
          <div 
            className="enhanced-metric-card rounded-xl p-4 sm:p-6 aspect-square flex flex-col justify-between relative overflow-hidden cursor-pointer"
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
            <div className="enhanced-metric-content bg-white/20 rounded-lg p-2 sm:p-3 mt-auto backdrop-blur-sm">
              <p className="text-xs text-white font-medium">Available for assignment</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Enhanced Search Bar */}
            <div className="flex-1 enhanced-search-container">
              <input
                type="text"
                placeholder="Search assets under repair by ID, type, location, or personnel..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="enhanced-search-input w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none text-sm bg-white transition-colors"
              />
              <div className="enhanced-search-glow"></div>
              <Search className="enhanced-search-icon absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Enhanced Desktop Dropdowns */}
            <div className="flex items-center gap-2">
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

              {/* Enhanced Refresh Button */}
              <div className="relative">
                <button
                  onClick={handleRefresh}
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

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-yellow-800 text-sm font-medium">
                    Showing {filteredAssets.length} of {underRepairAssets.length} assets under repair
                  </span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        <AssetTable 
          assets={filteredAssets}
          loading={loading || isRefreshing}
          onRefresh={handleRefresh}
          filters={{ status: 'Under Repair' }}
        />
      </div>
    </div>
  );
}
