// src/components/logistics/ResourceMngmt/ReleaseRequestsTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Truck,
  Clock,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ReleaseConfirmModal from "./ReleaseConfirmModal";
import api from "../../../services/api";

const ReleaseRequestsTab = ({ hospitalId, facility }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncomingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the existing allocations endpoint — filter for allocations
      // where this hospital is the source (outgoing releases)
      const response = await api.get("/allocations", {
        params: { source_hospital_id: hospitalId },
      });
      const data = response.data;
      const list = Array.isArray(data) ? data : data.data || [];

      // Only show allocations that need action (planned / confirmed status)
      const actionable = list.filter((a) =>
        ["planned", "confirmed", "logistics_assigned"].includes(a.status),
      );

      // Normalise fields for the card template
      const normalised = actionable.map((alloc) => ({
        id: alloc.id,
        resource_type:
          alloc.request?.resource?.name ||
          alloc.request?.resource_name ||
          "Resource",
        quantity: alloc.request?.quantity || alloc.quantity || 0,
        urgency_level: alloc.request?.urgency_level?.toLowerCase() || "medium",
        status: alloc.status,
        created_at: alloc.created_at,
        requesting_hospital:
          alloc.destination_hospital?.name ||
          alloc.request?.hospital?.name ||
          "Requesting Hospital",
        reason: alloc.request?.reason || "Supply request",
        needed_by: alloc.request?.needed_by || alloc.created_at,
        available_stock:
          alloc.source_hospital?.resources?.find(
            (r) => r.id === alloc.request?.resource_id,
          )?.quantity ?? "—",
        _raw: alloc,
      }));

      setIncomingRequests(normalised);
    } catch (err) {
      console.error("Error fetching release requests:", err);
      setError("Failed to load release requests.");
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) fetchIncomingRequests();
  }, [hospitalId, fetchIncomingRequests]);

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const handleDecline = async (requestId, reason) => {
    try {
      await api.delete(`/allocations/${requestId}/reject`);
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleConfirmRelease = async (confirmationData) => {
    try {
      await api.patch(
        `/allocations/${selectedRequest.id}/confirm`,
        confirmationData,
      );
      setIncomingRequests((prev) =>
        prev.filter((req) => req.id !== selectedRequest.id),
      );
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Error confirming release:", err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      planned: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          Pending Approval
        </span>
      ),
      confirmed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
          Approved
        </span>
      ),
      logistics_assigned: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
          Vehicle Assigned
        </span>
      ),
      in_transit: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
          In Transit
        </span>
      ),
    };
    return badges[status] || badges.planned;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      critical: (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">
          Critical
        </span>
      ),
      high: (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
          High
        </span>
      ),
      medium: (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          Medium
        </span>
      ),
      low: (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-300">
          Low
        </span>
      ),
    };
    return badges[urgency] || badges.medium;
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-10 h-10 mx-auto text-green-600 animate-spin mb-3" />
        <p className="text-gray-600 font-medium">Loading release requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-red-300 rounded-xl bg-red-50">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-red-700 font-bold mb-2">{error}</p>
        <button
          onClick={fetchIncomingRequests}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (incomingRequests.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
        <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">
          No Release Requests
        </h3>
        <p className="text-gray-500">
          You don't have any incoming release requests at the moment.
        </p>
        <button
          onClick={fetchIncomingRequests}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
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
              <h3 className="font-bold text-red-800">
                You have {incomingRequests.length} release request(s)
              </h3>
              <p className="text-sm text-red-600">
                Action required: Please review and respond to these requests
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {incomingRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {request.resource_type}
                    </h3>
                    {getUrgencyBadge(request.urgency_level)}
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-gray-600">
                    {request.quantity} units requested by{" "}
                    <span className="font-semibold text-green-700">
                      {request.requesting_hospital}
                    </span>
                  </p>
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
                    onClick={() =>
                      handleDecline(request.id, "Stock unavailable")
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Request Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request ID:</span>
                      <span className="font-mono text-sm">
                        {request.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reason:</span>
                      <span className="text-gray-800">{request.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Needed By:</span>
                      <span className="text-gray-800">
                        {new Date(request.needed_by).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Your Stock
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-bold text-green-700">
                        {request.available_stock} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Release:</span>
                      <span className="font-bold text-green-800">
                        {request.available_stock - request.quantity} units
                      </span>
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
