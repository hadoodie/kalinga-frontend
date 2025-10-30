// src/components/logistics/registry/MaintenanceTab.jsx - RESPONSIVE VERSION
import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle, Wrench } from "lucide-react";
import MaintenanceCalendar from "./MaintenanceCalendar";
import ServiceHistory from "./ServiceHistory";
import MaintenanceSchedule from "./MaintenanceSchedule";
import { mockAssetService } from "../../../services/mockAssetService";
import ScheduleMaintenanceDrawer from "./ScheduleMaintenanceDrawer";

export default function MaintenanceTab({ loading }) {
  const [activeView, setActiveView] = useState("calendar"); // calendar, history, schedule
  const [maintenanceData, setMaintenanceData] = useState({
    upcoming: [],
    overdue: [],
    completed: []
  });
  const [stats, setStats] = useState({
    totalScheduled: 0,
    overdue: 0,
    completedThisMonth: 0
  });
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const data = await mockAssetService.getMaintenanceData();
      setMaintenanceData(data);
      setStats({
        totalScheduled: data.upcoming.length + data.overdue.length,
        overdue: data.overdue.length,
        completedThisMonth: data.completed.filter(item => {
          const completedDate = new Date(item.completedDate);
          const now = new Date();
          return completedDate.getMonth() === now.getMonth() && 
                 completedDate.getFullYear() === now.getFullYear();
        }).length
      });
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    }
  };

  const handleScheduleMaintenance = () => {
    setIsScheduleDrawerOpen(true);
  };

  const handleMaintenanceScheduled = () => {
    setIsScheduleDrawerOpen(false);
    fetchMaintenanceData(); // Refresh data
  };

  const views = [
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "history", label: "Service History", icon: "📋" },
    { id: "schedule", label: "Schedule", icon: "⏰" }
  ];

  const renderViewContent = () => {
    switch (activeView) {
      case "calendar":
        return <MaintenanceCalendar maintenanceData={maintenanceData} />;
      case "history":
        return <ServiceHistory maintenanceData={maintenanceData} />;
      case "schedule":
        return <MaintenanceSchedule onScheduleUpdate={fetchMaintenanceData} />;
      default:
        return <MaintenanceCalendar maintenanceData={maintenanceData} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Maintenance Management</h2>
          <p className="text-gray-600 text-xs sm:text-sm">Track and schedule asset maintenance</p>
        </div>
        <button 
          onClick={handleScheduleMaintenance}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm sm:text-base">Schedule Maintenance</span>
        </button>
      </div>

      {/* Maintenance Stats - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalScheduled}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completed This Month</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completedThisMonth}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs - Responsive */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto -mb-px">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-initial justify-center
                  ${
                    activeView === view.id
                      ? "border-yellow-500 text-yellow-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="text-base">{view.icon}</span>
                <span className="hidden xs:inline">{view.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* View Content - Responsive */}
        <div className="p-3 sm:p-4 lg:p-6">
          {renderViewContent()}
        </div>
      </div>

      {/* Schedule Maintenance Drawer */}
      <ScheduleMaintenanceDrawer
        isOpen={isScheduleDrawerOpen}
        onClose={() => setIsScheduleDrawerOpen(false)}
        onSchedule={handleMaintenanceScheduled}
      />
    </div>
  );
}