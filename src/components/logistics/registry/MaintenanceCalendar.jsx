// src/components/logistics/registry/MaintenanceCalendar.jsx
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MaintenanceCalendar = ({ maintenanceData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateMonthData = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getMaintenanceForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return [...maintenanceData.upcoming, ...maintenanceData.overdue].filter(item => 
      item.scheduledDate === dateStr
    );
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  const monthData = generateMonthData();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
            const maintenanceItems = getMaintenanceForDate(day);
            const hasOverdue = maintenanceItems.some(item => item.status === 'overdue');
            const hasUpcoming = maintenanceItems.some(item => item.status === 'scheduled');

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] border-r border-b border-gray-200 p-2
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${!day ? 'bg-gray-50' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`
                      text-sm font-medium mb-1
                      ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {day}
                    </div>
                    
                    {/* Maintenance Indicators */}
                    <div className="space-y-1">
                      {hasOverdue && (
                        <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate">
                          🔴 Overdue
                        </div>
                      )}
                      {hasUpcoming && !hasOverdue && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded truncate">
                          🟡 Scheduled
                        </div>
                      )}
                      {maintenanceItems.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate">
                          {item.assetId}
                        </div>
                      ))}
                      {maintenanceItems.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{maintenanceItems.length - 2} more
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>Overdue Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Scheduled Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Regular Maintenance</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCalendar;