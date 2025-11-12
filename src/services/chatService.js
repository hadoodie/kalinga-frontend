import api from "./api";

const chatService = {
  async getConversations() {
    const response = await api.get("/chat/conversations");
    return response.data?.data ?? [];
  },

  async getMessages(otherUserId) {
    const response = await api.get(`/chat/messages/${otherUserId}`);
    return response.data?.data ?? [];
  },

  async sendMessage(payload) {
    const response = await api.post("/chat/messages", payload);
    return response.data?.data ?? response.data;
  },
};

export default chatService;
