/**
 * Communications Service
 * 
 * Handles Twilio voice calling integration for in-app communication
 * between responders and transfer coordinators.
 */

import api from "./api";
import { getEchoInstance } from "./echo";

// Call statuses
export const CALL_STATUS = {
  PENDING: "pending",
  RINGING: "ringing",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
  MISSED: "missed",
  DECLINED: "declined",
};

// Call types
export const CALL_TYPE = {
  VOICE: "voice",
};

/**
 * Get human-readable call status label
 */
export const getCallStatusLabel = (status) => {
  const labels = {
    [CALL_STATUS.PENDING]: "Connecting...",
    [CALL_STATUS.RINGING]: "Ringing",
    [CALL_STATUS.IN_PROGRESS]: "In Call",
    [CALL_STATUS.COMPLETED]: "Call Ended",
    [CALL_STATUS.FAILED]: "Failed",
    [CALL_STATUS.MISSED]: "Missed",
    [CALL_STATUS.DECLINED]: "Declined",
  };
  return labels[status] || status;
};

/**
 * Get call status color for UI
 */
export const getCallStatusColor = (status) => {
  const colors = {
    [CALL_STATUS.PENDING]: "yellow",
    [CALL_STATUS.RINGING]: "blue",
    [CALL_STATUS.IN_PROGRESS]: "green",
    [CALL_STATUS.COMPLETED]: "gray",
    [CALL_STATUS.FAILED]: "red",
    [CALL_STATUS.MISSED]: "orange",
    [CALL_STATUS.DECLINED]: "red",
  };
  return colors[status] || "gray";
};

/**
 * Check if call is active
 */
export const isCallActive = (status) => {
  return [
    CALL_STATUS.PENDING,
    CALL_STATUS.RINGING,
    CALL_STATUS.IN_PROGRESS,
  ].includes(status);
};

/**
 * Format call duration for display
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Get a Twilio access token for voice calling
 */
export const getVoiceToken = async (context = {}) => {
  const params = {};
  if (context.transferId) params.transfer_id = context.transferId;
  if (context.incidentId) params.incident_id = context.incidentId;

  const response = await api.get("/voice/token", { params });
  return response.data;
};

/**
 * Initiate a voice call
 */
export const initiateCall = async (recipientId, context = {}) => {
  const data = {
    recipient_id: recipientId,
  };
  if (context.transferId) data.transfer_id = context.transferId;
  if (context.incidentId) data.incident_id = context.incidentId;

  const response = await api.post("/voice/calls", data);
  return response.data;
};

/**
 * Answer an incoming call
 */
export const answerCall = async (callSessionId) => {
  const response = await api.post(`/voice/calls/${callSessionId}/answer`);
  return response.data;
};

/**
 * Decline an incoming call
 */
export const declineCall = async (callSessionId) => {
  const response = await api.post(`/voice/calls/${callSessionId}/decline`);
  return response.data;
};

/**
 * End an active call
 */
export const endCall = async (callSessionId) => {
  const response = await api.post(`/voice/calls/${callSessionId}/end`);
  return response.data;
};

/**
 * Mark call as ringing (device received call)
 */
export const markRinging = async (callSessionId) => {
  const response = await api.post(`/voice/calls/${callSessionId}/ringing`);
  return response.data;
};

/**
 * Get call session details
 */
export const getCallSession = async (callSessionId) => {
  const response = await api.get(`/voice/calls/${callSessionId}`);
  return response.data?.data;
};

/**
 * Get active calls for current user
 */
export const getActiveCalls = async () => {
  const response = await api.get("/voice/calls/active");
  return response.data?.data || [];
};

/**
 * Get call history
 */
export const getCallHistory = async (params = {}) => {
  const response = await api.get("/voice/calls/history", { params });
  return response.data;
};

/**
 * Subscribe to call events for a user
 */
export const subscribeToUserCalls = (userId, callbacks = {}) => {
  const echo = getEchoInstance();
  if (!echo) {
    console.warn("[communications] Echo not available");
    return null;
  }

  const channel = echo.private(`user.${userId}.calls`);

  channel.listen(".CallSessionUpdated", (event) => {
    const { call_session, action, actor } = event;
    
    switch (action) {
      case "initiated":
        callbacks.onIncomingCall?.(call_session, actor);
        break;
      case "ringing":
        callbacks.onRinging?.(call_session, actor);
        break;
      case "answered":
        callbacks.onAnswered?.(call_session, actor);
        break;
      case "declined":
        callbacks.onDeclined?.(call_session, actor);
        break;
      case "ended":
        callbacks.onEnded?.(call_session, actor);
        break;
      default:
        callbacks.onUpdate?.(call_session, action, actor);
    }
  });

  return {
    channel,
    unsubscribe: () => {
      echo.leave(`user.${userId}.calls`);
    },
  };
};

/**
 * Subscribe to transfer call events
 */
export const subscribeToTransferCalls = (transferId, callbacks = {}) => {
  const echo = getEchoInstance();
  if (!echo) {
    console.warn("[communications] Echo not available");
    return null;
  }

  const channel = echo.private(`transfer.${transferId}`);

  channel.listen(".CallSessionUpdated", (event) => {
    const { call_session, action, actor } = event;
    callbacks.onCallUpdate?.(call_session, action, actor);
  });

  return {
    channel,
    unsubscribe: () => {
      // Don't leave the transfer channel, just stop listening to calls
      channel.stopListening(".CallSessionUpdated");
    },
  };
};

/**
 * Subscribe to incident call events
 */
export const subscribeToIncidentCalls = (incidentId, callbacks = {}) => {
  const echo = getEchoInstance();
  if (!echo) {
    console.warn("[communications] Echo not available");
    return null;
  }

  const channel = echo.private(`incident.${incidentId}.calls`);

  channel.listen(".CallSessionUpdated", (event) => {
    const { call_session, action, actor } = event;
    callbacks.onCallUpdate?.(call_session, action, actor);
  });

  return {
    channel,
    unsubscribe: () => {
      echo.leave(`incident.${incidentId}.calls`);
    },
  };
};

/**
 * Voice call manager class for managing Twilio Device
 * This provides a higher-level interface for voice calls
 */
export class VoiceCallManager {
  constructor() {
    this.device = null;
    this.activeCall = null;
    this.token = null;
    this.listeners = new Set();
  }

  /**
   * Initialize Twilio Device with token
   */
  async initialize(context = {}) {
    // Dynamically import Twilio SDK
    const { Device } = await import("@twilio/voice-sdk");
    
    const tokenData = await getVoiceToken(context);
    this.token = tokenData.token;

    this.device = new Device(this.token, {
      logLevel: "warn",
      codecPreferences: ["opus", "pcmu"],
    });

    // Set up device event handlers
    this.device.on("registered", () => {
      this._emit("registered");
    });

    this.device.on("unregistered", () => {
      this._emit("unregistered");
    });

    this.device.on("error", (error) => {
      console.error("[VoiceCallManager] Device error:", error);
      this._emit("error", error);
    });

    this.device.on("incoming", (call) => {
      this.activeCall = call;
      this._setupCallHandlers(call);
      this._emit("incoming", call);
    });

    // Register the device
    await this.device.register();
    
    return this;
  }

  /**
   * Make an outgoing call
   */
  async call(recipientIdentity, context = {}) {
    if (!this.device) {
      throw new Error("Device not initialized. Call initialize() first.");
    }

    if (this.activeCall) {
      throw new Error("Already in a call.");
    }

    // Create call session on server first
    const callData = await initiateCall(
      recipientIdentity.replace("user_", "").split("_")[0], // Extract user ID
      context
    );

    const call = await this.device.connect({
      params: {
        To: `client:${recipientIdentity}`,
        callSessionId: callData.data.call_session.id,
      },
    });

    this.activeCall = call;
    this._setupCallHandlers(call);
    this._emit("outgoing", call);

    return call;
  }

  /**
   * Accept an incoming call
   */
  accept() {
    if (!this.activeCall) {
      throw new Error("No incoming call to accept.");
    }
    this.activeCall.accept();
    this._emit("accepted", this.activeCall);
  }

  /**
   * Reject an incoming call
   */
  reject() {
    if (!this.activeCall) return;
    this.activeCall.reject();
    this.activeCall = null;
    this._emit("rejected");
  }

  /**
   * Hang up the current call
   */
  hangup() {
    if (!this.activeCall) return;
    this.activeCall.disconnect();
    this.activeCall = null;
    this._emit("hangup");
  }

  /**
   * Mute/unmute the call
   */
  mute(shouldMute = true) {
    if (!this.activeCall) return;
    this.activeCall.mute(shouldMute);
    this._emit("mute", shouldMute);
  }

  /**
   * Check if currently muted
   */
  isMuted() {
    return this.activeCall?.isMuted() || false;
  }

  /**
   * Get call status
   */
  getStatus() {
    return this.activeCall?.status() || null;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.activeCall) {
      this.activeCall.disconnect();
      this.activeCall = null;
    }
    if (this.device) {
      this.device.unregister();
      this.device.destroy();
      this.device = null;
    }
    this.listeners.clear();
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    this.listeners.add({ event, callback });
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    this.listeners.forEach((listener) => {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
      }
    });
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }

  /**
   * Set up handlers for a call
   */
  _setupCallHandlers(call) {
    call.on("accept", () => {
      this._emit("connected", call);
    });

    call.on("disconnect", () => {
      this.activeCall = null;
      this._emit("disconnected", call);
    });

    call.on("cancel", () => {
      this.activeCall = null;
      this._emit("cancelled", call);
    });

    call.on("error", (error) => {
      console.error("[VoiceCallManager] Call error:", error);
      this._emit("callError", error);
    });

    call.on("reconnecting", (error) => {
      this._emit("reconnecting", error);
    });

    call.on("reconnected", () => {
      this._emit("reconnected");
    });
  }
}

// Singleton instance for convenience
let voiceManagerInstance = null;

export const getVoiceManager = () => {
  if (!voiceManagerInstance) {
    voiceManagerInstance = new VoiceCallManager();
  }
  return voiceManagerInstance;
};

export const destroyVoiceManager = () => {
  if (voiceManagerInstance) {
    voiceManagerInstance.destroy();
    voiceManagerInstance = null;
  }
};

export default {
  CALL_STATUS,
  CALL_TYPE,
  getCallStatusLabel,
  getCallStatusColor,
  isCallActive,
  formatDuration,
  getVoiceToken,
  initiateCall,
  answerCall,
  declineCall,
  endCall,
  markRinging,
  getCallSession,
  getActiveCalls,
  getCallHistory,
  subscribeToUserCalls,
  subscribeToTransferCalls,
  subscribeToIncidentCalls,
  VoiceCallManager,
  getVoiceManager,
  destroyVoiceManager,
};
