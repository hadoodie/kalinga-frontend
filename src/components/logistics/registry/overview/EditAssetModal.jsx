// src/components/logistics/registry/overview/EditAssetModal.jsx
import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import assetService from "@/services/assetService";

export default function EditAssetModal({ isOpen, onClose, asset, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (asset) {
      setFormData({ ...asset });
    }
  }, [asset]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('capability_')) {
      const capabilityName = name.replace('capability_', '');
      setFormData(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [capabilityName]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format data for API
      const submitData = { ...formData };
      
      // Remove unnecessary fields
      delete submitData.created_at;
      delete submitData.updated_at;
      delete submitData.created_by;
      
      await assetService.updateAsset(asset.id, submitData);
      onSuccess();
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Failed to update asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  const getAssetCodeDisplay = (a) => a?.asset_code ?? a?.assetCode ?? a?.id ?? a?.name ?? a?.plate_number ?? '—';
  const getAssetTypeDisplay = (a) => a?.type ?? a?.asset_type ?? '—';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-backdrop" onClick={onClose}></div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Asset</h2>
                <p className="text-green-200 mt-1">{getAssetCodeDisplay(asset)} - {getAssetTypeDisplay(asset)}</p>
              </div>
              <button onClick={onClose} className="text-white hover:text-green-200">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Status & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Standby">Standby</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Condition</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Main Depot"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Personnel
                  </label>
                  <input
                    type="text"
                    name="personnel"
                    value={formData.personnel || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Assigned personnel"
                  />
                </div>
              </div>

              {/* Maintenance Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Maintenance
                  </label>
                  <input
                    type="date"
                    name="last_maintenance"
                    value={formData.last_maintenance || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Next Maintenance
                  </label>
                  <input
                    type="date"
                    name="next_maintenance"
                    value={formData.next_maintenance || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Vehicle/Equipment Details */}
              {(asset.plate_number || asset.current_fuel_level !== null) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {asset.plate_number && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        name="plate_number"
                        value={formData.plate_number || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  )}
                  
                  {asset.current_fuel_level !== null && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fuel Level (%)
                      </label>
                      <input
                        type="number"
                        name="current_fuel_level"
                        value={formData.current_fuel_level || ''}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Capabilities */}
              {formData.capabilities && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Capabilities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(formData.capabilities).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-green-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`capability_${key}`}
                          checked={value || false}
                          onChange={handleChange}
                          className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}