// src/components/logistics/registry/overview/ScheduleMaintenanceModal.jsx
import { useState } from "react";
import { X, Calendar, Wrench, AlertCircle } from "lucide-react";
import assetService from "@/services/assetService";

export default function ScheduleMaintenanceModal({ isOpen, onClose, asset, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [quickSchedule, setQuickSchedule] = useState(true);
  const [formData, setFormData] = useState({
    scheduled_date: '',
    description: '',
    priority: 'medium',
    technician: '',
    estimated_cost: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (quickSchedule) {
        // Use the service method for quick scheduling
        await assetService.scheduleRoutineMaintenance(asset.id);
      } else {
        // Custom schedule - would need proper API endpoint
        const today = new Date();
        const scheduledDate = formData.scheduled_date 
          ? new Date(formData.scheduled_date)
          : new Date(today.setDate(today.getDate() + 7));
        
        const response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asset_id: asset.id,
            asset_code: asset.asset_code,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            description: formData.description || 'Routine Preventive Maintenance',
            priority: formData.priority,
            technician: formData.technician,
            estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
          })
        });
        
        if (!response.ok) throw new Error('Failed to schedule maintenance');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Failed to schedule maintenance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  // Calculate default date (7 days from now)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const defaultDateString = defaultDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-backdrop" onClick={onClose}></div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Schedule Maintenance</h2>
                  <p className="text-amber-200 mt-1">
                    {asset.asset_code} - {asset.type}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-amber-200">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-8">
            {/* Schedule Type */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuickSchedule(true)}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-colors ${
                    quickSchedule
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Quick Schedule
                  </div>
                  <div className="text-sm font-normal mt-1">
                    Routine maintenance in 7 days
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setQuickSchedule(false)}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-colors ${
                    !quickSchedule
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Custom Schedule
                  </div>
                  <div className="text-sm font-normal mt-1">
                    Set specific details
                  </div>
                </button>
              </div>
              
              {quickSchedule ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Quick Schedule Details</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Routine preventive maintenance will be scheduled for {defaultDate.toLocaleDateString()}.
                        This includes standard inspection and servicing.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      name="scheduled_date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required={!quickSchedule}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Describe the maintenance needed..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Technician
                      </label>
                      <input
                        type="text"
                        name="technician"
                        value={formData.technician}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                        placeholder="Technician name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estimated Cost (USD)
                      </label>
                      <input
                        type="number"
                        name="estimated_cost"
                        value={formData.estimated_cost}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Info */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Asset Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold ml-2">{asset.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-semibold ml-2">{asset.condition || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Maintenance:</span>
                  <span className="font-semibold ml-2">
                    {asset.last_maintenance 
                      ? new Date(asset.last_maintenance).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Maintenance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}