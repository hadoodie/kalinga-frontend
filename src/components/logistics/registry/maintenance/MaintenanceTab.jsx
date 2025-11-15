// src/components/logistics/registry/maintenance/MaintenanceTab.jsx
import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle, Wrench, RefreshCw } from "lucide-react";
import MaintenanceCalendar from "./MaintenanceCalendar";
import ServiceHistory from "./ServiceHistory";
import MaintenanceSchedule from "./MaintenanceSchedule";
import ScheduleMaintenanceDrawer from "./ScheduleMaintenanceDrawer";
import { maintenanceCalendarService } from "../../../../services/maintenanceCalendarService";

export default function MaintenanceTab({ loading }) {
  const [activeView, setActiveView] = useState("calendar");
  const [maintenanceData, setMaintenanceData] = useState({
    upcoming: [],
    overdue: [],
    completed: []
  });
  const [stats, setStats] = useState({
    totalScheduled: 0,
    overdue: 0,
    completedThisMonth: 0,
    inProgress: 0,
    thisMonthCount: 0
  });
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    setRefreshing(true);
    try {
      const data = await maintenanceCalendarService.getCalendarData();
      console.log('Fetched maintenance data:', data);
      setMaintenanceData(data);
      updateStats(data);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // FIXED: Moved inside the component
  const updateStats = (data) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fix completed this month calculation
    const completedThisMonth = data.completed?.filter(item => {
      if (!item.completedDate) return false;
      try {
        const completedDate = new Date(item.completedDate);
        return completedDate.getMonth() === currentMonth && 
               completedDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    }).length || 0;

    // Fix in progress calculation
    const inProgress = data.upcoming?.filter(item => item.status === 'in-progress').length || 0;

    // Fix this month calculation - count scheduled maintenance for current month
    const thisMonthCount = [...(data.upcoming || []), ...(data.overdue || [])].filter(item => {
      try {
        const scheduledDate = new Date(item.scheduledDate);
        return scheduledDate.getMonth() === currentMonth && 
               scheduledDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    }).length;

    setStats({
      totalScheduled: (data.upcoming?.length || 0) + (data.overdue?.length || 0),
      overdue: data.overdue?.length || 0,
      completedThisMonth,
      inProgress,
      thisMonthCount
    });
  };

  const handleScheduleMaintenance = () => {
    setIsScheduleDrawerOpen(true);
  };

  const handleMaintenanceScheduled = () => {
    setIsScheduleDrawerOpen(false);
    fetchMaintenanceData();
  };

  const handleQuickAction = async (action, maintenanceId, data) => {
    try {
      switch (action) {
        case 'complete':
          await maintenanceCalendarService.updateMaintenanceStatus(maintenanceId, 'completed', data.notes);
          break;
        case 'start':
          await maintenanceCalendarService.updateMaintenanceStatus(maintenanceId, 'in-progress', data.notes);
          break;
        case 'reschedule':
          await maintenanceCalendarService.rescheduleMaintenance(maintenanceId, data.newDate);
          break;
        default:
          break;
      }
      await fetchMaintenanceData();
    } catch (error) {
      console.error('Error performing quick action:', error);
    }
  };

  const views = [
    { 
      id: "calendar", 
      label: "Calendar", 
      //icon: "📅",
      description: "Visual schedule and maintenance planning"
    },
    { 
      id: "history", 
      label: "Service History", 
      //icon: "📋",
      description: "Past maintenance records and analytics"
    },
    { 
      id: "schedule", 
      label: "Schedule", 
      //icon: "⏰",
      description: "Upcoming maintenance timeline"
    }
  ];

  const renderViewContent = () => {
    const viewProps = {
      maintenanceData,
      onRefresh: fetchMaintenanceData,
      onQuickAction: handleQuickAction
    };

    switch (activeView) {
      case "calendar":
        return <MaintenanceCalendar {...viewProps} />;
      case "history":
        return <ServiceHistory {...viewProps} />;
      case "schedule":
        return <MaintenanceSchedule {...viewProps} />;
      default:
        return <MaintenanceCalendar {...viewProps} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg text-left sm:text-2xl font-bold text-green-900">Maintenance Management</h2>
          <p className="text-green-700 text-left text-xs sm:text-sm">
            Track, schedule, and manage asset maintenance operations
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Refresh Button */}
          <button 
            onClick={fetchMaintenanceData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          {/* Schedule Button */}
          <button 
            onClick={handleScheduleMaintenance}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition w-full sm:w-auto justify-center flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm sm:text-base">Schedule</span>
          </button>
        </div>
      </div>


      {/* Enhanced Maintenance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="h-8 w-8 sm:h-9 sm:w-9 text-green-800" />
            <div className="text-left">
              <p className="text-sm text-gray-600">Maintenance Task</p>
              <p className="text-lg font-semibold text-green-800 uppercase">Total Scheduled</p>
            </div>
          </div>
          <p className="text-4xl text-left sm:text-5xl font-bold text-green-800 mb-0">{stats.totalScheduled}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle className="h-8 w-8 sm:h-9 sm:w-9 text-red-600" />
            <div className="text-left">
              <p className="text-sm text-gray-600">Requires attention</p>
              <p className="text-lg font-semibold text-red-600 uppercase">Overdue</p>
            </div>
          </div>
          <p className="text-4xl text-left sm:text-5xl font-bold text-red-600">{stats.overdue}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-1">
            <Wrench className="h-8 w-8 sm:h-9 sm:w-9 text-green-800" />
            <div className="text-left">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-lg font-semibold text-green-800 uppercase">Active Work</p>
            </div>
          </div>
          <p className="text-4xl text-left sm:text-5xl font-bold text-green-800">{stats.inProgress}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle className="h-8 w-8 sm:h-9 sm:w-9 text-green-800" />
            <div className="text-left">
              <p className="text-sm text-gray-600">This month</p>
              <p className="text-lg font-semibold text-green-800 uppercase">Completed</p>
            </div>
          </div>
          <p className="text-4xl text-left sm:text-5xl font-bold text-green-800">{stats.completedThisMonth}</p>
        </div>
      </div>

      {/* Enhanced View Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b text-left border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {views.find(v => v.id === activeView)?.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {views.find(v => v.id === activeView)?.description}
              </p>
            </div>
            
            <nav className="flex mt-3 sm:mt-0">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`
                    px-4 py-2.5 font-medium text-sm transition-all duration-200
                    ${
                      activeView === view.id
                        ? "bg-green-800 text-white rounded-lg"
                        : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
                >
                  <span>{view.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* View Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {renderViewContent()}
        </div>
      </div>

      {/* Quick Actions Panel */}
      {stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Attention Required</h4>
                <p className="text-red-700 text-sm">
                  You have {stats.overdue} overdue maintenance tasks that need immediate attention.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('calendar')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              View Overdue
            </button>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Drawer */}
      <ScheduleMaintenanceDrawer
        isOpen={isScheduleDrawerOpen}
        onClose={() => setIsScheduleDrawerOpen(false)}
        onSchedule={handleMaintenanceScheduled}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}