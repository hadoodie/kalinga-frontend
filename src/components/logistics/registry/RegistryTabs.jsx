// src/components/logistics/registry/RegistryTabs.jsx
import OverviewTab from "./overview/OverviewTab";
import MaintenanceTab from "./maintenance/MaintenanceTab";
import ReportsTab from "./reports/ReportsTab";

export default function RegistryTabs({ 
  activeTab, 
  onTabChange, 
  loading, 
  assets, 
  onRefresh,
  metrics 
}) {
  const tabs = [
    { id: "overview", label: "Overview", component: OverviewTab },
    { id: "maintenance", label: "Maintenance", component: MaintenanceTab },
    { id: "reports", label: "Reports", component: ReportsTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {ActiveComponent && (
          <ActiveComponent 
            loading={loading} 
            assets={assets} 
            onRefresh={onRefresh}
            metrics={metrics}
          />
        )}
      </div>
    </div>
  );
}