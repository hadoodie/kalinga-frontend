// src/components/logistics/registry/maintenance/utils/dateCalculations.js
import { useMemo } from 'react';

// Memoized date calculations
export const useMonthData = (year, month) => {
  return useMemo(() => {
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
  }, [year, month]);
};

export const isToday = (day, currentYear, currentMonth) => {
  if (!day) return false;
  const today = new Date();
  return day === today.getDate() && 
         currentMonth === today.getMonth() && 
         currentYear === today.getFullYear();
};

export const getMaintenanceForDate = (maintenanceData, day, currentYear, currentMonth) => {
  if (!day) return [];
  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return [...maintenanceData.upcoming, ...maintenanceData.overdue].filter(item => 
    item.scheduledDate === dateStr
  );
};

export const getWeekdayNames = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getMonthNames = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];