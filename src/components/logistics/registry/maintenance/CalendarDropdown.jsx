// src/components/logistics/registry/CalendarDropdown.jsx 
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarDropdown = ({ selectedDate, onDateSelect, onClose, position = 'left' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('calendar');
  const calendarRef = useRef(null);

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

  const generateYears = () => {
    const years = [];
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
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

  const handleDateClick = (day) => {
    if (day) {
      const selected = new Date(currentYear, currentMonth, day);
      onDateSelect(selected.toISOString().split('T')[0]);
    }
  };

  const handleMonthClick = () => {
    setView('year');
  };

  const handleYearSelect = (year) => {
    setCurrentDate(new Date(year, currentMonth, 1));
    setView('calendar');
  };

  const isToday = (day) => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const monthData = generateMonthData();
  const years = generateYears();

  return (
    <div 
      ref={calendarRef}
      className={`
        fixed sm:absolute 
        top-1/2 left-1/2 sm:top-full 
        transform -translate-x-1/2 sm:transform-none
        -translate-y-1/2 mt-1 
        w-[95vw] sm:w-80 max-w-sm 
        bg-white border border-gray-300 rounded-lg shadow-xl z-50
        ${position === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0'}
      `}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleMonthClick}
              className="px-3 py-1 hover:bg-gray-100 rounded transition font-semibold text-sm"
            >
              {monthNames[currentMonth]}
            </button>
            <button
              onClick={handleMonthClick}
              className="px-3 py-1 hover:bg-gray-100 rounded transition font-semibold text-sm"
            >
              {currentYear}
            </button>
          </div>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {view === 'calendar' ? (
          <>
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
                    h-8 rounded text-sm font-medium transition
                    ${!day ? 'invisible' : ''}
                    ${isToday(day) ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : ''}
                    ${isSelected(day) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}
                    ${day && !isToday(day) && !isSelected(day) ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {years.map(year => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className={`
                  p-2 rounded text-sm font-medium transition
                  ${year === currentYear ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <button
            onClick={() => {
              onDateSelect(today.toISOString().split('T')[0]);
              onClose();
            }}
            className="w-full sm:w-auto px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
          >
            Today
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarDropdown;