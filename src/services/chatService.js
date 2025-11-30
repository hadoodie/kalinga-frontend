import api from "./api";

const chatService = {
  async getConversations() {
    const response = await api.get("/chat/conversations");
    return response.data?.data ?? [];
  },

  /**
   * Fetches messages for a conversation.
   *
   * IMPORTANT: When incidentId is provided, the API will ONLY return messages
   * scoped to that specific incident. This ensures that archived/closed incident
   * messages never appear in new conversations between the same patient/responder.
   *
   * @param {number} otherUserId - The ID of the other user in the conversation
   * @param {Object} options - Optional parameters
   * @param {number} [options.incidentId] - If provided, strictly filters messages to this incident only
   * @param {number} [options.conversationId] - If provided, filters by conversation ID
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(otherUserId, options = {}) {
    const params = new URLSearchParams();

    if (options.incidentId) {
      params.append("incident_id", options.incidentId);
    }

    if (options.conversationId) {
      params.append("conversation_id", options.conversationId);
    }

    const queryString = params.toString();
    const url = `/chat/messages/${otherUserId}${queryString ? `?${queryString}` : ""}`;

    const response = await api.get(url);
    return response.data?.data ?? [];
  },

  async sendMessage(payload) {
    const response = await api.post("/chat/messages", payload);
    return response.data?.data ?? response.data;
  },
};

export default chatService;
