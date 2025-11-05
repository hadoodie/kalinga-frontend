// src/pages-logistics/AssetRegistry.jsx 
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import MetricCards from "../../components/logistics/registry/overview/MetricCards";
import RegistryTabs from "../../components/logistics/registry/RegistryTabs";
import { mockAssetService } from "../../services/mockAssetService";

export default function AssetRegistry() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState({
    total_assets: 0,
    active_assets: 0,
    vehicles_under_repair: 0,
    assets_unassigned: 0,
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
    dateTo: "",
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
        mockAssetService.getAssets(),
      ]);
      setMetrics(metricsData);
      setAssets(assetsData);
      setFilteredAssets(assetsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => fetchData();

  const filterAssets = (assets, filters, searchQuery) => {
    return assets.filter((asset) => {
      const matchesSearch =
        searchQuery === "" ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.personnel &&
          asset.personnel.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filters.status === "All Status" || asset.status === filters.status;
      const matchesCategory =
        filters.category === "All Categories" ||
        asset.category === filters.category;
      const matchesLocation =
        filters.location === "All Locations" ||
        asset.location === filters.location;

      const matchesDateRange = () => {
        if (!filters.dateFrom && !filters.dateTo) return true;
        if (!asset.lastMaintenance) return false;

        const assetDate = new Date(asset.lastMaintenance);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && toDate)
          return assetDate >= fromDate && assetDate <= toDate;
        if (fromDate) return assetDate >= fromDate;
        if (toDate) return assetDate <= toDate;
        return true;
      };

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLocation &&
        matchesDateRange()
      );
    });
  };

  const handleFiltersChange = (newFilters) => setFilters(newFilters);
  const handleSearchChange = (query) => setSearchQuery(query);

  return (
    <div className="min-h-screen bg-[#F8FBF8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
      <h1 className="text-4xl font-extrabold text-green-9000">Asset Registry</h1> {/* Moved -ml-2 here */}
              <p className="text-gray-600 mt-1 text-sm">
                Manage and track all emergency response assets efficiently
              </p>
            </div>

            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center px-5 py-2.5 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              {loading ? "Loading..." : "Refresh Data"}
            </button>
          </div>
        </header>

        {/* Collapsible Metrics */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-green-900">Dashboard Overview</h2>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md transition text-sm font-medium"
            >
              {showMetrics ? "Hide Summary" : "Show Summary"}
            </button>
          </div>

          {showMetrics && (
            <div className="transition-all duration-300 ease-in-out">
              <MetricCards metrics={metrics} loading={loading} />
            </div>
          )}
        </section>

        {/* Tabs Section */}
        <section className="bg-white rounded-lg shadow-md border border-gray-200">
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