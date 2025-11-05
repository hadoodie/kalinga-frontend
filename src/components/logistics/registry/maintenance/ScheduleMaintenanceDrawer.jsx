// src/components/logistics/registry/ScheduleMaintenanceDrawer.jsx
import { useState, useEffect } from "react";
import { X, Save, Calendar, Wrench, DollarSign } from "lucide-react";
import { mockAssetService } from "../../../../services/mockAssetService";

export default function ScheduleMaintenanceDrawer({ isOpen, onClose, onSchedule }) {
  const [formData, setFormData] = useState({
    assetId: "",
    scheduledDate: "",
    description: "",
    priority: "medium",
    technician: "",
    estimatedCost: "",
    notes: ""
  });
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen]);

  const fetchAssets = async () => {
    try {
      const assetsData = await mockAssetService.getAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.assetId || !formData.scheduledDate || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call mock service to schedule maintenance
      await mockAssetService.scheduleMaintenance(formData);
      
      // Reset form
      setFormData({
        assetId: "",
        scheduledDate: "",
        description: "",
        priority: "medium",
        technician: "",
        estimatedCost: "",
        notes: ""
      });
      
      onSchedule(); // Notify parent
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-screen blurred background - fixed bottom line issue */}
      <div
        className={`fixed inset-0 -bottom-16 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div 
          className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-smooth transform transition-all duration-300 border border-gray-200 ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <Wrench className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Schedule Maintenance
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Asset *
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => handleChange('assetId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Choose an asset...</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.id} - {asset.type} ({asset.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheduled Date */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Technician */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => handleChange('technician', e.target.value)}
                    placeholder="Enter technician name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Estimated Cost */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.estimatedCost}
                      onChange={(e) => handleChange('estimatedCost', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows="3"
                    placeholder="Describe the maintenance work to be performed..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows="2"
                    placeholder="Any additional information or special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Schedule Maintenance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}