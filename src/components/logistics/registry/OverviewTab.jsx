// src/components/logistics/registry/OverviewTab.jsx - FIXED FOR LOCAL STATE
import { useState, useEffect } from "react";
import AssetTable from "./AssetTable";
import FilterPanel from "./FilterPanel";
import { mockAssetService } from "../../../services/mockAssetService";

export default function OverviewTab({ loading }) {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [filters, setFilters] = useState({
    status: "All Status", // Match FilterPanel expected structure
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
        asset.personnel.toLowerCase().includes(searchLower)
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
// In your OverviewTab.jsx - fix the date filtering logic
// Replace the date range filter section with this:

// Date range filter - FIXED
if (filters.dateFrom || filters.dateTo) {
  filtered = filtered.filter(asset => {
    if (!asset.lastMaintenance) return true; // Don't filter out assets without maintenance dates
    
    try {
      const assetDate = new Date(asset.lastMaintenance);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

      // Reset time parts for accurate date comparison
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
      return true; // Don't filter out if date parsing fails
    }
  });
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Asset Inventory</h2>
        <div className="text-sm text-gray-500 whitespace-nowrap">
          Showing {filteredAssets.length} of {assets.length} assets
        </div>
      </div>

      {/* Filter Panel - Use correct prop names */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange} // Changed from onFilterChange
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        assets={assets}
      />

{/* Asset Table (centered alignment fix) */}
<div className="overflow-x-auto">
  <div className="min-w-full flex justify-center">
    <AssetTable 
      assets={filteredAssets} 
      loading={loading}
      onRefresh={fetchAssets}
    />
  </div>
</div>

    </div>
  );
}