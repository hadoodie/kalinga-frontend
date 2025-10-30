// src/pages-logistics/AssetRegistry.jsx - COMPLETE COMPONENT
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import MetricCards from "../../components/logistics/registry/MetricCards";
import RegistryTabs from "../../components/logistics/registry/RegistryTabs";
import { mockAssetService } from "../../services/mockAssetService";

export default function AssetRegistry() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState({
    total_assets: 0,
    active_assets: 0,
    vehicles_under_repair: 0,
    assets_unassigned: 0
  });
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "All Status",
    category: "All Categories",
    location: "All Locations", 
    dateFrom: "",
    dateTo: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Update filtered assets when assets, filters, or search change
  useEffect(() => {
    if (assets.length > 0) {
      const filtered = filterAssets(assets, filters, searchQuery);
      setFilteredAssets(filtered);
    }
  }, [assets, filters, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsData, assetsData] = await Promise.all([
        mockAssetService.getMetrics(),
        mockAssetService.getAssets()
      ]);
      setMetrics(metricsData);
      setAssets(assetsData);
      setFilteredAssets(assetsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
  };

  // Filter function for assets
  const filterAssets = (assets, filters, searchQuery) => {
    console.log("🔍 Filtering with:", { filters, searchQuery });

    return assets.filter(asset => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.personnel && asset.personnel.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus = filters.status === "All Status" || 
        asset.status === filters.status;

      // Category filter
      const matchesCategory = filters.category === "All Categories" || 
        asset.category === filters.category;

      // Location filter  
      const matchesLocation = filters.location === "All Locations" || 
        asset.location === filters.location;

      // Date range filter
      const matchesDateRange = () => {
        if (!filters.dateFrom && !filters.dateTo) return true;
        if (!asset.lastMaintenance) return false;
        
        try {
          const assetDate = new Date(asset.lastMaintenance);
          const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
          const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

          if (fromDate && toDate) {
            return assetDate >= fromDate && assetDate <= toDate;
          } else if (fromDate) {
            return assetDate >= fromDate;
          } else if (toDate) {
            return assetDate <= toDate;
          }
        } catch (error) {
          return true;
        }
        return true;
      };

      const result = matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesDateRange();
      
      if (result) {
        console.log("✅ INCLUDED Asset:", asset.id, {
          status: asset.status,
          category: asset.category,
          location: asset.location
        });
      }

      return result;
    });
  };

  const handleFiltersChange = (newFilters) => {
    console.log("🔄 Filters changed from:", filters, "to:", newFilters);
    setFilters(newFilters);
  };

  const handleSearchChange = (query) => {
    console.log("🔍 Search changed from:", searchQuery, "to:", query);
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-wrap justify-between items-center gap-3 p-4 bg-white rounded-xl shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asset Registry</h1>
            <p className="text-gray-600 mt-1">Manage and track all organizational assets</p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold rounded-lg shadow-md transition duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </header>

        {/* Collapsible Metrics */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-semibold"
            >
              {showMetrics ? 'Hide Summary' : 'Show Summary'}
            </button>
          </div>
          
          {showMetrics && (
            <MetricCards metrics={metrics} loading={loading} />
          )}
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-xl shadow-lg">
          <RegistryTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            loading={loading}
            assets={filteredAssets}
            allAssets={assets}
            onRefresh={refreshData}
            metrics={metrics}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </section>
      </div>
    </div>
  );
}