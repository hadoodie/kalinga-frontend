//src/compoents/logistics/AssetRegis.jsx

import { useState, useEffect } from "react";
import { LayoutDashboard, CalendarClock, ChartNoAxesCombined } from "lucide-react";
import OverviewTab from "../../components/logistics/registry/overview/OverviewTab";
import MaintenanceTab from "../../components/logistics/registry/maintenance/MaintenanceTab";
import ReportsTab from "../../components/logistics/registry/reports/ReportsTab";
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
        filters.category === "All Categories" || asset.category === filters.category;
      const matchesLocation =
        filters.location === "All Locations" || asset.location === filters.location;

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
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-[#F8FBF8] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-col items-center mt-6">
          <ul className="flex flex-wrap justify-center gap-8 sm:gap-10 relative">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ["--i"]: tab.colors[0],
                  ["--j"]: tab.colors[1],
                  borderRadius: "50px",
                  width: activeTab === tab.id ? "160px" : "60px",
                  height: "60px",
                  background: activeTab === tab.id 
                    ? `linear-gradient(135deg, ${tab.colors[0]}, ${tab.colors[1]})`
                    : "white",
                  color: activeTab === tab.id ? "white" : "#555",
                  border: activeTab === tab.id 
                    ? "2px solid transparent"
                    : "2px solid #d6d6d6",
                  boxShadow: activeTab === tab.id 
                    ? "0 6px 20px rgba(0, 180, 120, 0.3)"
                    : "0 4px 15px rgba(0,0,0,0.1)",
                }}
                className={`tab-item flex justify-center items-center cursor-pointer transition-all duration-500 relative hover:scale-105`}
              >
                {/* Icon */}
                <span
                  className={`absolute transition-all duration-500 ${
                    activeTab === tab.id ? "opacity-0 scale-0" : "opacity-100 scale-100"
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Label */}
                <span
                  className={`title absolute text-[0.95rem] font-semibold transition-all duration-500 uppercase ${
                    activeTab === tab.id ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                >
                  {tab.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Tab Content */}
          <div className="w-full mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-md border border-gray-200/30a">
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
      </div>
    </div>
  );
}
