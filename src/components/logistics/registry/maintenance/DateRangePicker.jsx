// src/components/logistics/registry/DateRangePicker.jsx - COMPLEMENTARY COMPONENT
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DateRangePicker = ({ 
  selectedRange, 
  onRangeSelect, 
  onClose, 
  position = 'left' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('presets'); // 'presets' or 'calendar'
  const [tempRange, setTempRange] = useState({ start: null, end: null });
  const calendarRef = useRef(null);

  // Preset date ranges
  const presetRanges = [
    { 
      label: "Today", 
      value: "today",
      getRange: () => {
        const today = new Date();
        return { start: today, end: today };
      }
    },
    { 
      label: "Yesterday", 
      value: "yesterday",
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      }
    },
    { 
      label: "Last 7 days", 
      value: "last7",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { start, end };
      }
    },
    { 
      label: "Last 30 days", 
      value: "last30",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { start, end };
      }
    },
    { 
      label: "This month", 
      value: "month",
      getRange: () => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return { start, end };
      }
    },
    { 
      label: "Last month", 
      value: "lastMonth",
      getRange: () => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        return { start, end };
      }
    },
    { 
      label: "Custom range", 
      value: "custom",
      getRange: () => ({ start: null, end: null })
    }
  ];

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const today = new Date();
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

  const handlePresetSelect = (preset) => {
    if (preset.value === 'custom') {
      setView('calendar');
      setTempRange({ start: null, end: null });
    } else {
      const range = preset.getRange();
      const startStr = range.start.toISOString().split('T')[0];
      const endStr = range.end.toISOString().split('T')[0];
      onRangeSelect({ start: startStr, end: endStr });
      onClose();
    }
  };

  const handleDateClick = (day) => {
    if (!day) return;

    const clickedDate = new Date(currentYear, currentMonth, day);
    
    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      // Start new selection
      setTempRange({ start: clickedDate, end: null });
    } else if (tempRange.start && !tempRange.end) {
      // Complete the selection
      let start = tempRange.start;
      let end = clickedDate;
      
      // Ensure start is before end
      if (start > end) {
        [start, end] = [end, start];
      }
      
      setTempRange({ start, end });
      
      // Auto-apply if both dates are selected
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      onRangeSelect({ start: startStr, end: endStr });
      onClose();
    }
  };

  const isInRange = (day) => {
    if (!day || !tempRange.start) return false;
    
    const date = new Date(currentYear, currentMonth, day);
    
    if (tempRange.start && tempRange.end) {
      return date >= tempRange.start && date <= tempRange.end;
    } else if (tempRange.start && !tempRange.end) {
      return date.getTime() === tempRange.start.getTime();
    }
    
    return false;
  };

  const isStart = (day) => {
    if (!day || !tempRange.start) return false;
    const date = new Date(currentYear, currentMonth, day);
    return tempRange.start && date.getTime() === tempRange.start.getTime();
  };

  const isEnd = (day) => {
    if (!day || !tempRange.end) return false;
    const date = new Date(currentYear, currentMonth, day);
    return tempRange.end && date.getTime() === tempRange.end.getTime();
  };

  const isToday = (day) => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const monthData = generateMonthData();

  return (
    <div 
      ref={calendarRef}
      className={`
        fixed sm:absolute 
        top-1/2 left-1/2 sm:top-full 
        transform -translate-x-1/2 sm:transform-none
        -translate-y-1/2 mt-1 
        w-[95vw] sm:w-96 max-w-sm 
        bg-white border border-gray-300 rounded-lg shadow-xl z-50
        ${position === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0'}
      `}
    >
      <div className="p-4 border-b border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Select Date Range</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* Range Display */}
        {(tempRange.start || tempRange.end) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Selected Range:</div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(tempRange.start)} 
                  {tempRange.end ? ` - ${formatDate(tempRange.end)}` : ' (Select end date)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {view === 'presets' ? (
          /* PRESET RANGES VIEW */
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Ranges</h4>
            {presetRanges.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : (
          /* CALENDAR VIEW */
          <>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex gap-2">
                <span className="px-3 py-1 font-semibold text-sm">
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthData.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={!day}
                  className={`
                    h-8 rounded text-sm font-medium transition relative
                    ${!day ? 'invisible' : ''}
                    ${isToday(day) ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : ''}
                    ${isStart(day) ? 'bg-blue-500 text-white rounded-l-full' : ''}
                    ${isEnd(day) ? 'bg-blue-500 text-white rounded-r-full' : ''}
                    ${isInRange(day) && !isStart(day) && !isEnd(day) ? 'bg-blue-200 text-blue-800' : ''}
                    ${day && !isToday(day) && !isInRange(day) ? 'hover:bg-gray-100 text-gray-700' : ''}
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          {view === 'calendar' ? (
            <button
              onClick={() => setView('presets')}
              className="w-full sm:w-auto px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition"
            >
              Back to Presets
            </button>
          ) : (
            <button
              onClick={() => setView('calendar')}
              className="w-full sm:w-auto px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              Custom Range
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;