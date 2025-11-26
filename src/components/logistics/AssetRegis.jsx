
// src/components/logistics/AssetRegis.jsx

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarClock,
  ChartNoAxesCombined,
  RefreshCw,
  CircleAlert
} from "lucide-react";
import OverviewTab from "./registry/overview/OverviewTab";
import MaintenanceTab from "./registry/maintenance/MaintenanceTab";
import ReportsTab from "./registry/reports/ReportsTab";
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
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: "All Status",
    category: "All Categories",
    location: "All Locations",
    dateFrom: "",
    dateTo: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filterAssets = (assetsArr, f, q) =>
    assetsArr.filter((asset) => {
      const ql = q.toLowerCase();
      const matchesSearch =
        q === "" ||
        asset.id.toLowerCase().includes(ql) ||
        asset.type.toLowerCase().includes(ql) ||
        asset.location.toLowerCase().includes(ql) ||
        (asset.personnel && asset.personnel.toLowerCase().includes(ql));

      const matchesStatus = f.status === "All Status" || asset.status === f.status;
      const matchesCategory =
        f.category === "All Categories" || asset.category === f.category;
      const matchesLocation =
        f.location === "All Locations" || asset.location === f.location;

      const matchesDateRange = () => {
        if (!f.dateFrom && !f.dateTo) return true;
        if (!asset.lastMaintenance) return false;
        const d = new Date(asset.lastMaintenance);
        const from = f.dateFrom ? new Date(f.dateFrom) : null;
        const to = f.dateTo ? new Date(f.dateTo) : null;
        if (from && to) return d >= from && d <= to;
        if (from) return d >= from;
        if (to) return d <= to;
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, assetsData] = await Promise.all([
        mockAssetService.getMetrics(),
        mockAssetService.getAssets()
      ]);
      setMetrics(metricsData);
      setAssets(assetsData);
      setFilteredAssets(filterAssets(assetsData, filters, searchQuery));
    } catch (e) {
      console.error(e);
      setError("Failed to load assets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (assets.length) {
      setFilteredAssets(filterAssets(assets, filters, searchQuery));
    }
  }, [assets, filters, searchQuery]);

  const handleFiltersChange = (nf) => setFilters(nf);
  const handleSearchChange = (q) => setSearchQuery(q);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard size={22} />,
      colors: ["#a8ff78", "#78ffd6"],
      component: OverviewTab
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: <CalendarClock size={22} />,
      colors: ["#9cffb0", "#00b97c"],
      component: MaintenanceTab
    },
    {
      id: "reports",
      label: "Reports",
      icon: <ChartNoAxesCombined size={22} />,
      colors: ["#b9ff9c", "#00d48c"],
      component: ReportsTab
    }
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-[#F8FBF8] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-900">
            Asset Registry
          </h1>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold rounded-lg shadow-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {/* Loading */}
        {loading && (
            <div className="flex justify-center items-center p-8 bg-white rounded-xl shadow-lg mt-4">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading assets...</p>
              </div>
            </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg mt-4">
            <div className="flex items-center">
              <CircleAlert className="text-red-500 mr-3" size={24} />
              <div>
                <p className="text-red-800 font-medium">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs + Content */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            {/* Simple Horizontal Tabs */}
            <div className="border-b border-none">
              <ul className="flex gap-8">
                {tabs.map((tab) => (
                  <li
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-2 cursor-pointer transition-all duration-300 ${
                      activeTab === tab.id
                        ? "text-yellow-600 font-semibold border-b-2 border-yellow-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full mt-4 p-2 rounded-2xl">
              {ActiveComponent && (
                <ActiveComponent
                  loading={loading}
                  assets={filteredAssets}
                  onRefresh={fetchData}
                  metrics={metrics}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}