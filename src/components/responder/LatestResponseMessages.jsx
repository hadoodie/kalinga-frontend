import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MessageSquare, Send } from "lucide-react";
import chatService from "../../services/chatService";
import {
  conversationStore,
  subscribeToConversationStore,
  updateConversationStore,
} from "../../context/conversationStore";
import {
  isSameConversation,
  normalizeConversation,
  normalizeMessage,
  sortConversationsByRecency,
} from "../../lib/chatUtils";

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

const selectConversationFromList = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) {
    return { conversation: null, messages: [] };
  }

  const sorted = sortConversationsByRecency(list);
  const emergencyConversation = sorted.find(
    (item) =>
      item.category === "Emergency" ||
      item.participant?.role === "patient" ||
      item.participant?.role === "resident"
  );

  const selected = emergencyConversation ?? sorted[0];

  return {
    conversation: selected,
    messages: Array.isArray(selected?.messages) ? [...selected.messages] : [],
  };
};

const buildInitialStateFromCache = () => {
  const { conversation, messages } = selectConversationFromList(
    conversationStore.conversations
  );

  return {
    conversation,
    messages,
    hydrated: conversationStore.hydrated,
    error: conversationStore.error ?? null,
  };
};

const LatestResponseMessages = ({ incident, refreshKey, currentUserId }) => {
  const cacheSeedRef = useRef(buildInitialStateFromCache());
  const [conversation, setConversation] = useState(
    cacheSeedRef.current.conversation
  );
  const [messages, setMessages] = useState(cacheSeedRef.current.messages);
  const [loading, setLoading] = useState(() => !cacheSeedRef.current.hydrated);
  const [error, setError] = useState(() => cacheSeedRef.current.error);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const conversationRef = useRef(conversation);
  const messagesRef = useRef(messages);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const incidentTitle = incident
    ? `${incident.type} • ${incident.location ?? "Unknown location"}`
    : null;

  const loadConversation = useCallback(async () => {
    setLoading((prev) => prev || !conversationRef.current);
    setError(null);

    try {
      const data = await chatService.getConversations();
      const normalizedConversations = sortConversationsByRecency(
        data.map((conversation) =>
          normalizeConversation(conversation, currentUserId ?? null)
        )
      );

      const { conversation: selectedConversation } = selectConversationFromList(
        normalizedConversations
      );

      if (!selectedConversation) {
        setConversation(null);
        setMessages([]);
        updateConversationStore({
          conversations: normalizedConversations,
          hydrated: true,
          error: null,
          lastFetchedAt: Date.now(),
        });
        setLoading(false);
        return;
      }

      let historyMessages = Array.isArray(selectedConversation.messages)
        ? [...selectedConversation.messages]
        : [];

      if (selectedConversation.participant?.id) {
        const history = await chatService.getMessages(
          selectedConversation.participant.id
        );
        historyMessages = Array.isArray(history)
          ? history.map((msg) =>
              normalizeMessage(
                msg,
                selectedConversation.participant?.name ?? "",
                currentUserId ?? null
              )
            )
          : [];
      }

      const enrichedConversations = normalizedConversations.map((conv) => {
        if (!isSameConversation(conv, selectedConversation)) {
          return conv;
        }

        const lastMessage =
          historyMessages[historyMessages.length - 1]?.text ?? conv.lastMessage;
        const lastMessageTime =
          historyMessages[historyMessages.length - 1]?.timestamp ??
          conv.lastMessageTime;

        return {
          ...conv,
          messages: historyMessages,
          lastMessage,
          lastMessageTime,
        };
      });

      const updatedSelectedConversation =
        enrichedConversations.find((conv) =>
          isSameConversation(conv, selectedConversation)
        ) ?? selectedConversation;

      setConversation(updatedSelectedConversation);
      setMessages(historyMessages);

      updateConversationStore({
        conversations: enrichedConversations,
        hydrated: true,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (conversationError) {
      console.error("Failed to load responder messages", conversationError);
      const message =
        conversationError?.response?.data?.message ||
        conversationError?.message ||
        "Unable to load responder messages.";
      setError(message);
      setConversation(null);
      setMessages([]);
      updateConversationStore({ error: message });
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribe = subscribeToConversationStore((store) => {
      if (!store) {
        return;
      }

      setError(store.error ?? null);

      if (store.error && !store.hydrated) {
        setLoading(false);
      }

      if (!store.hydrated) {
        return;
      }

      const { conversation: nextConversation, messages: nextMessages } =
        selectConversationFromList(store.conversations);

      if (!nextConversation) {
        setConversation(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      const currentConversation = conversationRef.current;

      if (
        !currentConversation ||
        !isSameConversation(currentConversation, nextConversation)
      ) {
        setConversation(nextConversation);
        setMessages(nextMessages);
      } else {
        const currentMessages = messagesRef.current;
        const hasDifferentLength =
          nextMessages.length !== currentMessages.length;
        const lastCurrent = currentMessages[currentMessages.length - 1]?.id;
        const lastNext = nextMessages[nextMessages.length - 1]?.id;

        if (hasDifferentLength || lastCurrent !== lastNext) {
          setMessages(nextMessages);
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadConversation();
  }, [currentUserId, loadConversation, refreshKey, incident?.id]);

  const handleSendMessage = useCallback(async () => {
    if (!conversation?.participant?.id || !draft.trim()) {
      return;
    }

    setSending(true);
    try {
      const payload = {
        receiver_id: conversation.participant.id,
        message: draft.trim(),
      };
      const response = await chatService.sendMessage(payload);
      const newMessage = {
        id: response?.id ?? `msg-${Date.now()}`,
        text: response?.message ?? draft.trim(),
        senderId: currentUserId,
        receiverId: conversation.participant.id,
        timestamp: response?.created_at ?? new Date().toISOString(),
        isOwn: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      setDraft("");
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: newMessage.text,
              lastMessageTime: newMessage.timestamp,
            }
          : prev
      );
      updateConversationStore((prev) => ({
        ...prev,
        conversations: prev.conversations.map((existing) => {
          if (!isSameConversation(existing, conversation)) {
            return existing;
          }

          const nextMessages = Array.isArray(existing.messages)
            ? [...existing.messages, newMessage]
            : [newMessage];

          return {
            ...existing,
            messages: nextMessages,
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.timestamp,
          };
        }),
        hydrated: true,
      }));
    } catch (sendError) {
      console.error("Failed to send message", sendError);
      const message =
        sendError?.response?.data?.message ||
        sendError?.message ||
        "Unable to send message.";
      window.alert(message);
    } finally {
      setSending(false);
    }
  }, [conversation, currentUserId, draft]);

  const emptyStateMessage = useMemo(() => {
    if (loading) {
      return null;
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      );
    }

    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-gray-500">
        <MessageSquare className="h-6 w-6 text-gray-400" />
        <p className="text-sm">
          No direct messages found for your latest response yet.
        </p>
        <p className="text-xs text-gray-400">
          Conversations will appear here once you start coordinating with the
          caller.
        </p>
      </div>
    );
  }, [error, loading]);

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Response coordination
        </p>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mt-1">
          <MessageSquare className="h-5 w-5 text-primary" />
          {incidentTitle ?? "Team Communication"}
        </h2>
        {conversation?.participant?.name ? (
          <p className="mt-1.5 text-sm text-gray-600">
            Conversation with {conversation.participant.name}
          </p>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages…
          </div>
        ) : conversation && messages.length > 0 ? (
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => {
                const isOwn =
                  message.isOwn ?? message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isOwn
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-line">{message.text}</p>
                      <span className="mt-1 block text-[10px] opacity-75">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          emptyStateMessage
        )}
      </div>

      {conversation?.participant?.id ? (
        <footer className="border-t border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type your message to the caller…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
};

export default LatestResponseMessages;
