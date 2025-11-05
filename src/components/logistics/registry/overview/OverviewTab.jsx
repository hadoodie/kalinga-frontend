// src/components/logistics/registry/overview/OverviewTab.jsx
import { useState, useEffect } from "react";
import AssetTable from "./AssetTable";
import FilterPanel from "./FilterPanel";
import { mockAssetService } from "../../../../services/mockAssetService";


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

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, filters, searchQuery]);

  const fetchAssets = async () => {
    try {
      const assetsData = await mockAssetService.getAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const applyFilters = () => {
    let filtered = assets;

    // Search filter
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

    // Date range filter
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

    // Handle advanced filter conditions (for future implementation)
    if (filters.maintenanceStatus === 'overdue') {
      filtered = filtered.filter(asset => {
        if (!asset.nextMaintenance) return false;
        const nextMaintenance = new Date(asset.nextMaintenance);
        return nextMaintenance < new Date();
      });
    }

    if (filters.personnel === 'unassigned') {
      filtered = filtered.filter(asset => !asset.personnel || asset.personnel.trim() === '');
    }

    if (filters.priority === 'high') {
      filtered = filtered.filter(asset => 
        asset.status === 'Under Repair' || 
        asset.condition === 'Poor' ||
        (asset.nextMaintenance && new Date(asset.nextMaintenance) < new Date())
      );
    }

    setFilteredAssets(filtered);
  };

  const handleFiltersChange = (newFilters) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const handleSearchChange = (query) => {
    console.log("Search changed:", query);
    setSearchQuery(query);
  };

  // Calculate quick stats
  const activeAssets = assets.filter(a => a.status === 'Active').length;
  const underRepair = assets.filter(a => a.status === 'Under Repair').length;
  const standbyAssets = assets.filter(a => a.status === 'Standby').length;
  
  // Calculate estimated total value (placeholder logic)
  const totalValue = assets.reduce((total, asset) => {
    const baseValue = {
      'Ambulance': 250000,
      'Defibrillator': 3000,
      'Stretcher': 1500,
      'Mobile Clinic': 500000,
      'Fire Truck': 750000,
      'Generator': 15000
    }[asset.type] || 10000;
    
    return total + baseValue;
  }, 0);

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header Section - Green Theme */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-green-900">Asset Inventory</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage and track all emergency response assets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-green-900 bg-green-100 px-3 py-1 rounded-full">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
          <button
            onClick={fetchAssets}
            className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        assets={assets}
      />

      {/* Asset Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <AssetTable 
              assets={filteredAssets} 
              loading={loading}
              onRefresh={fetchAssets}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="font-semibold text-green-900">Active Assets</div>
          <div className="text-green-700 font-bold text-2xl mt-1">
            {activeAssets}
          </div>
          <div className="text-green-600 text-xs mt-1">
            {((activeAssets / assets.length) * 100).toFixed(1)}% of total
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="font-semibold text-yellow-900">Under Repair</div>
          <div className="text-yellow-700 font-bold text-2xl mt-1">
            {underRepair}
          </div>
          <div className="text-yellow-600 text-xs mt-1">
            {((underRepair / assets.length) * 100).toFixed(1)}% of total
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="font-semibold text-gray-900">On Standby</div>
          <div className="text-gray-700 font-bold text-2xl mt-1">
            {standbyAssets}
          </div>
          <div className="text-gray-600 text-xs mt-1">
            {((standbyAssets / assets.length) * 100).toFixed(1)}% of total
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="font-semibold text-blue-900">Total Value</div>
          <div className="text-blue-700 font-bold text-2xl mt-1">
            ${(totalValue / 1000000).toFixed(1)}M
          </div>
          <div className="text-blue-600 text-xs mt-1">
            Estimated equipment value
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {(filters.status !== "All Status" || filters.category !== "All Categories" || filters.location !== "All Locations" || searchQuery) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-yellow-900">Active Filters</h4>
              <p className="text-yellow-700 text-sm">
                Viewing filtered results. 
                {filteredAssets.length === 0 && " No assets match your current filters."}
              </p>
            </div>
            <button
              onClick={() => {
                setFilters({
                  status: "All Status",
                  category: "All Categories", 
                  location: "All Locations",
                  dateFrom: "",
                  dateTo: ""
                });
                setSearchQuery("");
              }}
              className="px-3 py-1 bg-yellow-500 text-yellow-900 rounded text-sm hover:bg-yellow-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}