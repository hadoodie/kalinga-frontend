const listeners = new Set();

export const conversationStore = {
  conversations: [],
  error: null,
  hydrated: false,
  lastFetchedAt: null,
};

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener(conversationStore);
    } catch (error) {
      console.warn("conversationStore listener failed", error);
    }
  });
};

export const updateConversationStore = (updater) => {
  const baseState = {
    conversations: conversationStore.conversations,
    error: conversationStore.error,
    hydrated: conversationStore.hydrated,
    lastFetchedAt: conversationStore.lastFetchedAt,
  };

  const nextState =
    typeof updater === "function" ? updater(baseState) : { ...baseState, ...(updater ?? {}) };

  if (nextState.conversations !== undefined) {
    conversationStore.conversations = Array.isArray(nextState.conversations)
      ? nextState.conversations
      : [];
  }

  if (nextState.error !== undefined) {
    conversationStore.error = nextState.error;
  }

  if (nextState.hydrated !== undefined) {
    conversationStore.hydrated = !!nextState.hydrated;
  }

  if (nextState.lastFetchedAt !== undefined) {
    conversationStore.lastFetchedAt = nextState.lastFetchedAt;
  }

  notify();
  return conversationStore;
};

export const resetConversationStore = () => {
  conversationStore.conversations = [];
  conversationStore.error = null;
  conversationStore.hydrated = false;
  conversationStore.lastFetchedAt = null;
  notify();
};

export const subscribeToConversationStore = (listener) => {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
