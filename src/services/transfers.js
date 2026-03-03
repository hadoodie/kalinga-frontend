/**
 * Transfer Service
 * 
 * Handles hospital-to-hospital transfer requests with workflow management,
 * attachments, and real-time updates via Echo.
 */

import api from "./api";
import { cachedFetch, invalidateCache, getCached, setCached } from "../lib/apiCache";
import { getEchoInstance } from "./echo";

// Cache TTLs
const TRANSFERS_TTL_MS = 15 * 1000; // 15 seconds
const TRANSFER_DETAIL_TTL_MS = 10 * 1000; // 10 seconds

// Cache keys
const CACHE_KEYS = {
  LIST: "transfers:list",
  DETAIL: (id) => `transfers:${id}`,
  HISTORY: (id) => `transfers:${id}:history`,
  RESPONDERS: "transfers:responders",
};

// Transfer statuses
export const TRANSFER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DISPATCHED: "dispatched",
  IN_TRANSIT: "in_transit",
  ARRIVED: "arrived",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Transfer priorities
export const TRANSFER_PRIORITY = {
  ROUTINE: "routine",
  URGENT: "urgent",
  EMERGENT: "emergent",
};

// Transport types
export const TRANSPORT_TYPE = {
  AMBULANCE: "ambulance",
  HELICOPTER: "helicopter",
  FIXED_WING: "fixed_wing",
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    [TRANSFER_STATUS.PENDING]: "Pending Approval",
    [TRANSFER_STATUS.APPROVED]: "Approved",
    [TRANSFER_STATUS.REJECTED]: "Rejected",
    [TRANSFER_STATUS.DISPATCHED]: "Dispatched",
    [TRANSFER_STATUS.IN_TRANSIT]: "In Transit",
    [TRANSFER_STATUS.ARRIVED]: "Arrived",
    [TRANSFER_STATUS.COMPLETED]: "Completed",
    [TRANSFER_STATUS.CANCELLED]: "Cancelled",
  };
  return labels[status] || status;
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status) => {
  const colors = {
    [TRANSFER_STATUS.PENDING]: "yellow",
    [TRANSFER_STATUS.APPROVED]: "blue",
    [TRANSFER_STATUS.REJECTED]: "red",
    [TRANSFER_STATUS.DISPATCHED]: "purple",
    [TRANSFER_STATUS.IN_TRANSIT]: "cyan",
    [TRANSFER_STATUS.ARRIVED]: "teal",
    [TRANSFER_STATUS.COMPLETED]: "green",
    [TRANSFER_STATUS.CANCELLED]: "gray",
  };
  return colors[status] || "gray";
};

/**
 * Get priority color for UI
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [TRANSFER_PRIORITY.ROUTINE]: "gray",
    [TRANSFER_PRIORITY.URGENT]: "orange",
    [TRANSFER_PRIORITY.EMERGENT]: "red",
  };
  return colors[priority] || "gray";
};

/**
 * Check if transfer is in terminal state
 */
export const isTerminalStatus = (status) => {
  return [
    TRANSFER_STATUS.COMPLETED,
    TRANSFER_STATUS.REJECTED,
    TRANSFER_STATUS.CANCELLED,
  ].includes(status);
};

/**
 * Fetch transfer requests list
 */
export const fetchTransfers = async (params = {}, options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = CACHE_KEYS.LIST;

  const result = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get("/transfers", { params });
      return response.data;
    },
    {
      ttlMs: TRANSFERS_TTL_MS,
      forceRefresh,
    }
  );

  return result.data;
};

/**
 * Fetch active transfers only
 */
export const fetchActiveTransfers = async (options = {}) => {
  return fetchTransfers({ active: true }, options);
};

/**
 * Fetch a single transfer by ID
 */
export const fetchTransfer = async (transferId, options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = CACHE_KEYS.DETAIL(transferId);

  const result = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get(`/transfers/${transferId}`);
      return response.data;
    },
    {
      ttlMs: TRANSFER_DETAIL_TTL_MS,
      forceRefresh,
    }
  );

  return result.data?.data;
};

/**
 * Fetch transfer audit history
 */
export const fetchTransferHistory = async (transferId, options = {}) => {
  const { forceRefresh = false, page = 1 } = options;
  const cacheKey = `${CACHE_KEYS.HISTORY(transferId)}:${page}`;

  const result = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get(`/transfers/${transferId}/history`, {
        params: { page },
      });
      return response.data;
    },
    {
      ttlMs: TRANSFER_DETAIL_TTL_MS,
      forceRefresh,
    }
  );

  return result.data;
};

/**
 * Create a new transfer request
 */
export const createTransfer = async (data) => {
  const response = await api.post("/transfers", data);
  invalidateCache(CACHE_KEYS.LIST);
  return response.data;
};

/**
 * Approve a transfer request
 */
export const approveTransfer = async (transferId, notes = null) => {
  const response = await api.post(`/transfers/${transferId}/approve`, { notes });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Reject a transfer request
 */
export const rejectTransfer = async (transferId, rejectionReason) => {
  const response = await api.post(`/transfers/${transferId}/reject`, {
    rejection_reason: rejectionReason,
  });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Dispatch a responder for the transfer
 */
export const dispatchTransfer = async (transferId, data) => {
  const response = await api.post(`/transfers/${transferId}/dispatch`, data);
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Mark patient pickup
 */
export const markPickup = async (transferId, data = {}) => {
  const response = await api.post(`/transfers/${transferId}/pickup`, data);
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Mark arrival at destination
 */
export const markArrival = async (transferId, data = {}) => {
  const response = await api.post(`/transfers/${transferId}/arrive`, data);
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Complete the transfer
 */
export const completeTransfer = async (transferId, notes = null) => {
  const response = await api.post(`/transfers/${transferId}/complete`, { notes });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Cancel a transfer
 */
export const cancelTransfer = async (transferId, cancellationReason) => {
  const response = await api.post(`/transfers/${transferId}/cancel`, {
    cancellation_reason: cancellationReason,
  });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Add a note to the transfer
 */
export const addTransferNote = async (transferId, notes) => {
  const response = await api.post(`/transfers/${transferId}/notes`, { notes });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Upload an attachment to the transfer (max 100MB)
 */
export const uploadAttachment = async (transferId, file, metadata = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  
  if (metadata.document_type) {
    formData.append("document_type", metadata.document_type);
  }
  if (metadata.description) {
    formData.append("description", metadata.description);
  }
  if (metadata.is_sensitive !== undefined) {
    formData.append("is_sensitive", metadata.is_sensitive ? "1" : "0");
  }

  const response = await api.post(`/transfers/${transferId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  invalidateTransferCache(transferId);
  return response.data;
};

/**
 * Get download URL for an attachment
 */
export const getAttachmentDownloadUrl = (transferId, attachmentId) => {
  const token = localStorage.getItem("token");
  const baseUrl = api.defaults.baseURL;
  return `${baseUrl}/transfers/${transferId}/attachments/${attachmentId}/download?token=${token}`;
};

/**
 * Fetch available responders for dispatch
 */
export const fetchAvailableResponders = async (options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = CACHE_KEYS.RESPONDERS;

  const result = await cachedFetch(
    cacheKey,
    async () => {
      const response = await api.get("/transfers/available-responders");
      return response.data;
    },
    {
      ttlMs: 60 * 1000, // 1 minute
      forceRefresh,
    }
  );

  return result.data?.data || [];
};

/**
 * Invalidate transfer caches
 */
const invalidateTransferCache = (transferId) => {
  invalidateCache(CACHE_KEYS.LIST);
  invalidateCache(CACHE_KEYS.DETAIL(transferId));
  invalidateCache(CACHE_KEYS.HISTORY(transferId));
};

/**
 * Get transfers from cache without fetching
 */
export const getCachedTransfers = () => {
  const cached = getCached(CACHE_KEYS.LIST);
  return cached?.data?.data || null;
};

/**
 * Merge a transfer update into cache (for realtime updates)
 */
export const mergeTransferToCache = (transfer) => {
  if (!transfer?.id) return;

  const cached = getCached(CACHE_KEYS.LIST);
  if (!cached?.data?.data) return;

  const currentData = cached.data.data;
  const index = currentData.findIndex((item) => item.id === transfer.id);
  let updated;

  if (index >= 0) {
    updated = [...currentData];
    updated[index] = { ...updated[index], ...transfer };
  } else {
    updated = [transfer, ...currentData];
  }

  setCached(
    CACHE_KEYS.LIST,
    { ...cached, data: { ...cached.data, data: updated } },
    TRANSFERS_TTL_MS
  );

  // Also update detail cache if exists
  const detailCached = getCached(CACHE_KEYS.DETAIL(transfer.id));
  if (detailCached) {
    setCached(
      CACHE_KEYS.DETAIL(transfer.id),
      { ...detailCached, data: { ...detailCached.data, data: transfer } },
      TRANSFER_DETAIL_TTL_MS
    );
  }
};

/**
 * Subscribe to real-time transfer updates
 */
export const subscribeToTransferUpdates = (callback) => {
  const echo = getEchoInstance();
  if (!echo) return () => {};

  const channel = echo.private("transfers");
  
  channel.listen(".TransferUpdated", (e) => {
    callback(e.transfer);
  });

  return () => {
    channel.stopListening(".TransferUpdated");
  };
};

/**
 * Document types for attachments
 */
export const DOCUMENT_TYPES = [
  { value: "medical_record", label: "Medical Record" },
  { value: "consent_form", label: "Consent Form" },
  { value: "transfer_summary", label: "Transfer Summary" },
  { value: "imaging", label: "Imaging/Radiology" },
  { value: "lab_result", label: "Lab Result" },
  { value: "other", label: "Other" },
];

export default {
  fetchTransfers,
  fetchActiveTransfers,
  fetchTransfer,
  fetchTransferHistory,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  markPickup,
  markArrival,
  completeTransfer,
  cancelTransfer,
  addTransferNote,
  uploadAttachment,
  getAttachmentDownloadUrl,
  fetchAvailableResponders,
  getCachedTransfers,
  mergeTransferToCache,
  TRANSFER_STATUS,
  TRANSFER_PRIORITY,
  TRANSPORT_TYPE,
  DOCUMENT_TYPES,
  getStatusLabel,
  getStatusColor,
  getPriorityColor,
  isTerminalStatus,
  subscribeToTransferUpdates,
};
