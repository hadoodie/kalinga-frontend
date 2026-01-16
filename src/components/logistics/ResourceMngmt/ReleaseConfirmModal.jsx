// src/components/logistics/ResourceMngmt/ReleaseConfirmModal.jsx
import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Hospital,
  Package,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

const ReleaseConfirmModal = ({ request, onConfirm, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmed) {
      alert('Please confirm that you can release this stock.');
      return;
    }

    onConfirm({
      notes,
      confirmed_at: new Date().toISOString(),
      pickup_window: pickupTime
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-green-300">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Confirm Stock Release</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-green-100 mt-2">Human-in-the-loop confirmation required (DOH Mandatory)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-300">
            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Request Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Requesting Hospital</label>
                <div className="flex items-center gap-2 mt-1">
                  <Hospital className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-800">{request.requesting_hospital}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Resource Needed</label>
                <p className="font-bold text-green-700 mt-1">{request.resource_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Quantity</label>
                <p className="text-2xl font-bold text-gray-800 mt-1">{request.quantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Urgency Level</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                  request.urgency_level === 'critical' 
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : request.urgency_level === 'high'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {request.urgency_level.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Your Stock Impact */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-300">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Stock Impact Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                <span className="text-gray-700">Current Available Stock:</span>
                <span className="text-xl font-bold text-green-700">{request.available_stock} units</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                <span className="text-gray-700">After Release:</span>
                <span className="text-xl font-bold text-green-800">
                  {request.available_stock - request.quantity} units
                </span>
              </div>
              {request.available_stock - request.quantity < 100 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-700 font-semibold">
                    Warning: Stock will be low after this release
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pickup Information */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-300">
            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Pickup Logistics
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Preferred Pickup Time
                </label>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Any special handling instructions or notes..."
                />
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-300">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm-release"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                required
              />
              <div>
                <label htmlFor="confirm-release" className="font-bold text-lg text-gray-800 cursor-pointer">
                  I confirm we can release this stock
                </label>
                <p className="text-gray-600 mt-1">
                  By checking this box, I acknowledge that we have physically verified the stock 
                  availability and authorize its release to the requesting hospital. This action 
                  will trigger DOH logistics coordination.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                confirmed
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Release Authorization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReleaseConfirmModal;