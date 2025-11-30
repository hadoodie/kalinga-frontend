import api from "./api";
import {
  cachedFetch,
  preloadCache,
  invalidateCache,
  getCached,
  setCached,
} from "../lib/apiCache";

// Cache TTLs
const CONVERSATIONS_TTL_MS = 15 * 1000; // 15 seconds
const MESSAGES_TTL_MS = 10 * 1000; // 10 seconds

// Cache keys
const CACHE_KEYS = {
  CONVERSATIONS: "chat:conversations",
  messages: (userId, incidentId) =>
    `chat:messages:${userId}:${incidentId ?? "all"}`,
};

const chatService = {
  /**
   * Get conversations with caching and SWR
   */
  async getConversations(options = {}) {
    const { forceRefresh = false } = options;

    const { data } = await cachedFetch(
      CACHE_KEYS.CONVERSATIONS,
      async () => {
        const response = await api.get("/chat/conversations");
        return response.data?.data ?? [];
      },
      {
        ttlMs: CONVERSATIONS_TTL_MS,
        forceRefresh,
        staleWhileRevalidate: true,
      }
    );

    return data;
  },

  /**
   * Get cached conversations instantly (for optimistic UI)
   */
  getCachedConversations() {
    return getCached(CACHE_KEYS.CONVERSATIONS);
  },

  /**
   * Preload conversations (fire-and-forget)
   */
  preloadConversations() {
    preloadCache(
      CACHE_KEYS.CONVERSATIONS,
      async () => {
        const response = await api.get("/chat/conversations");
        return response.data?.data ?? [];
      },
      CONVERSATIONS_TTL_MS
    );
  },

  /**
   * Fetches messages for a conversation with caching.
   *
   * IMPORTANT: When incidentId is provided, the API will ONLY return messages
   * scoped to that specific incident. This ensures that archived/closed incident
   * messages never appear in new conversations between the same patient/responder.
   *
   * @param {number} otherUserId - The ID of the other user in the conversation
   * @param {Object} options - Optional parameters
   * @param {number} [options.incidentId] - If provided, strictly filters messages to this incident only
   * @param {number} [options.conversationId] - If provided, filters by conversation ID
   * @param {boolean} [options.forceRefresh] - Skip cache, fetch fresh
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(otherUserId, options = {}) {
    const { incidentId, conversationId, forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.messages(otherUserId, incidentId);

    const { data } = await cachedFetch(
      cacheKey,
      async () => {
        const params = new URLSearchParams();

        if (incidentId) {
          params.append("incident_id", incidentId);
        }

        if (conversationId) {
          params.append("conversation_id", conversationId);
        }

        const queryString = params.toString();
        const url = `/chat/messages/${otherUserId}${
          queryString ? `?${queryString}` : ""
        }`;

        const response = await api.get(url);
        return response.data?.data ?? [];
      },
      {
        ttlMs: MESSAGES_TTL_MS,
        forceRefresh,
        staleWhileRevalidate: true,
      }
    );

    return data;
  },

  /**
   * Send message - invalidates relevant caches
   */
  async sendMessage(payload) {
    const response = await api.post("/chat/messages", payload);
    const result = response.data?.data ?? response.data;

    // Invalidate conversations cache to reflect new message
    invalidateCache(CACHE_KEYS.CONVERSATIONS);

    // Invalidate message cache for this conversation
    if (payload.receiver_id) {
      invalidateCache(`chat:messages:${payload.receiver_id}:*`);
    }

    return result;
  },

  /**
   * Merge a new message into cache (for realtime updates)
   */
  mergeMessageToCache(message, otherUserId, incidentId) {
    const cacheKey = CACHE_KEYS.messages(otherUserId, incidentId);
    const cached = getCached(cacheKey);

    if (cached && Array.isArray(cached)) {
      const exists = cached.some((msg) => msg.id === message.id);
      if (!exists) {
        setCached(cacheKey, [...cached, message], MESSAGES_TTL_MS);
      }
    }

    // Also invalidate conversations to update lastMessage
    invalidateCache(CACHE_KEYS.CONVERSATIONS);
  },
};

export default chatService;
