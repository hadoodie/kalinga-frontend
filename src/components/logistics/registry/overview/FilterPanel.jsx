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
  Download,
  Upload
} from "lucide-react";
import CalendarDropdown from "../maintenance/CalendarDropdown";

export default function AdvancedFilterPanel({ 
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
  const [filterGroups, setFilterGroups] = useState([]);
  const calendarRef = useRef(null);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kalinga-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kalinga-saved-filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  const statusOptions = ["All Status", "Active", "Under Repair", "Standby"];
  
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
      id: 'overdue-maintenance',
      name: 'Overdue Maintenance',
      description: 'Assets with overdue maintenance',
      filters: { 
        status: 'All Status',
        category: 'All Categories', 
        location: 'All Locations',
        maintenanceStatus: 'overdue'
      }
    },
    {
      id: 'unassigned-assets',
      name: 'Unassigned Assets',
      description: 'Assets without assigned personnel',
      filters: { 
        status: 'All Status',
        category: 'All Categories', 
        location: 'All Locations',
        personnel: 'unassigned'
      }
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      description: 'Critical assets needing attention',
      filters: { 
        status: 'Under Repair',
        category: 'All Categories', 
        location: 'All Locations',
        priority: 'high'
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

  // Add a new filter group
  const addFilterGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      field: 'type',
      operator: 'contains',
      value: '',
      logic: 'AND'
    };
    setFilterGroups(prev => [...prev, newGroup]);
  };

  // Remove a filter group
  const removeFilterGroup = (groupId) => {
    setFilterGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // Update filter group
  const updateFilterGroup = (groupId, updates) => {
    setFilterGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  // Apply advanced filter groups
  const applyAdvancedFilters = () => {
    // This would implement complex filtering logic
    console.log('Applying advanced filters:', filterGroups);
    // For now, we'll just show a message
    alert('Advanced filtering logic would be applied here');
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
    setFilterGroups([]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 relative">
      {/* Search Bar and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets by ID, type, location, or personnel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Saved ({savedFilters.length})</span>
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 hidden">
                {savedFilters.map(savedFilter => (
                  <div
                    key={savedFilter.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                    onClick={() => loadSavedFilter(savedFilter)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
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
            </div>
          )}

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

      {/* Quick Filter Presets */}
      {!isExpanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyQuickPreset(preset)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Expandable Filters - Only shows when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
            >
              <Save className="h-3 w-3" />
              Save Filter
            </button>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear All
            </button>
          </div>

          {/* Basic Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
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

            {/* Category Filter */}
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

            {/* Location Filter */}
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

          {/* Advanced Filter Groups */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Advanced Filters</h4>
              <button
                onClick={addFilterGroup}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-3 w-3" />
                Add Condition
              </button>
            </div>

            {filterGroups.length > 0 && (
              <div className="space-y-2 mb-4">
                {filterGroups.map((group, index) => (
                  <div key={group.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {index > 0 && (
                      <select
                        value={group.logic}
                        onChange={(e) => updateFilterGroup(group.id, { logic: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <select
                      value={group.field}
                      onChange={(e) => updateFilterGroup(group.id, { field: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="type">Type</option>
                      <option value="personnel">Personnel</option>
                      <option value="condition">Condition</option>
                      <option value="capacity">Capacity</option>
                    </select>
                    <select
                      value={group.operator}
                      onChange={(e) => updateFilterGroup(group.id, { operator: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="startsWith">starts with</option>
                      <option value="greaterThan">greater than</option>
                    </select>
                    <input
                      type="text"
                      value={group.value}
                      onChange={(e) => updateFilterGroup(group.id, { value: e.target.value })}
                      placeholder="Value..."
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeFilterGroup(group.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={applyAdvancedFilters}
                  className="w-full px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  Apply Advanced Filters
                </button>
              </div>
            )}
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

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="font-semibold text-gray-900 mb-4">Save Current Filter</h3>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentFilter}
                className="px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600"
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