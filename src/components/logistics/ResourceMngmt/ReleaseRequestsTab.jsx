// src/components/logistics/ResourceMngmt/ReleaseRequestsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Truck, 
  Clock,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import ReleaseConfirmModal from './ReleaseConfirmModal';

const ReleaseRequestsTab = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomingRequests();
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://${window.location.host}/ws/release-requests`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_request') {
        setIncomingRequests(prev => [data.request, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      const response = await fetch('/api/allocations/incoming');
      const data = await response.json();
      setIncomingRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const handleDecline = async (requestId, reason) => {
    try {
      await fetch(`/api/allocations/${requestId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleConfirmRelease = async (confirmationData) => {
    try {
      await fetch(`/api/allocations/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'confirmed',
          ...confirmationData
        })
      });
      setIncomingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error confirming release:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      planned: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Pending Approval</span>,
      confirmed: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">Approved</span>,
      logistics_assigned: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Vehicle Assigned</span>,
      in_transit: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">In Transit</span>
    };
    return badges[status] || badges.planned;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      critical: <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">Critical</span>,
      high: <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">High</span>,
      medium: <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Medium</span>,
      low: <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-300">Low</span>
    };
    return badges[urgency] || badges.medium;
  };

  if (incomingRequests.length === 0 && !loading) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
        <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Release Requests</h3>
        <p className="text-gray-500">You don't have any incoming release requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incomingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-4 shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="font-bold text-red-800">You have {incomingRequests.length} release request(s)</h3>
              <p className="text-sm text-red-600">Action required: Please review and respond to these requests</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {incomingRequests.map((request) => (
          <div key={request.id} className="bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{request.resource_type}</h3>
                    {getUrgencyBadge(request.urgency_level)}
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-gray-600">{request.quantity} units requested by <span className="font-semibold text-green-700">{request.requesting_hospital}</span></p>
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Requested {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Release
                  </button>
                  <button
                    onClick={() => handleDecline(request.id, 'Stock unavailable')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Request Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request ID:</span>
                      <span className="font-mono text-sm">{request.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reason:</span>
                      <span className="text-gray-800">{request.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Needed By:</span>
                      <span className="text-gray-800">{new Date(request.needed_by).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Your Stock</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-bold text-green-700">{request.available_stock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Release:</span>
                      <span className="font-bold text-green-800">{request.available_stock - request.quantity} units</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  View Full Details
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-800 font-semibold">
                  <MessageSquare className="w-4 h-4" />
                  Contact Dispatcher
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfirmModal && selectedRequest && (
        <ReleaseConfirmModal
          request={selectedRequest}
          onConfirm={handleConfirmRelease}
          onClose={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default ReleaseRequestsTab;