import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Filter, Edit, X, Save, Package, User, Building, Clock, FileText, ChevronDown } from "lucide-react";
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
  const [showEventDrawer, setShowEventDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calendar data calculations
  const monthData = useMonthData(currentYear, currentMonth);
  const monthNames = getMonthNames();
  const weekdayNames = getWeekdayNames();

  // Event type configuration using your theme
  const eventTypeConfig = {
    stock_in: { 
      color: 'green', 
      icon: '📥', 
      label: 'Stock In', 
      bg: 'bg-green-100', 
      border: 'border-green-300', 
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-800 border-green-200'
    },
    stock_out: { 
      color: 'red', 
      icon: '📤', 
      label: 'Stock Out', 
      bg: 'bg-red-100', 
      border: 'border-red-300', 
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800 border-red-200'
    },
    status_change: { 
      color: 'yellow', 
      icon: '⚠️', 
      label: 'Status Change', 
      bg: 'bg-yellow-100', 
      border: 'border-yellow-300', 
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    expiry_alert: { 
      color: 'orange', 
      icon: '📅', 
      label: 'Expiry Alert', 
      bg: 'bg-orange-100', 
      border: 'border-orange-300', 
      text: 'text-orange-800',
      badge: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    critical_event: { 
      color: 'red', 
      icon: '🔴', 
      label: 'Critical', 
      bg: 'bg-red-100', 
      border: 'border-red-300', 
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800 border-red-200'
    }
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

  // Handle event click - opens drawer
  const handleEventClick = (event, e) => {
    e?.stopPropagation();
    setSelectedEvent(event);
    setShowEventDrawer(true);
  };

  // Handle edit event - opens edit drawer
  const handleEditEvent = () => {
    setEditingEvent({ ...selectedEvent });
    setShowEventDrawer(false);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Saving event:', editingEvent);
      
      // Check if we have a valid ID
      if (!editingEvent.id) {
        console.error('Cannot save: No movement ID found');
        alert('Error: Cannot save changes - missing event ID');
        return;
      }

      // Call the API with the correct ID
      await resourceCalendarService.updateStockMovement(editingEvent.id, {
        quantity: editingEvent.quantity,
        reason: editingEvent.reason,
        performed_by: editingEvent.performed_by || editingEvent.performedBy,
      });
      
      // Refresh events
      fetchCalendarEvents();
      setShowEditDrawer(false);
      setEditingEvent(null);
      
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  // Organized event display for massive data
  const OrganizedEventsList = ({ events, onEventClick }) => {
    const eventsByType = events.reduce((acc, event) => {
      const type = event.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(eventsByType).map(([type, typeEvents]) => {
          const config = eventTypeConfig[type] || eventTypeConfig.stock_in;
          return (
            <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Event Type Header */}
              <div className={`px-4 py-3 ${config.bg} border-b ${config.border}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <h3 className="font-semibold text-sm text-green-900">
                    {config.label} ({typeEvents.length})
                  </h3>
                </div>
              </div>
              
              {/* Events List */}
              <div className="divide-y divide-gray-100">
                {typeEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-green-900 text-sm truncate">
                          {event.resource}
                        </h4>
                        <p className="text-gray-600 text-xs mt-1">{event.facility}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {event.quantity && (
                            <span className={`font-medium ${
                              event.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Qty: {event.quantity > 0 ? `+${event.quantity}` : event.quantity}
                            </span>
                          )}
                          <span>{event.performed_by}</span>
                        </div>
                        
                        {event.reason && (
                          <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                            {event.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(event.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header with Filters Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-green-900 flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <span className="hidden sm:inline">Resource History Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </h3>
          <div className="text-lg font-semibold text-green-800">
            {monthNames[currentMonth]} {currentYear}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Today
          </button>

          {/* Navigation */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* Month/Year Picker */}
          <div className="flex gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm min-w-[120px]"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            
            <select
              value={currentYear}
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm min-w-[100px]"
            >
              {generateYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filters Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-green-900"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Filters Dropdown */}
            {showFiltersDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-900 text-sm">Event Types</h4>
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={eventTypes[type]}
                        onChange={(e) => setEventTypes(prev => ({ ...prev, [type]: e.target.checked }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex items-center gap-2 font-medium text-green-900">
                        <span className="text-base">{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid with Better Mobile Spacing */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
        {/* Weekday Headers - Better mobile spacing */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekdayNames.map(day => (
            <div key={day} className="p-3 sm:p-4 text-center text-sm font-semibold text-green-900">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - Better mobile spacing */}
        <div className="grid grid-cols-7">
          {monthData.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const today = isToday(day, currentYear, currentMonth);
            const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] sm:min-h-[120px] border-r border-b border-gray-200 p-2 sm:p-3
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${!day ? 'bg-gray-50' : ''}
                  ${today ? 'bg-green-50 border-green-200' : ''}
                  ${day ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                `}
                onClick={() => day && fetchDateEvents(dateStr)}
              >
                {day && (
                  <>
                    {/* Day Header */}
                    <div className={`
                      flex items-center justify-between text-sm font-medium mb-2
                      ${today ? 'text-green-800 font-semibold' : 'text-green-900'}
                    `}>
                      <span>{day}</span>
                      {today && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                    </div>
                    
                    {/* Events - Better mobile spacing */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, idx) => {
                        const config = eventTypeConfig[event.type] || eventTypeConfig.stock_in;
                        return (
                          <div
                            key={idx}
                            className={`
                              text-xs p-2 rounded border cursor-pointer transition-all
                              ${config.bg} ${config.border} ${config.text}
                              hover:shadow-sm
                            `}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate flex items-center gap-1">
                                <span className="text-xs">{config.icon}</span>
                                <span className="truncate">{event.resource}</span>
                              </span>
                            </div>
                            <div className="truncate mt-0.5 text-xs">
                              {event.reason?.substring(0, 20) || config.label.substring(0, 20)}...
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayEvents.length - 3} more
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

      {/* Rest of the component remains exactly the same */}
      {/* Date Events Modal */}
      {selectedDate && (
        <>
          {/* Blurred background */}
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300 opacity-100"
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h3 className="text-xl font-bold text-green-900 flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="text-sm font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {dateEvents.length} events
                  </span>
                </h3>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {dateEvents.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600">No events for this date</p>
                  </div>
                ) : (
                  <OrganizedEventsList 
                    events={dateEvents} 
                    onEventClick={handleEventClick}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Detail Drawer */}
      {showEventDrawer && selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          eventTypeConfig={eventTypeConfig}
          onClose={() => setShowEventDrawer(false)}
          onEdit={handleEditEvent}
        />
      )}

      {/* Edit Event Drawer */}
      {showEditDrawer && editingEvent && (
        <EditEventDrawer
          event={editingEvent}
          eventTypeConfig={eventTypeConfig}
          onClose={() => {
            setShowEditDrawer(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEdit}
          onChange={setEditingEvent}
        />
      )}

      {/* Enhanced Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-green-900 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2 font-medium">
            <div className={`w-3 h-3 ${config.bg} ${config.border} rounded border`}></div>
            <span>{config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 font-medium">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

// Event Detail Drawer Component (unchanged)
const EventDetailDrawer = ({ event, eventTypeConfig, onClose, onEdit }) => {
  const config = eventTypeConfig[event.type] || eventTypeConfig.stock_in;

  return (
    <>
      {/* Blurred background */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 opacity-100"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <h2 className="text-xl font-bold text-green-900">Event Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Resource Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-5 w-5 text-green-700" />
                  <h3 className="font-semibold text-green-900 text-lg">{event.resource}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Facility:</span>
                    <p className="text-green-900 mt-1">{event.facility}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Event Type:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              {event.quantity && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Movement
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Quantity:</span>
                      <div className={`text-lg font-bold mt-1 ${
                        event.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {event.quantity > 0 ? `+${event.quantity}` : event.quantity}
                      </div>
                    </div>
                    {event.previous_quantity !== undefined && event.new_quantity !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Stock Change:</span>
                        <div className="font-mono text-sm mt-1 bg-gray-50 p-2 rounded border">
                          {event.previous_quantity} → {event.new_quantity}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performed By */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Performed By
                </h4>
                <p className="text-gray-700">{event.performed_by}</p>
              </div>

              {/* Reason */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reason
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border text-sm">
                  {event.reason}
                </p>
              </div>

              {/* Timestamp */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timestamp
                </h4>
                <p className="text-gray-700">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors font-medium text-sm"
              >
                <Edit className="h-4 w-4" />
                Edit Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Edit Event Drawer Component (unchanged)
const EditEventDrawer = ({ event, eventTypeConfig, onClose, onSave, onChange }) => {
  const config = eventTypeConfig[event.type] || eventTypeConfig.stock_in;

  return (
    <>
      {/* Blurred background */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 opacity-100"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onClick={onClose}
      />

      {/* Edit Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-bold text-green-900">Edit Event</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Resource Info (Read-only) */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Resource Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Name:</span>
                    <p className="text-green-900">{event.resource}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Facility:</span>
                    <p className="text-green-900">{event.facility}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Type:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={event.quantity || ''}
                    onChange={(e) => onChange({ ...event, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={event.performed_by || ''}
                    onChange={(e) => onChange({ ...event, performed_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={event.reason || ''}
                    onChange={(e) => onChange({ ...event, reason: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-800 hover:bg-green-700 text-white rounded-md transition-colors font-medium text-sm"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Utility functions (unchanged)
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