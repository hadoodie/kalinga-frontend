// src/components/logistics/registry/overview/ViewAssetModal.jsx
import { X, Edit, Calendar, DollarSign, MapPin, User, Truck, Battery, Thermometer, Shield, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function ViewAssetModal({ isOpen, onClose, asset, onEdit, onScheduleMaintenance, onAssign, onDelete }) {
  if (!isOpen || !asset) return null;

  const getAssetCodeDisplay = (a) => a?.asset_code ?? a?.assetCode ?? a?.id ?? a?.name ?? a?.plate_number ?? '—';
  const getAssetTypeDisplay = (a) => a?.type ?? a?.asset_type ?? '—';

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "Not specified";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-backdrop" onClick={onClose}></div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{getAssetCodeDisplay(asset)}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                    {getAssetTypeDisplay(asset)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    asset.status === 'Operational' ? 'bg-green-500 text-white' :
                    asset.status === 'Under Repair' ? 'bg-amber-500 text-white' :
                    asset.status === 'Standby' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {asset.status}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Asset Overview */}
                <div className="theme-card p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Asset Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Category</span>
                      <span className="font-semibold text-green-900">{asset.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-semibold text-green-900">{asset.capacity || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Location</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-green-900">{asset.location || 'Not assigned'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Assigned Personnel</span>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-green-900">{asset.personnel || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="theme-card p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Manufacturer</span>
                      <span className="font-semibold text-green-900">{asset.manufacturer || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Model</span>
                      <span className="font-semibold text-green-900">{asset.model || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Year</span>
                      <span className="font-semibold text-green-900">{asset.year || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Condition</span>
                      <span className={`font-semibold ${
                        asset.condition === 'Excellent' ? 'text-green-600' :
                        asset.condition === 'Good' ? 'text-green-500' :
                        asset.condition === 'Fair' ? 'text-amber-600' :
                        asset.condition === 'Poor' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {asset.condition || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle/Equipment Details */}
                {(asset.plate_number || asset.operating_hours) && (
                  <div className="theme-card p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                      {asset.plate_number ? 'Vehicle Details' : 'Equipment Details'}
                    </h3>
                    <div className="space-y-3">
                      {asset.plate_number && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Plate Number</span>
                          <span className="font-semibold text-green-900">{asset.plate_number}</span>
                        </div>
                      )}
                      {asset.mileage && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Mileage</span>
                          <span className="font-semibold text-green-900">{asset.mileage}</span>
                        </div>
                      )}
                      {asset.current_fuel_level !== null && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Fuel Level</span>
                          <span className="font-semibold text-green-900">{asset.current_fuel_level}%</span>
                        </div>
                      )}
                      {asset.operating_hours && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Operating Hours</span>
                          <span className="font-semibold text-green-900">{asset.operating_hours}</span>
                        </div>
                      )}
                      {asset.power_source && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Power Source</span>
                          <span className="font-semibold text-green-900">{asset.power_source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Maintenance */}
                <div className="theme-card p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Maintenance History</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">Last Maintenance</div>
                          <div className="text-sm text-green-700">{formatDate(asset.last_maintenance)}</div>
                        </div>
                      </div>
                      {asset.last_maintenance && (
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">Next Maintenance</div>
                          <div className="text-sm text-blue-700">{formatDate(asset.next_maintenance)}</div>
                        </div>
                      </div>
                      {asset.next_maintenance && (
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    
                    <button
                      onClick={onScheduleMaintenance}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                    >
                      <Calendar className="h-5 w-5" />
                      Schedule Maintenance
                    </button>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="theme-card p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Financial Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-purple-900">Asset Value</div>
                          <div className="text-sm text-purple-700">{formatCurrency(asset.value)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">Purchase Date</div>
                          <div className="text-sm text-gray-700">{formatDate(asset.purchase_date)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capabilities */}
                {asset.capabilities && Object.values(asset.capabilities).some(v => v === true) && (
                  <div className="theme-card p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Capabilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(asset.capabilities)
                        .filter(([_, value]) => value === true)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-300"
                          >
                            {key.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="theme-card p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Metadata</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span>{new Date(asset.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Asset ID: {asset.id}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onDelete}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  Delete Asset
                </button>
                
                {asset.status === 'Standby' && (
                  <button
                    onClick={onAssign}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Assign to Allocation
                  </button>
                )}
                
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <Edit className="h-5 w-5" />
                  Edit Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}