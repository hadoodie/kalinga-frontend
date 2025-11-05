// src/components/logistics/registry/FilterPanel.jsx - FIXED
import { useState, useRef, useEffect } from "react";
import { Search, Filter, Calendar, X } from "lucide-react";
import CalendarDropdown from "./CalendarDropdown";

export default function FilterPanel({ 
  filters, 
  onFiltersChange, 
  searchQuery, 
  onSearchChange,
  assets 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState(null);
  const calendarRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusOptions = ["All Status", "Active", "Under Repair", "Standby"];
  
  // FIXED: Updated to match your mock data categories
  const categoryOptions = [
    "All Categories", 
    "Medical Vehicle", 
    "Emergency Vehicle", 
    "Power Equipment", 
    "Watercraft", 
    "Communication", 
    "Water Equipment", 
    "All-Terrain Vehicle", 
    "Medical Facility"
  ];
  
  // FIXED: Updated to match your mock data locations
  const locationOptions = [
    "All Locations", 
    "Central Hospital", 
    "North Station", 
    "Maintenance Depot", 
    "Coastal Base", 
    "HQ Operations", 
    "Storage Warehouse"
  ];

  const handleStatusChange = (status) => {
    onFiltersChange({ ...filters, status });
  };

  const handleCategoryChange = (category) => {
    onFiltersChange({ ...filters, category });
  };

  const handleLocationChange = (location) => {
    onFiltersChange({ ...filters, location });
  };

  const handleDateSelect = (date) => {
    if (calendarType === 'from') {
      onFiltersChange({ ...filters, dateFrom: date });
    } else if (calendarType === 'to') {
      onFiltersChange({ ...filters, dateTo: date });
    }
    setShowCalendar(false);
    setCalendarType(null);
  };

  const openCalendar = (type) => {
    setCalendarType(type);
    setShowCalendar(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 relative">
      {/* Search Bar and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets by ID, type, or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Filters Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              isExpanded 
                ? "bg-yellow-500 text-gray-800 border-yellow-500" 
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Expandable Filters - Only shows when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter - NOW MATCHES MOCK DATA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter - NOW MATCHES MOCK DATA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                {locationOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Date
              </label>
              <div className="flex gap-2">
                {/* From Date */}
                <div className="flex-1 relative">
                  <button
                    onClick={() => openCalendar('from')}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition ${
                      filters.dateFrom 
                        ? "border-yellow-500 bg-yellow-50 text-gray-900" 
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    <span className="truncate">{filters.dateFrom || "From Date"}</span>
                    <Calendar className="h-4 w-4 flex-shrink-0 ml-2" />
                  </button>
                  
                  {/* Calendar Dropdown for From Date */}
                  {showCalendar && calendarType === 'from' && (
                    <div ref={calendarRef} className="absolute top-full left-0 mt-1 z-50">
                      <CalendarDropdown
                        selectedDate={filters.dateFrom}
                        onDateSelect={handleDateSelect}
                        onClose={() => {
                          setShowCalendar(false);
                          setCalendarType(null);
                        }}

                      />
                    </div>
                  )}
                </div>

                {/* To Date */}
                <div className="flex-1 relative">
                  <button
                    onClick={() => openCalendar('to')}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition ${
                      filters.dateTo 
                        ? "border-yellow-500 bg-yellow-50 text-gray-900" 
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    <span className="truncate">{filters.dateTo || "To Date"}</span>
                    <Calendar className="h-4 w-4 flex-shrink-0 ml-2" />
                  </button>
                  
                  {/* Calendar Dropdown for To Date */}
                  {showCalendar && calendarType === 'to' && (
                    <div ref={calendarRef} className="absolute top-full right-0 mt-1 z-50">
                      <CalendarDropdown
                        selectedDate={filters.dateTo}
                        onDateSelect={handleDateSelect}
                        onClose={() => {
                          setShowCalendar(false);
                          setCalendarType(null);
                        }}

                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            {filters.status !== "All Status" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Status: {filters.status}
                <button
                  onClick={() => handleStatusChange("All Status")}
                  className="hover:text-blue-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.category !== "All Categories" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Category: {filters.category}
                <button
                  onClick={() => handleCategoryChange("All Categories")}
                  className="hover:text-green-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.location !== "All Locations" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Location: {filters.location}
                <button
                  onClick={() => handleLocationChange("All Locations")}
                  className="hover:text-purple-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                From: {filters.dateFrom}
                <button
                  onClick={() => onFiltersChange({ ...filters, dateFrom: "" })}
                  className="hover:text-yellow-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                To: {filters.dateTo}
                <button
                  onClick={() => onFiltersChange({ ...filters, dateTo: "" })}
                  className="hover:text-orange-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                Search: "{searchQuery}"
                <button
                  onClick={() => onSearchChange("")}
                  className="hover:text-gray-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}