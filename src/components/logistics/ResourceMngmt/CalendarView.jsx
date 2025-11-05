import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Filter, Edit, X } from "lucide-react";
import resourceCalendarService from "../../../services/resourceCalendarService";

const CalendarView = ({ facility, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateEvents, setDateEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState({
    stock_in: true,
    stock_out: true,
    status_change: true,
    expiry_alert: true,
    critical_event: true
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calendar data calculations
  const monthData = useMonthData(currentYear, currentMonth);
  const monthNames = getMonthNames();
  const weekdayNames = getWeekdayNames();

  // Event type configuration
  const eventTypeConfig = {
    stock_in: { color: 'green', icon: '📥', label: 'Stock In', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    stock_out: { color: 'red', icon: '📤', label: 'Stock Out', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    status_change: { color: 'yellow', icon: '⚠️', label: 'Status Change', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    expiry_alert: { color: 'orange', icon: '📅', label: 'Expiry Alert', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    critical_event: { color: 'red', icon: '🔴', label: 'Critical', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
  };

  // Generate year options (25 years back, 150 years forward)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 25; i <= currentYear + 150; i++) {
      years.push(i);
    }
    return years;
  };

  // Fetch calendar events
  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const data = await resourceCalendarService.getCalendarEvents({
        location: facility,
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
      });
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events for specific date
  const fetchDateEvents = async (date) => {
    try {
      const data = await resourceCalendarService.getDateEvents(date);
      setDateEvents(data.events || []);
      setSelectedDate(date);
    } catch (error) {
      console.error('Error fetching date events:', error);
    }
  };

  useEffect(() => {
    if (facility) {
      fetchCalendarEvents();
    }
  }, [facility, currentDate]);

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get events for specific date
  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateEvents = events.find(event => event.date === dateStr);
    return dateEvents ? dateEvents.events.filter(event => eventTypes[event.type]) : [];
  };

  // Handle event click
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle edit event
  const handleEditEvent = () => {
    console.log('Edit event:', selectedEvent);
    // Implement edit functionality here
    alert(`Edit functionality for: ${selectedEvent.resource}`);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-green-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="hidden sm:inline">Resource History Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </h3>
          <div className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Month/Year Picker - Responsive */}
          <div className="flex gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm min-w-[120px]"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            
            <select
              value={currentYear}
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm min-w-[100px]"
            >
              {generateYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Event Type Filters - Responsive */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter Events:</span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={eventTypes[type]}
                onChange={(e) => setEventTypes(prev => ({ ...prev, [type]: e.target.checked }))}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="flex items-center gap-1">
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Calendar Grid - Responsive */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Weekday Headers - Responsive */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekdayNames.map(day => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - Responsive */}
        <div className="grid grid-cols-7">
          {monthData.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const today = isToday(day, currentYear, currentMonth);
            const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-1 sm:p-2
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${!day ? 'bg-gray-50' : ''}
                  ${today ? 'bg-blue-50' : ''}
                  ${day ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                `}
                onClick={() => day && fetchDateEvents(dateStr)}
              >
                {day && (
                  <>
                    {/* Day Header */}
                    <div className={`
                      flex items-center justify-between text-xs sm:text-sm font-medium mb-1 sm:mb-2
                      ${today ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      <span>{day}</span>
                      {today && <div className="w-1 h-1 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayEvents.slice(0, 2).map((event, idx) => {
                        const config = eventTypeConfig[event.type] || eventTypeConfig.stock_in;
                        return (
                          <div
                            key={idx}
                            className={`
                              text-[10px] sm:text-xs p-1 sm:p-2 rounded border cursor-pointer transition-all
                              ${config.bg} ${config.border} ${config.text}
                              hover:shadow-sm
                            `}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate flex items-center gap-1">
                                <span className="text-xs">{config.icon}</span>
                                <span className="truncate hidden xs:inline">{event.resource}</span>
                              </span>
                            </div>
                            <div className="truncate mt-0.5">
                              {event.reason?.substring(0, 15) || config.label.substring(0, 15)}...
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] sm:text-xs text-gray-500 text-center py-0.5">
                          +{dayEvents.length - 2} more
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

      {/* Date Events Modal */}
      {selectedDate && (
        <>
          {/* Blurred background */}
          <div
            className="fixed inset-0 -bottom-5 z-40 transition-opacity duration-300 opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            onClick={() => setSelectedDate(null)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {dateEvents.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg">No events for this date</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dateEvents.map((event, index) => {
                      const config = eventTypeConfig[event.type] || eventTypeConfig.stock_in;
                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white cursor-pointer"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{config.icon}</span>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{event.resource}</h4>
                                <p className="text-sm text-gray-600">{event.facility}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
                              {config.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div>
                              <span className="font-medium text-gray-500">Type:</span> {config.label}
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Performed by:</span> {event.performed_by}
                            </div>
                            {event.quantity && (
                              <div>
                                <span className="font-medium text-gray-500">Quantity:</span> 
                                <span className={`ml-1 font-semibold ${event.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {event.quantity > 0 ? `+${event.quantity}` : event.quantity}
                                </span>
                              </div>
                            )}
                            {event.previous_quantity !== undefined && event.new_quantity !== undefined && (
                              <div>
                                <span className="font-medium text-gray-500">Stock Change:</span> 
                                <span className="ml-1 font-mono">
                                  {event.previous_quantity} → {event.new_quantity}
                                </span>
                              </div>
                            )}
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-500">Reason:</span> 
                              <span className="ml-1">{event.reason}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <>
          {/* Blurred background */}
          <div
            className="fixed inset-0 -bottom-5 z-50 transition-opacity duration-300 opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            onClick={() => setShowEventModal(false)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-smooth transform transition-all duration-300 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{eventTypeConfig[selectedEvent.type]?.icon}</span>
                    <h2 className="text-xl font-bold text-gray-900">
                      Event Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Name
                      </label>
                      <div className="text-lg font-semibold text-gray-900">{selectedEvent.resource}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Type
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          eventTypeConfig[selectedEvent.type]?.bg
                        } ${
                          eventTypeConfig[selectedEvent.type]?.text
                        } border ${
                          eventTypeConfig[selectedEvent.type]?.border
                        }`}>
                          {eventTypeConfig[selectedEvent.type]?.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility
                      </label>
                      <div className="text-sm text-gray-900">{selectedEvent.facility}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className={`text-lg font-semibold ${
                        selectedEvent.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedEvent.quantity > 0 ? `+${selectedEvent.quantity}` : selectedEvent.quantity}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Performed By
                      </label>
                      <div className="text-sm text-gray-900">{selectedEvent.performed_by}</div>
                    </div>

                    {selectedEvent.previous_quantity !== undefined && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Movement
                        </label>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded-lg border">
                          {selectedEvent.previous_quantity} → {selectedEvent.new_quantity}
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {selectedEvent.reason}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timestamp
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleEditEvent}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 transition font-medium text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Event
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Legend - Responsive */}
      <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 ${config.bg} ${config.border} rounded border`}></div>
            <span className="hidden xs:inline">{config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="hidden xs:inline">Today</span>
        </div>
      </div>
    </div>
  );
};

// Utility functions
const useMonthData = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

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

export default CalendarView;