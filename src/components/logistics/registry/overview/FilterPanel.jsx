
// src/components/logistics/registry/overview/FilterPanel.jsx
import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  Save, 
  FolderOpen, 
  Plus,
  Trash2,
  ChevronDown,
  Check
} from "lucide-react";

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
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const calendarRef = useRef(null);
  const savedFiltersRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (savedFiltersRef.current && !savedFiltersRef.current.contains(event.target)) {
        setShowSavedFilters(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
        setCalendarType(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kalinga-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('kalinga-saved-filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  const statusOptions = ["All Status", "Operational", "Under Repair", "Unassigned", "Standby"];
  
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
  
  const locationOptions = [
    "All Locations", 
    "Central Hospital", 
    "North Station", 
    "Maintenance Depot", 
    "Coastal Base", 
    "HQ Operations", 
    "Storage Warehouse"
  ];

  // Quick filter presets
  const quickPresets = [
    {
      id: 'operational-assets',
      name: 'Operational',
      description: 'All active and ready assets',
      filters: { 
        status: 'Operational',
        category: 'All Categories', 
        location: 'All Locations'
      }
    },
    {
      id: 'under-repair',
      name: 'Under Repair',
      description: 'Assets currently in maintenance',
      filters: { 
        status: 'Under Repair',
        category: 'All Categories', 
        location: 'All Locations'
      }
    },
    {
      id: 'unassigned-assets',
      name: 'Unassigned',
      description: 'Assets without assigned personnel',
      filters: { 
        status: 'Unassigned',
        category: 'All Categories', 
        location: 'All Locations'
      }
    },
    {
      id: 'medical-vehicles',
      name: 'Medical Vehicles',
      description: 'All medical transport vehicles',
      filters: { 
        status: 'All Status',
        category: 'Medical Vehicle', 
        location: 'All Locations'
      }
    }
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

  // Save current filter configuration
  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a name for your filter');
      return;
    }

    const newSavedFilter = {
      id: `filter-${Date.now()}`,
      name: filterName,
      filters: { ...filters },
      searchQuery: searchQuery,
      createdAt: new Date().toISOString()
    };

    setSavedFilters(prev => [...prev, newSavedFilter]);
    setFilterName("");
    setShowSaveDialog(false);
  };

  // Load a saved filter
  const loadSavedFilter = (savedFilter) => {
    onFiltersChange(savedFilter.filters);
    if (savedFilter.searchQuery) {
      onSearchChange(savedFilter.searchQuery);
    }
    setIsExpanded(true);
    setShowSavedFilters(false);
  };

  // Delete a saved filter
  const deleteSavedFilter = (filterId, e) => {
    e.stopPropagation();
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  };

  // Apply quick preset
  const applyQuickPreset = (preset) => {
    onFiltersChange(preset.filters);
    onSearchChange("");
    setIsExpanded(true);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      status: "All Status",
      category: "All Categories",
      location: "All Locations",
      dateFrom: "",
      dateTo: ""
    });
    onSearchChange("");
  };

  // Check if any filters are active
  const hasActiveFilters = filters.status !== "All Status" || 
                          filters.category !== "All Categories" || 
                          filters.location !== "All Locations" || 
                          filters.dateFrom || 
                          filters.dateTo || 
                          searchQuery;

  // Simple calendar component
  const SimpleCalendar = ({ onDateSelect, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const handleDateClick = (day) => {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onDateSelect(selectedDate.toISOString().split('T')[0]);
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className="h-8 w-8 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="font-medium text-sm">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center font-medium">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onDateSelect('')}
            className="px-3 py-1 text-sm text-green-600 hover:text-green-800"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      {/* Main Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets by ID, type, location, or personnel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white transition-colors"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <div className="relative" ref={savedFiltersRef}>
              <button
                onClick={() => setShowSavedFilters(!showSavedFilters)}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showSavedFilters && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900 text-sm">Saved Filters</h4>
                  </div>
                  {savedFilters.map(savedFilter => (
                    <div
                      key={savedFilter.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                      onClick={() => loadSavedFilter(savedFilter)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {savedFilter.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(savedFilter.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteSavedFilter(savedFilter.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border rounded-lg transition text-sm font-medium ${
              isExpanded || hasActiveFilters
                ? "bg-green-800 text-white border-green-800" 
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {(isExpanded || hasActiveFilters) && (
              <div className="h-2 w-2 bg-white rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Quick Filter Presets - Always Visible */}
      <div className="mt-3 flex flex-wrap gap-2">
        {quickPresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => applyQuickPreset(preset)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors border border-green-200 font-medium"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Expandable Filters Panel */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors font-medium"
            >
              <Save className="h-3 w-3" />
              Save Filter
            </button>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
            >
              <X className="h-3 w-3" />
              Clear All
            </button>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
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
                <div className="flex-1 relative" ref={calendarRef}>
                  <button
                    onClick={() => openCalendar('from')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition ${
                      filters.dateFrom 
                        ? "border-green-500 bg-green-50 text-gray-900" 
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    <span className="truncate text-xs">
                      {filters.dateFrom || "From"}
                    </span>
                    <Calendar className="h-4 w-4 flex-shrink-0 ml-2" />
                  </button>
                  
                  {showCalendar && calendarType === 'from' && (
                    <div className="absolute top-full left-0 mt-1 z-50">
                      <SimpleCalendar
                        onDateSelect={handleDateSelect}
                        onClose={() => {
                          setShowCalendar(false);
                          setCalendarType(null);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <button
                    onClick={() => openCalendar('to')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition ${
                      filters.dateTo 
                        ? "border-green-500 bg-green-50 text-gray-900" 
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    <span className="truncate text-xs">
                      {filters.dateTo || "To"}
                    </span>
                    <Calendar className="h-4 w-4 flex-shrink-0 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {filters.status !== "All Status" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Status: {filters.status}
                  <button
                    onClick={() => handleStatusChange("All Status")}
                    className="hover:text-green-900 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.category !== "All Categories" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Category: {filters.category}
                  <button
                    onClick={() => handleCategoryChange("All Categories")}
                    className="hover:text-blue-900 ml-1"
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
            </div>
          )}
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Save Current Filter</h3>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentFilter}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}