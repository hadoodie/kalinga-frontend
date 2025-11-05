// src/components/logistics/registry/maintenance/MaintenanceCalendar.jsx
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Info, Edit, RefreshCw } from "lucide-react";
import { maintenanceCalendarService, assetTypeIcons, priorityColors } from "../../../../services/maintenanceCalendarService";
import ScheduleMaintenanceDrawer from "./ScheduleMaintenanceDrawer"; 
import CalendarFilterPanel from "./CalendarFilterPanel"; // Make sure to import this

const MaintenanceCalendar = ({ maintenanceData, onRefresh, onQuickAction }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showTooltip, setShowTooltip] = useState({ visible: false, x: 0, y: 0, item: null });
  const [refreshing, setRefreshing] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false); 
  const [editingMaintenance, setEditingMaintenance] = useState(null); 
  
  // ADD filter state - moved inside component
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assetType: 'all',
    technician: 'all'
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Memoized calendar data calculations
  const monthData = useMonthData(currentYear, currentMonth);
  const monthNames = getMonthNames();
  const weekdayNames = getWeekdayNames();

  // ADD THIS FUNCTION - Handle Edit Maintenance
  const handleEditMaintenance = (maintenance) => {
    setEditingMaintenance(maintenance);
    setIsEditDrawerOpen(true);
    setSelectedMaintenance(null); // Close detail modal
  };

  // ADD THIS FUNCTION - Handle Maintenance Updated
  const handleMaintenanceUpdated = () => {
    setIsEditDrawerOpen(false);
    setEditingMaintenance(null);
    if (onRefresh) {
      onRefresh(); // Refresh data
    }
  };

  const fetchMaintenanceData = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  // Navigation functions
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ADD this function to filter maintenance items - moved inside component
  const getFilteredMaintenanceForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Combine all maintenance arrays and filter by date
    const allMaintenance = [
      ...(maintenanceData.upcoming || []),
      ...(maintenanceData.overdue || []),
      ...(maintenanceData.completed || [])
    ].filter(item => item.scheduledDate === dateStr);

    // Apply filters
    return allMaintenance.filter(item => {
      if (filters.status !== 'all') {
        if (filters.status === 'overdue' && !item.isOverdue) return false;
        if (filters.status === 'scheduled' && item.isOverdue) return false;
        if (filters.status === 'completed' && item.status !== 'completed') return false;
      }
      
      if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
      if (filters.assetType !== 'all' && item.assetType !== filters.assetType) return false;
      if (filters.technician !== 'all' && item.technician !== filters.technician) return false;
      
      return true;
    });
  };

  // Get maintenance for specific date
  const getMaintenanceForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Combine all maintenance arrays and filter by date
    const allMaintenance = [
      ...(maintenanceData.upcoming || []),
      ...(maintenanceData.overdue || []),
      ...(maintenanceData.completed || [])
    ];
    
    return allMaintenance.filter(item => item.scheduledDate === dateStr);
  };

  // Quick actions
  const handleQuickStatusUpdate = async (maintenanceId, status) => {
    try {
      if (onQuickAction) {
        await onQuickAction('complete', maintenanceId, { notes: 'Marked complete from calendar' });
      } else {
        await maintenanceCalendarService.updateMaintenanceStatus(maintenanceId, status);
        await fetchMaintenanceData();
      }
      setSelectedMaintenance(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Tooltip functions
  const showMaintenanceTooltip = (event, maintenanceItem) => {
    const rect = event.target.getBoundingClientRect();
    setShowTooltip({
      visible: true,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5,
      item: maintenanceItem
    });
  };

  const hideTooltip = () => {
    setShowTooltip({ visible: false, x: 0, y: 0, item: null });
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-green-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Maintenance Calendar
          </h3>
          <div className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          
          {/* Refresh Button */}
          <button
            onClick={fetchMaintenanceData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            Today
          </button>

          {/* Navigation */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month/Year Picker */}
          <select
            value={currentMonth}
            onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
          >
            {monthNames.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          
            <select
              value={currentYear}
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
            >
              {Array.from({ length: 300 }, (_, i) => {
                const year = new Date().getFullYear() - 50 + i; 
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
        </div>
      </div>



      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-900 font-semibold text-sm">Scheduled</div>
          <div className="text-blue-700 font-bold text-lg">{maintenanceData.upcoming?.length || 0}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-900 font-semibold text-sm">Overdue</div>
          <div className="text-red-700 font-bold text-lg">{maintenanceData.overdue?.length || 0}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-green-900 font-semibold text-sm">Completed</div>
          <div className="text-green-700 font-bold text-lg">{maintenanceData.completed?.length || 0}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-yellow-900 font-semibold text-sm">This Month</div>
          <div className="text-yellow-700 font-bold text-lg">
            {getMaintenanceForDate(1).length}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekdayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {monthData.map((day, index) => {
            // UPDATE the maintenanceItems call in the calendar grid:
            const maintenanceItems = getFilteredMaintenanceForDate(day);
            const today = isToday(day, currentYear, currentMonth);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border-r border-b border-gray-200 p-2
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${!day ? 'bg-gray-50' : ''}
                  ${today ? 'bg-blue-50' : ''}
                  hover:bg-gray-50 transition-colors
                `}
              >
                {day && (
                  <>
                    {/* Day Header */}
                    <div className={`
                      flex items-center justify-between text-sm font-medium mb-2
                      ${today ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      <span>{day}</span>
                      {today && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    
                    {/* Maintenance Items */}
                    <div className="space-y-1">
                      {maintenanceItems.slice(0, 3).map((item, idx) => {
                        const priorityStyle = priorityColors[item.priority] || priorityColors.medium;
                        const assetIcon = assetTypeIcons[item.assetType] || '⚙️';
                        
                        return (
                          <div
                            key={idx}
                            className={`
                              text-xs px-2 py-1 rounded border cursor-pointer
                              ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}
                              hover:shadow-sm transition-all
                            `}
                            onClick={() => setSelectedMaintenance(item)}
                            onMouseEnter={(e) => showMaintenanceTooltip(e, item)}
                            onMouseLeave={hideTooltip}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">
                                {assetIcon} {item.assetId}
                              </span>
                              {item.isOverdue && <span className="text-red-500">🔴</span>}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {item.assetType}
                            </div>
                          </div>
                        );
                      })}
                      
                      {maintenanceItems.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{maintenanceItems.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip.visible && showTooltip.item && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
          style={{ left: showTooltip.x, top: showTooltip.y }}
        >
          <div className="font-semibold text-gray-900 mb-2">
            {showTooltip.item.assetId} - {showTooltip.item.assetType}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Technician:</strong> {showTooltip.item.technician}</div>
            <div><strong>Priority:</strong> 
              <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                priorityColors[showTooltip.item.priority]?.bg
              } ${priorityColors[showTooltip.item.priority]?.text}`}>
                {showTooltip.item.priority}
              </span>
            </div>
            <div><strong>Location:</strong> {showTooltip.item.assetLocation}</div>
            <div><strong>Description:</strong> {showTooltip.item.description}</div>
            {showTooltip.item.isOverdue && (
              <div className="text-red-600 font-semibold">⚠️ OVERDUE</div>
            )}
          </div>
        </div>
      )}

      {/* Maintenance Detail View */}
      {selectedMaintenance && (
        <>
          {/* Light blurred background */}
          <div
            className="fixed inset-0 -bottom-5 z-40 transition-opacity duration-300 opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            onClick={() => setSelectedMaintenance(null)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Maintenance Details</h3>
                <button 
                  onClick={() => setSelectedMaintenance(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                    <div className="text-sm text-gray-900 font-medium">{selectedMaintenance.assetId}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="text-sm text-gray-900">{selectedMaintenance.assetType}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <div className="text-sm text-gray-900">{selectedMaintenance.assetLocation}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled</label>
                    <div className="text-sm text-gray-900">{selectedMaintenance.scheduledDate}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                    <div className="text-sm text-gray-900">{selectedMaintenance.technician}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      priorityColors[selectedMaintenance.priority]?.bg + ' ' + 
                      priorityColors[selectedMaintenance.priority]?.text + ' ' +
                      priorityColors[selectedMaintenance.priority]?.border + ' border'
                    }`}>
                      {selectedMaintenance.priority}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                      {selectedMaintenance.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditMaintenance(selectedMaintenance)}
                    className="flex-1 bg-green-800 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Maintenance
                  </button>
                  <button
                    onClick={() => handleQuickStatusUpdate(selectedMaintenance.id, 'completed')}
                    className="flex-1 bg-yellow-500 text-gray-800 py-3 rounded-lg hover:bg-yellow-600 transition font-medium"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Legend */}
      <div className="flex flex-wrap gap-6 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Low Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Overdue</span>
        </div>
      </div>

      {/* Edit Maintenance Drawer */}
      <ScheduleMaintenanceDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false);
          setEditingMaintenance(null);
        }}
        onSchedule={handleMaintenanceUpdated}
        editingMaintenance={editingMaintenance}
      />
    </div>
  );
};

// Utility functions (keep these at the bottom of the file)
const useMonthData = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];

  // Add empty days for padding
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

const isToday = (day, currentYear, currentMonth) => {
  if (!day) return false;
  const today = new Date();
  return day === today.getDate() && 
         currentMonth === today.getMonth() && 
         currentYear === today.getFullYear();
};

const getWeekdayNames = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthNames = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default MaintenanceCalendar;