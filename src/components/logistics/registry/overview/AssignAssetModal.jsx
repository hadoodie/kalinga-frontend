// src/components/logistics/registry/overview/AssignAssetModal.jsx
import { useState } from "react";
import { X, Truck, Users, Search, CheckCircle, MapPin, Battery } from "lucide-react";
import assetService from "@/services/assetService";

export default function AssignAssetModal({ isOpen, onClose, asset, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState('');
  const [selectedResponder, setSelectedResponder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - replace with actual API calls
  const allocations = [
    { id: 'alloc-001', name: 'Flood Response - Region A', status: 'planning', location: 'Central Depot' },
    { id: 'alloc-002', name: 'Earthquake Relief - City B', status: 'active', location: 'Field HQ' },
    { id: 'alloc-003', name: 'Medical Supply Run', status: 'planning', location: 'Medical Center' },
    { id: 'alloc-004', name: 'Search & Rescue Operation', status: 'active', location: 'Mountain Base' },
  ];
  
  const responders = [
    { id: 'resp-001', name: 'John Smith', role: 'Driver', status: 'available' },
    { id: 'resp-002', name: 'Maria Garcia', role: 'Paramedic', status: 'available' },
    { id: 'resp-003', name: 'David Chen', role: 'Logistics Officer', status: 'on-duty' },
    { id: 'resp-004', name: 'Sarah Johnson', role: 'Team Lead', status: 'available' },
  ];

  const handleAssign = async () => {
    if (!selectedAllocation) {
      alert('Please select an allocation');
      return;
    }

    setLoading(true);
    try {
      await assetService.assignAssetToAllocation(
        selectedAllocation,
        asset.id,
        selectedResponder || null
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning asset:', error);
      alert('Failed to assign asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  const getAssetCodeDisplay = (a) => a?.asset_code ?? a?.assetCode ?? a?.id ?? a?.name ?? a?.plate_number ?? '—';
  const getAssetTypeDisplay = (a) => a?.type ?? a?.asset_type ?? '—';

  const filteredAllocations = allocations.filter(alloc =>
    alloc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alloc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-backdrop" onClick={onClose}></div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Assign Asset</h2>
                  <p className="text-blue-200 mt-1">
                    {getAssetCodeDisplay(asset)} - {getAssetTypeDisplay(asset)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-blue-200">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search allocations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Allocation List */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Allocation</h3>
              {filteredAllocations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No allocations found</p>
                </div>
              ) : (
                filteredAllocations.map(alloc => (
                  <div
                    key={alloc.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedAllocation === alloc.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAllocation(alloc.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${
                            alloc.status === 'active' ? 'bg-green-500' :
                            alloc.status === 'planning' ? 'bg-amber-500' :
                            'bg-gray-500'
                          }`}></div>
                          <h4 className="font-semibold text-gray-900">{alloc.name}</h4>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {alloc.location}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alloc.status === 'active' ? 'bg-green-100 text-green-800' :
                            alloc.status === 'planning' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>
                      </div>
                      {selectedAllocation === alloc.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Responder Selection (Optional) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Responder (Optional)</h3>
              <div className="grid grid-cols-1 gap-3">
                {responders.map(responder => (
                  <div
                    key={responder.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedResponder === responder.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedResponder(responder.id === selectedResponder ? '' : responder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{responder.name}</h4>
                          <p className="text-sm text-gray-600">{responder.role}</p>
                        </div>
                      </div>
                      {selectedResponder === responder.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        responder.status === 'available' ? 'bg-green-100 text-green-800' :
                        responder.status === 'on-duty' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {responder.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Summary */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Asset Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Asset Code:</span>
                  <span className="font-semibold ml-2">{getAssetCodeDisplay(asset)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold ml-2">{getAssetTypeDisplay(asset)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold ml-2">{asset.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-semibold ml-2">{asset.capacity || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="font-semibold">{asset.location || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Fuel Level:</span>
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-gray-400" />
                    <span className="font-semibold">{asset.current_fuel_level !== null ? `${asset.current_fuel_level}%` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedAllocation}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Asset'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}