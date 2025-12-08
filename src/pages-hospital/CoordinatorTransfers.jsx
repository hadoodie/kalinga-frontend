/**
 * CoordinatorTransfers Page
 * 
 * Main dashboard for Transfer Coordinators to manage hospital transfers.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import {
  fetchTransfers,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  completeTransfer,
  cancelTransfer,
  fetchAvailableResponders,
  TRANSFER_STATUS,
  TRANSFER_PRIORITY,
  TRANSPORT_TYPE,
  subscribeToTransferUpdates,
  getStatusLabel,
  isTerminalStatus,
} from "../services/transfers";
import {
  TransferStatusBadge,
  TransferPriorityBadge,
  TransferDetailDrawer,
} from "../components/transfers";
import { useAuth } from "../context/AuthContext";
import { NavbarB } from "../components/Navbar_2";

// Status filter tabs
const STATUS_TABS = [
  { key: "pending_action", label: "Needs Action", icon: AlertTriangle },
  { key: "all", label: "All Transfers", icon: Truck },
  { key: TRANSFER_STATUS.PENDING, label: "Pending", icon: Clock },
  { key: TRANSFER_STATUS.APPROVED, label: "Approved", icon: CheckCircle },
  { key: TRANSFER_STATUS.IN_TRANSIT, label: "In Transit", icon: Truck },
  { key: TRANSFER_STATUS.COMPLETED, label: "Completed", icon: CheckCircle },
];

// Transfer direction filter
const DIRECTION_FILTERS = [
  { key: "all", label: "All" },
  { key: "outgoing", label: "Outgoing", icon: ArrowUpRight },
  { key: "incoming", label: "Incoming", icon: ArrowDownLeft },
];

const TransferCard = ({ transfer, userHospitalId, onClick, onQuickAction }) => {
  const isOutgoing = transfer.source_hospital_id === userHospitalId;
  const isIncoming = transfer.destination_hospital_id === userHospitalId;
  const needsAction =
    (isIncoming && transfer.status === TRANSFER_STATUS.PENDING) ||
    (transfer.status === TRANSFER_STATUS.ARRIVED && isIncoming);

  return (
    <div
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer ${
        needsAction ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
      }`}
      onClick={() => onClick(transfer)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Direction Badge */}
          <div className="flex items-center gap-2 mb-2">
            {isOutgoing && (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3" /> Outgoing
              </span>
            )}
            {isIncoming && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                <ArrowDownLeft className="h-3 w-3" /> Incoming
              </span>
            )}
            <TransferStatusBadge status={transfer.status} size="sm" />
            <TransferPriorityBadge priority={transfer.priority} size="sm" />
          </div>

          {/* Hospitals */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`truncate ${isOutgoing ? "font-medium" : "text-gray-600"}`}
            >
              {transfer.source_hospital?.name}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span
              className={`truncate ${isIncoming ? "font-medium" : "text-gray-600"}`}
            >
              {transfer.destination_hospital?.name}
            </span>
          </div>

          {/* Reason */}
          <p className="text-sm text-gray-500 mt-1 truncate">{transfer.reason}</p>

          {/* Timestamp & Responder */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(transfer.requested_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {transfer.assigned_responder && (
              <span className="truncate">
                Responder: {transfer.assigned_responder.name}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {needsAction && (
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            {isIncoming && transfer.status === TRANSFER_STATUS.PENDING && (
              <>
                <button
                  onClick={() => onQuickAction("approve", transfer)}
                  className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onQuickAction("reject", transfer)}
                  className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {transfer.status === TRANSFER_STATUS.ARRIVED && isIncoming && (
              <button
                onClick={() => onQuickAction("complete", transfer)}
                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                title="Complete"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// New Transfer Modal
const NewTransferModal = ({ isOpen, onClose, onSubmit, hospitals, loading }) => {
  const [formData, setFormData] = useState({
    destination_hospital_id: "",
    incident_id: "",
    reason: "",
    clinical_notes: "",
    priority: TRANSFER_PRIORITY.ROUTINE,
    transport_type: TRANSPORT_TYPE.BLS,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Request New Transfer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Submit a transfer request to another hospital
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Destination Hospital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Hospital *
            </label>
            <select
              value={formData.destination_hospital_id}
              onChange={(e) =>
                setFormData({ ...formData, destination_hospital_id: e.target.value })
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select hospital...</option>
              {hospitals?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Transfer *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why this transfer is needed..."
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Notes
            </label>
            <textarea
              value={formData.clinical_notes}
              onChange={(e) =>
                setFormData({ ...formData, clinical_notes: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional clinical information..."
            />
          </div>

          {/* Priority & Transport Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={TRANSFER_PRIORITY.ROUTINE}>Routine</option>
                <option value={TRANSFER_PRIORITY.URGENT}>Urgent</option>
                <option value={TRANSFER_PRIORITY.EMERGENT}>Emergent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Type
              </label>
              <select
                value={formData.transport_type}
                onChange={(e) =>
                  setFormData({ ...formData, transport_type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={TRANSPORT_TYPE.BLS}>BLS (Basic)</option>
                <option value={TRANSPORT_TYPE.ALS}>ALS (Advanced)</option>
                <option value={TRANSPORT_TYPE.CCT}>CCT (Critical Care)</option>
                <option value={TRANSPORT_TYPE.AIR}>Air Transport</option>
              </select>
            </div>
          </div>

          {/* Incident ID (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident ID (if applicable)
            </label>
            <input
              type="text"
              value={formData.incident_id}
              onChange={(e) =>
                setFormData({ ...formData, incident_id: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Link to existing incident..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dispatch Modal
const DispatchModal = ({ isOpen, onClose, transfer, onSubmit, loading }) => {
  const [responders, setResponders] = useState([]);
  const [selectedResponder, setSelectedResponder] = useState("");
  const [loadingResponders, setLoadingResponders] = useState(true);

  useEffect(() => {
    if (isOpen && transfer?.id) {
      loadResponders();
    }
  }, [isOpen, transfer?.id]);

  const loadResponders = async () => {
    try {
      setLoadingResponders(true);
      const data = await fetchAvailableResponders(transfer.id);
      setResponders(data || []);
    } catch (error) {
      console.error("Failed to load responders:", error);
    } finally {
      setLoadingResponders(false);
    }
  };

  const handleSubmit = () => {
    if (selectedResponder) {
      onSubmit(selectedResponder);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Dispatch Responder
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a responder to transport this patient
          </p>
        </div>

        <div className="p-6 space-y-4">
          {loadingResponders ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading responders...</p>
            </div>
          ) : responders.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-600">No available responders</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {responders.map((responder) => (
                <label
                  key={responder.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedResponder === responder.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="responder"
                    value={responder.id}
                    checked={selectedResponder === responder.id}
                    onChange={() => setSelectedResponder(responder.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedResponder === responder.id
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedResponder === responder.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{responder.name}</p>
                    <p className="text-sm text-gray-500">{responder.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedResponder}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoordinatorTransfers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("pending_action");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [drawerTransferId, setDrawerTransferId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Mock hospitals list (should come from API)
  const [hospitals, setHospitals] = useState([]);

  const userHospitalId = user?.hospital_id;

  const loadTransfers = useCallback(
    async (forceRefresh = false) => {
      try {
        if (forceRefresh) setRefreshing(true);
        else setLoading(true);

        const params = {};

        // Apply status filter
        if (statusFilter !== "all" && statusFilter !== "pending_action") {
          params.status = statusFilter;
        }

        // Apply direction filter
        if (directionFilter === "outgoing") {
          params.source_hospital_id = userHospitalId;
        } else if (directionFilter === "incoming") {
          params.destination_hospital_id = userHospitalId;
        }

        const data = await fetchTransfers(params, { forceRefresh });
        let transferList = data?.data || [];

        // Filter for pending action items
        if (statusFilter === "pending_action") {
          transferList = transferList.filter((t) => {
            const isIncoming = t.destination_hospital_id === userHospitalId;
            return (
              (isIncoming && t.status === TRANSFER_STATUS.PENDING) ||
              (t.status === TRANSFER_STATUS.ARRIVED && isIncoming) ||
              (t.status === TRANSFER_STATUS.APPROVED &&
                (t.source_hospital_id === userHospitalId || isIncoming))
            );
          });
        }

        setTransfers(transferList);
      } catch (error) {
        console.error("Failed to load transfers:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, directionFilter, userHospitalId]
  );

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (transfers.length === 0) return;

    const unsubscribes = transfers.map((transfer) =>
      subscribeToTransferUpdates(transfer.id, (updated) => {
        setTransfers((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub?.());
    };
  }, [transfers.length]);

  // Filter by search
  const filteredTransfers = transfers.filter((transfer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transfer.source_hospital?.name?.toLowerCase().includes(query) ||
      transfer.destination_hospital?.name?.toLowerCase().includes(query) ||
      transfer.reason?.toLowerCase().includes(query) ||
      transfer.uuid?.toLowerCase().includes(query)
    );
  });

  // Actions
  const handleCreateTransfer = async (formData) => {
    try {
      setActionLoading(true);
      await createTransfer(formData);
      setShowNewModal(false);
      loadTransfers(true);
    } catch (error) {
      console.error("Failed to create transfer:", error);
      alert(error.message || "Failed to create transfer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAction = async (action, transfer) => {
    try {
      setActionLoading(true);
      switch (action) {
        case "approve":
          await approveTransfer(transfer.id);
          break;
        case "reject":
          const rejectReason = prompt("Reason for rejection:");
          if (rejectReason) {
            await rejectTransfer(transfer.id, rejectReason);
          }
          break;
        case "dispatch":
          setSelectedTransfer(transfer);
          setShowDispatchModal(true);
          return;
        case "complete":
          await completeTransfer(transfer.id);
          break;
        case "cancel":
          const cancelReason = prompt("Reason for cancellation:");
          if (cancelReason) {
            await cancelTransfer(transfer.id, cancelReason);
          }
          break;
      }
      loadTransfers(true);
    } catch (error) {
      console.error(`Failed to ${action} transfer:`, error);
      alert(error.message || `Failed to ${action} transfer`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (responderId) => {
    try {
      setActionLoading(true);
      await dispatchTransfer(selectedTransfer.id, { responder_id: responderId });
      setShowDispatchModal(false);
      setSelectedTransfer(null);
      loadTransfers(true);
    } catch (error) {
      console.error("Failed to dispatch:", error);
      alert(error.message || "Failed to dispatch responder");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrawerAction = (action, transfer) => {
    setDrawerTransferId(null);
    if (action === "call") {
      // Handle call - would integrate with VoiceCallManager
      console.log("Call action for transfer:", transfer);
    } else {
      handleQuickAction(action, transfer);
    }
  };

  // Stats
  const pendingCount = transfers.filter(
    (t) =>
      t.destination_hospital_id === userHospitalId &&
      t.status === TRANSFER_STATUS.PENDING
  ).length;

  const inProgressCount = transfers.filter((t) =>
    [
      TRANSFER_STATUS.APPROVED,
      TRANSFER_STATUS.DISPATCHED,
      TRANSFER_STATUS.IN_TRANSIT,
      TRANSFER_STATUS.ARRIVED,
    ].includes(t.status)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarB />
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Transfer Coordinator
                </h1>
                <p className="text-sm text-gray-500">
                  Manage hospital-to-hospital transfers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadTransfers(true)}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>New Transfer</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {pendingCount} Pending Approval
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {inProgressCount} In Progress
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Direction Filter */}
          <div className="flex gap-2">
            {DIRECTION_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setDirectionFilter(filter.key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  directionFilter === filter.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.icon && <filter.icon className="h-4 w-4" />}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-6 border-t bg-gray-50 overflow-x-auto">
          <div className="flex gap-1 py-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading transfers...</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No transfers found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : statusFilter === "pending_action"
                ? "No transfers requiring your action"
                : "No transfers match the selected filters"}
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Create a new transfer request
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTransfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                userHospitalId={userHospitalId}
                onClick={(t) => setDrawerTransferId(t.id)}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewTransferModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateTransfer}
        hospitals={hospitals}
        loading={actionLoading}
      />

      <DispatchModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        onSubmit={handleDispatch}
        loading={actionLoading}
      />

      <TransferDetailDrawer
        transferId={drawerTransferId}
        isOpen={!!drawerTransferId}
        onClose={() => setDrawerTransferId(null)}
        onAction={handleDrawerAction}
        userRole={user?.role}
        userHospitalId={userHospitalId}
      />
    </div>
  );
};

export default CoordinatorTransfers;
