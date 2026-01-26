// src/components/logistics/AssetRegis.jsx

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarClock,
  ChartNoAxesCombined,
  RefreshCw,
  CircleAlert
} from "lucide-react";
import AssetRegistry from "./registry/overview/AssetRegistry.jsx";
import MaintenanceTab from "./registry/maintenance/MaintenanceTab";
import assetService from "@/services/assetService";

export default function AssetRegis() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState({
    total_assets: 0,
    operational_assets: 0,
    under_repair_assets: 0,
    standby_assets: 0,
    decommissioned_assets: 0
  });
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastRequestInfo, setLastRequestInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchData = async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    
    try {
      setError(null);
      setLastError(null);
      setLastRequestInfo({ timestamp: new Date().toISOString(), params: {} });
      const assetsData = await assetService.getAssets();
      setLastRequestInfo((p) => ({ ...p, success: true, receivedAt: new Date().toISOString() }));
      setAssets(assetsData);
      
      // Calculate metrics from assets data
      const total = assetsData.length;
      const operational = assetsData.filter(a => a.status === 'Operational').length;
      const underRepair = assetsData.filter(a => a.status === 'Under Repair').length;
      const standby = assetsData.filter(a => a.status === 'Standby').length;
      const decommissioned = assetsData.filter(a => a.status === 'Decommissioned').length;
      
      setMetrics({
        total_assets: total,
        operational_assets: operational,
        under_repair_assets: underRepair,
        standby_assets: standby,
        decommissioned_assets: decommissioned
      });
      
    } catch (e) {
      console.error('Error fetching assets:', e);

      // Build structured error info for debug panel
      const errInfo = {
        message: e?.message ?? String(e),
        isAxiosError: !!e?.isAxiosError,
        status: e?.response?.status ?? null,
        responseData: e?.response?.data ?? null,
        responseHeaders: e?.response?.headers ?? null,
        request: e?.request ?? null,
        config: e?.config ?? null,
        timestamp: new Date().toISOString(),
      };

      setLastError(errInfo);
      setError("Failed to load assets. Please try again.");
    } finally {
      if (loading) setLoading(false);
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 1000); // Show refresh animation
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const tabs = [
    {
      id: "overview",
      label: "Asset Registry",
      icon: <LayoutDashboard size={22} />,
      colors: ["#a8ff78", "#78ffd6"],
      component: AssetRegistry
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: <CalendarClock size={22} />,
      colors: ["#9cffb0", "#00b97c"],
      component: MaintenanceTab
    }
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-[#F8FBF8] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-4 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900">
              Asset Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Monitor and manage all emergency response assets
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </span>
            <span className="sm:hidden">
              {refreshing ? "..." : "Refresh"}
            </span>
          </button>
        </header>

        {/* Metrics Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-800">{metrics.total_assets}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Total Assets</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{metrics.operational_assets}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Operational</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{metrics.under_repair_assets}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Under Repair</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{metrics.standby_assets}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Standby</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-600">{metrics.decommissioned_assets}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Decommissioned</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <div className="flex justify-center items-center p-8 sm:p-12 bg-white rounded-xl shadow-lg mt-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-700 font-medium text-sm sm:text-base">Loading asset registry...</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Fetching assets and maintenance data</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-lg shadow-lg mt-6">
            <div className="flex items-start">
              <CircleAlert className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm sm:text-base">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setShowDebug((s) => !s)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {showDebug ? 'Hide Debug' : 'Show Debug'}
                  </button>
                </div>
                {showDebug && (
                  <div className="mt-4 bg-gray-100 p-3 rounded-md overflow-auto text-xs">
                    <strong className="block mb-2">Debug Info</strong>
                    <pre className="whitespace-pre-wrap max-h-56 overflow-auto">{JSON.stringify({ lastRequestInfo, lastError }, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs + Content */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 px-4 sm:px-6">
              <div className="flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-green-600 text-green-700 font-semibold"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.icon}</span>
                    <span className="text-sm sm:text-base font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="hidden sm:block h-2 w-2 rounded-full bg-green-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {ActiveComponent && (
                <ActiveComponent
                  loading={loading || refreshing}
                  assets={assets}
                  onRefresh={handleRefresh}
                  metrics={metrics}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}