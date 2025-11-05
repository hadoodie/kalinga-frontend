// Create: src/components/logistics/registry/maintenance/CalendarFilterPanel.jsx
import { useState } from "react";
import { Filter, X } from "lucide-react";

const CalendarFilterPanel = ({ filters, onFiltersChange, maintenanceData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  // Get unique asset types from maintenance data
  const assetTypes = [...new Set([
    ...(maintenanceData.upcoming || []).map(item => item.assetType),
    ...(maintenanceData.overdue || []).map(item => item.assetType),
    ...(maintenanceData.completed || []).map(item => item.assetType)
  ])].filter(Boolean);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      assetType: 'all',
      technician: 'all'
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.assetType !== 'all' || filters.technician !== 'all';

  return (
    <div className="bg-white border-gray-200 p-4 mb-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
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
          {hasActiveFilters && (
            <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Expandable Filters */}
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
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Type
              </label>
              <select
                value={filters.assetType}
                onChange={(e) => handleFilterChange('assetType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                {assetTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Technician Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technician
              </label>
              <select
                value={filters.technician}
                onChange={(e) => handleFilterChange('technician', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="all">All Technicians</option>
                <option value="Tech. James Wilson">Tech. James Wilson</option>
                <option value="Tech. Maria Garcia">Tech. Maria Garcia</option>
                <option value="Tech. Tom Harris">Tech. Tom Harris</option>
                <option value="Tech. Lisa Wang">Tech. Lisa Wang</option>
                <option value="Tech. Kevin Patel">Tech. Kevin Patel</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Status: {statusOptions.find(o => o.value === filters.status)?.label}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="hover:text-blue-900 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.priority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Priority: {priorityOptions.find(o => o.value === filters.priority)?.label}
                  <button
                    onClick={() => handleFilterChange('priority', 'all')}
                    className="hover:text-green-900 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.assetType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Type: {filters.assetType}
                  <button
                    onClick={() => handleFilterChange('assetType', 'all')}
                    className="hover:text-purple-900 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.technician !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Tech: {filters.technician}
                  <button
                    onClick={() => handleFilterChange('technician', 'all')}
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
    </div>
  );
};

export default CalendarFilterPanel;