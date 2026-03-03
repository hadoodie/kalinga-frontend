// src/components/logistics/registry/ServiceHistory.jsx
import { useState } from "react";
import { Search, Filter, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const ServiceHistory = ({ maintenanceData }) => {
  const [filter, setFilter] = useState("all"); // all, completed, scheduled, overdue
  const [search, setSearch] = useState("");

  const filteredHistory = maintenanceData.completed
    .filter(item => {
      const matchesSearch = item.assetId.toLowerCase().includes(search.toLowerCase()) ||
                           item.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || item.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service history..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No service history found matching your filters.
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(item.status)}
                    <span className="font-semibold text-gray-900">{item.assetId}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Completed: {formatDate(item.completedDate)}</span>
                    <span>Technician: {item.technician}</span>
                    <span>Cost: ${item.cost}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceHistory;