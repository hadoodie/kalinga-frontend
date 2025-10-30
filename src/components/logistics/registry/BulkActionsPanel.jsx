// src/components/logistics/registry/BulkActionsPanel.jsx
import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, Download, Users, X } from "lucide-react";

const BulkActionsPanel = ({ 
  selectedCount, 
  onStatusUpdate, 
  onExport, 
  onAssign, 
  onClearSelection 
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const statusOptions = [
    { value: "Active", label: "Active", icon: CheckCircle, color: "text-green-600" },
    { value: "Under Repair", label: "Under Repair", icon: AlertCircle, color: "text-red-600" },
    { value: "Standby", label: "Standby", icon: Clock, color: "text-yellow-600" }
  ];

  const personnelOptions = [
    "Dr. Sarah Chen",
    "Capt. Mike Rodriguez", 
    "Tech. James Wilson",
    "Lt. Maria Garcia",
    "Cmdr. Robert Brown",
    "Tech. Lisa Wang",
    "Tech. Tom Harris",
    "Dr. Amanda Lee"
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">
              {selectedCount} asset{selectedCount > 1 ? 's' : ''} selected
            </h3>
            <p className="text-blue-700 text-sm">Apply actions to all selected assets</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              Update Status
            </button>
            
            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onStatusUpdate(option.value);
                      setShowStatusMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                  >
                    <option.icon className={`h-4 w-4 ${option.color}`} />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assign Personnel */}
          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              <Users className="h-4 w-4" />
              Assign
            </button>
            
            {showAssignMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {personnelOptions.map((person) => (
                  <button
                    key={person}
                    onClick={() => {
                      onAssign(person);
                      setShowAssignMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                  >
                    <Users className="h-4 w-4 text-gray-600" />
                    {person}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsPanel;