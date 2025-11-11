import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  User,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  FileText,
  Settings,
  Zap,
  Search,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  AlertCircle,
  CheckCheck,
  Check,
  Paperclip,
  Smile,
  MoreVertical,
} from "lucide-react";
import EchoClient, {
  reconnectEcho,
  getEchoInstance,
} from "../../services/echo";
import chatService from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

/**
 * Tab/View Selector for the Main Content Area
 */
const MainContentTabs = {
  INBOX: "Inbox",
  COMPOSE: "Compose",
};

// Generate a deterministic avatar URL when the backend does not provide one.
const buildAvatarUrl = (name, avatar) => {
  if (avatar) return avatar;
  const fallbackName = name ? encodeURIComponent(name) : "Responder";
  return `https://ui-avatars.com/api/?background=118A7E&color=fff&name=${fallbackName}`;
};
const normalizePerson = (person = {}, fallbackName = "Unknown") => {
  const name =
    person.name ||
    person.fullName ||
    person.displayName ||
    fallbackName;
  const avatarSource =
    person.avatar ||
    person.profile_image ||
    person.profile_image_url ||
    person.profileImage;

  return {
    id: person.id ?? null,
    name,
    role: person.role ?? person.category ?? "General",
    avatar: buildAvatarUrl(name, avatarSource),
    isOnline: person.isOnline ?? false,
  };
};

const normalizeMessage = (
  message = {},
  fallbackSenderName = "",
  currentUserId = null
) => {
  const timestamp =
    message.timestamp || message.created_at || new Date().toISOString();

  const senderSource =
    message.sender ?? message.sender_info ?? message.senderDetails ?? null;
  const receiverSource =
    message.receiver ?? message.receiver_info ?? message.receiverDetails ?? null;

  const senderObject =
    senderSource && typeof senderSource === "object" ? senderSource : null;
  const receiverObject =
    receiverSource && typeof receiverSource === "object" ? receiverSource : null;

  const senderId =
    message.senderId ??
    message.sender_id ??
    senderObject?.id ??
    null;
  const receiverId =
    message.receiverId ??
    message.receiver_id ??
    receiverObject?.id ??
    null;

  const senderName =
    (typeof senderSource === "string" && senderSource) ||
    senderObject?.name ||
    message.sender_name ||
    message.senderName ||
    fallbackSenderName ||
    "";

  const receiverName =
    (typeof receiverSource === "string" && receiverSource) ||
    receiverObject?.name ||
    message.receiver_name ||
    message.receiverName ||
    "";

  const senderInfo = senderObject
    ? normalizePerson(senderObject, senderName || fallbackSenderName)
    : null;

  const receiverInfo = receiverObject
    ? normalizePerson(receiverObject, receiverName)
    : null;

  return {
    id: message.id ?? `msg-${Math.random().toString(36).slice(2)}`,
    text: message.text ?? message.message ?? "",
    senderId,
    receiverId,
    sender: senderName,
    receiver: receiverName,
    senderInfo,
    receiverInfo,
    timestamp,
    isRead: message.isRead ?? false,
    isSystemMessage: message.isSystemMessage ?? false,
    isOwn:
      message.isOwn ??
      (currentUserId !== null && senderId !== null
        ? senderId === currentUserId
        : undefined),
  };
};

// Normalize API responses into a consistent shape for the UI components.
const normalizeConversation = (conversation = {}, currentUserId = null) => {
  const participantsRaw = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
  const senderRaw = conversation.sender ?? conversation.from;
  const receiverRaw = conversation.receiver ?? conversation.to;

  const participantFromPayload = conversation.participant ?? null;

  const findOtherParticipant = () => {
    if (currentUserId === null) {
      return participantFromPayload ?? participantsRaw[0] ?? senderRaw ?? receiverRaw ?? {};
    }

    const fromArray = participantsRaw.find(
      (person) => person?.id && person.id !== currentUserId
    );

    if (fromArray) {
      return fromArray;
    }

    if (participantFromPayload?.id && participantFromPayload.id !== currentUserId) {
      return participantFromPayload;
    }

    if (senderRaw?.id && senderRaw.id !== currentUserId) {
      return senderRaw;
    }

    if (receiverRaw?.id && receiverRaw.id !== currentUserId) {
      return receiverRaw;
    }

    return participantFromPayload ?? participantsRaw[0] ?? senderRaw ?? receiverRaw ?? {};
  };

  const rawParticipant = findOtherParticipant() ?? {};
  const participant = normalizePerson(rawParticipant);

  const normalizedParticipants = participantsRaw
    .map((person) => normalizePerson(person))
    .filter((person) => person.id !== null);

  const participantName = participant.name ?? "Unknown";
  const normalizedMessages = Array.isArray(conversation.messages)
    ? conversation.messages.map((msg) =>
        normalizeMessage(msg, participantName, currentUserId)
      )
    : [];
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];

  return {
    id:
      conversation.id ??
      conversation.conversationId ??
      (participant.id ? `user-${participant.id}` : "conversation-unknown"),
    conversationId: conversation.conversationId ?? conversation.id ?? null,
    participant,
    participants: normalizedParticipants,
    category: conversation.category ?? participant.role ?? "General",
    unreadCount: conversation.unreadCount ?? 0,
    isArchived: conversation.isArchived ?? false,
    lastMessage: conversation.lastMessage ?? lastMessage?.text ?? "",
    lastMessageTime:
      conversation.lastMessageTime ?? lastMessage?.timestamp ?? null,
    messages: normalizedMessages,
  };
};

const sortConversationsByRecency = (list = []) =>
  [...list].sort((a, b) => {
    const timeA = a?.lastMessageTime
      ? new Date(a.lastMessageTime).getTime()
      : 0;
    const timeB = b?.lastMessageTime
      ? new Date(b.lastMessageTime).getTime()
      : 0;
    return timeB - timeA;
  });

const isSameConversation = (conv, other) => {
  if (!conv || !other) return false;

  if (conv.conversationId && other.conversationId) {
    return conv.conversationId === other.conversationId;
  }

  if (conv.participant?.id && other.participant?.id) {
    return conv.participant.id === other.participant.id;
  }

  return conv.id === other.id;
};

/**
 * Component 1. Conversation List Item (Messenger-style)
 */
const ConversationListItem = ({ conversation, onSelect, isSelected }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const isEmergency = conversation.category === "Emergency";
  const hasUnread = conversation.unreadCount > 0;

  // Emergency conversations get special red styling
  // Selected state uses blue background for clean, non-conflicting selection
  const statusClass = isSelected
    ? "border-blue-300 bg-blue-50"
    : isEmergency
    ? hasUnread
      ? "border-red-400 bg-red-50"
      : "border-red-200 bg-red-50/50"
    : hasUnread
    ? "border-green-200 bg-green-50"
    : "bg-white hover:bg-gray-50 border-gray-100";

  const timeFormatted = conversation.lastMessageTime
    ? new Date(conversation.lastMessageTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    console.log("Archive conversation:", conversation.id);
    setShowContextMenu(false);
    // TODO: Implement archive functionality
  };

  const handleMarkUnread = (e) => {
    e.stopPropagation();
    console.log("Mark as unread:", conversation.id);
    setShowContextMenu(false);
    // TODO: Implement mark as unread functionality
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <li
        onClick={() => onSelect(conversation)}
        onContextMenu={handleContextMenu}
        className={`group relative p-3 cursor-pointer transition rounded-xl mb-2 border ${statusClass} ${
          isSelected ? "shadow-md" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={conversation.participant.avatar}
              alt={conversation.participant.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            {conversation.participant.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          {/* Content - Strictly Left-Aligned Vertical Stack */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top Row: Name with Emergency Icon + Timestamp */}
            <div className="flex justify-between items-center gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`font-semibold text-sm truncate ${
                    isEmergency ? "text-red-700" : "text-gray-900"
                  }`}
                >
                  {conversation.participant.name}
                </span>
                {isEmergency && (
                  <AlertCircle
                    size={14}
                    className={`shrink-0 text-red-600 ${
                      conversation.isActive ? "animate-pulse" : ""
                    }`}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500 shrink-0 ml-2">
                {timeFormatted}
              </span>
            </div>

            {/* Last Message - Left Aligned */}
            <p
              className={`text-sm text-left truncate mb-0.5 ${
                hasUnread
                  ? "font-semibold text-gray-900"
                  : "text-gray-600 font-normal"
              }`}
            >
              {conversation.lastMessage || "No messages yet"}
            </p>

            {/* Bottom Row: Role + Unread Badge - Left Aligned */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 text-left truncate">
                {conversation.participant.role}
              </span>
              {/* Show unread badge if unreadCount > 0 */}
              {conversation.unreadCount > 0 && (
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                    isEmergency
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </li>
      {/* Context Menu - Shows on Right Click */}
      {showContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={handleMarkUnread}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Mark as Unread
          </button>
          <button
            onClick={handleArchive}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Archive Conversation
          </button>
        </div>
      )}
    </>
  );
};

/**
 * Component 2. Chat Thread View (Messenger-style)
 */
const ChatThread = ({ conversation, currentUserId, onBack, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isEmergency = conversation.category === "Emergency";
  const isArchived = conversation.isArchived;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || isArchived) return;

    setIsSending(true);

    try {
      await onSendMessage(conversation, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-xl shadow-lg border ${
        isEmergency ? "border-red-400" : "border-gray-200"
      }`}
    >
      {/* Chat Header */}
      <div
        className={`shrink-0 p-4 border-b flex items-center justify-between rounded-t-xl ${
          isEmergency ? "bg-red-50 border-red-200" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onBack}
            className={`p-2 rounded-full hover:bg-white/50 transition ${
              isEmergency ? "text-red-700" : "text-gray-700"
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Participant Info */}
          <div className="relative">
            <img
              src={conversation.participant.avatar}
              alt={conversation.participant.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
            />
            {conversation.participant.isOnline && !isArchived && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`font-bold text-lg truncate ${
                  isEmergency ? "text-red-900" : "text-gray-900"
                }`}
              >
                {conversation.participant.name}
              </h3>
              {isEmergency && (
                <AlertCircle
                  size={18}
                  className={`text-red-600 ${
                    conversation.isActive ? "animate-pulse" : ""
                  }`}
                />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {conversation.participant.role}
              {conversation.participant.isOnline && !isArchived && (
                <span className="text-green-600 ml-2">● Online</span>
              )}
              {isArchived && (
                <span className="text-gray-500 ml-2">● Archived</span>
              )}
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-white/50 rounded-full transition text-gray-600">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {conversation.messages.map((msg, index) => {
          const isOwnMessage =
            msg.senderId === currentUserId || msg.isOwn === true;
          const isSystemMessage = msg.isSystemMessage;
          const showAvatar =
            index === 0 ||
            conversation.messages[index - 1]?.senderId !== msg.senderId;

          if (isSystemMessage) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-xs font-medium max-w-md text-center border border-blue-200">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isOwnMessage ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 shrink-0">
                {showAvatar && !isOwnMessage && (
                  <img
                    src={conversation.participant.avatar}
                    alt={msg.sender}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex flex-col max-w-[70%] ${
                  isOwnMessage ? "items-end" : "items-start"
                }`}
              >
                {showAvatar && (
                  <span className="text-xs text-gray-500 mb-1 px-2">
                    {msg.sender ||
                      (isOwnMessage ? "You" : conversation.participant.name)}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl shadow-sm ${
                    isOwnMessage
                      ? isEmergency
                        ? "bg-red-600 text-white"
                        : "bg-primary text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 mt-1 px-2 ${
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                  {isOwnMessage && (
                    <span className="text-gray-500">
                      {msg.isRead ? (
                        <CheckCheck size={14} className="text-blue-500" />
                      ) : (
                        <Check size={14} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div
        className={`shrink-0 p-4 border-t bg-white rounded-b-xl ${
          isArchived ? "opacity-50" : ""
        }`}
      >
        {isArchived ? (
          <div className="text-center p-3 bg-gray-100 rounded-xl">
            <p className="text-gray-600 font-semibold flex items-center justify-center gap-2">
              <AlertCircle size={18} className="text-gray-500" />
              This conversation has been closed and archived.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition shrink-0"
            >
              <Paperclip size={20} />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={
                  isEmergency
                    ? "Type your message to responder..."
                    : "Type a message..."
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary resize-none max-h-32 transition"
                rows="1"
                disabled={isSending}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                <Smile size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className={`p-3 rounded-full transition shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                isEmergency
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary hover:bg-green-700 text-white"
              }`}
            >
              {isSending ? (
                <div className="animate-spin">
                  <Send size={20} />
                </div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        )}

        {isEmergency && !isArchived && (
          <p className="text-xs text-center mt-2 text-gray-500">
            Emergency chat - Responder will reply as soon as possible
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Component 1. Secure Messaging - Compose View
 */
const MessageComposer = ({ initialSubject = "", onSend }) => {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState("Nurse");
  const [isSending, setIsSending] = useState(false);

  const recipients = ["Nurse", "PCP", "Billing", "Scheduling", "Records"];

  const handleSend = (e) => {
    e.preventDefault();
    if (!subject || !body) {
      alert("Subject and message body are required.");
      return;
    }

    setIsSending(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsSending(false);
      alert(`Message sent successfully to ${recipient}!\nSubject: ${subject}`);
      setSubject("");
      setBody("");
      setRecipient("Nurse");
      onSend(); // Switch back to inbox
    }, 1500);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
        <Plus size={24} className="text-primary" /> New Secure Message
      </h2>

      <form onSubmit={handleSend} className="space-y-4 flex-1 flex flex-col">
        {/* Recipient Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Recipient
          </label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-green-500 focus:border-green-500 transition"
            disabled={isSending}
          >
            {recipients.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 transition"
            placeholder="e.g., Question about my lab results"
            disabled={isSending}
          />
        </div>

        {/* Message Body */}
        <div className="flex-1 min-h-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 resize-none h-full min-h-[150px] transition"
            placeholder="Write your non-urgent message here..."
            disabled={isSending}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-primary hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} /> Send Secure Message
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Do not use for medical emergencies.
          </p>
        </div>
      </form>
    </div>
  );
};

// --- Main App Component ---

export default function MessagesContact() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(MainContentTabs.INBOX);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [presenceStatus, setPresenceStatus] = useState("idle");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceError, setPresenceError] = useState(null);

  // Derive detail view state for mobile master-detail pattern
  // derived further below once conversation data is enriched

  // Check if we're coming from emergency report with a filter state
  useEffect(() => {
    if (location.state?.filterCategory) {
      setCategoryFilter(location.state.filterCategory);
      setActiveTab(MainContentTabs.INBOX);
    }
  }, [location.state]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setConversations([]);
      setSelectedConversationId(null);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    let isCancelled = false;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const data = await chatService.getConversations();
        if (!isCancelled) {
          const normalized = sortConversationsByRecency(
            data.map((conversation) =>
              normalizeConversation(conversation, user?.id ?? null)
            )
          );

          setConversations(normalized);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load conversations", error);
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load conversations.";
          setConversationsError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user]);

  // Setup Echo presence channel for online status
  useEffect(() => {
    // Only connect if user is authenticated (has token)
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping Echo connection");
      setPresenceStatus("unauthenticated");
      setOnlineUsers([]);
      setPresenceError(null);
      return;
    }
    const echoInstance = getEchoInstance?.() || EchoClient;

    if (!echoInstance) {
      console.warn(
        "Echo instance is not available on window, skipping connection"
      );
      setPresenceStatus("error");
      setPresenceError("Realtime client is not available in this session.");
      return;
    }

    reconnectEcho();

    const authHeader =
      echoInstance.options?.auth?.headers?.Authorization || null;

    if (!authHeader) {
      console.warn("Echo auth header is missing, skipping connection");
      setPresenceStatus("unauthenticated");
      setPresenceError("Missing authentication token for realtime channel.");
      return;
    }

    setPresenceStatus("connecting");
    setPresenceError(null);
    setOnlineUsers([]);

    console.log("Connecting to Echo presence channel...");
    echoInstance
      .join("online")
      .here((users) => {
        const normalizedUsers = Array.isArray(users) ? [...users] : [];
        setOnlineUsers(normalizedUsers);
        setPresenceStatus("connected");
        setPresenceError(null);
        console.log("Users currently online:", normalizedUsers);
      })
      .joining((user) => {
        setOnlineUsers((prev) => {
          if (prev.some((existing) => existing?.id === user?.id)) {
            return prev;
          }
          return [...prev, user];
        });
        setPresenceStatus("connected");
        setPresenceError(null);
        console.log("User joined:", user);
      })
      .leaving((user) => {
        setOnlineUsers((prev) =>
          prev.filter((existing) => existing?.id !== user?.id)
        );
        console.log("User left:", user);
      })
      .error((error) => {
        console.error("Error with Echo channel:", error);
        const message =
          error?.message ??
          (typeof error?.error === "string"
            ? error.error
            : typeof error?.error?.message === "string"
            ? error.error.message
            : typeof error === "string"
            ? error
            : null);
        setPresenceStatus("error");
        setPresenceError(message || "Unable to join realtime channel.");
        setOnlineUsers([]);
      });

    // Cleanup: leave the channel when component unmounts
    return () => {
      console.log("Leaving Echo channel...");
      echoInstance.leave("online");
      setOnlineUsers([]);
      setPresenceStatus("idle");
      setPresenceError(null);
    };
  }, []);

  const conversationsWithPresence = useMemo(() => {
    if (!onlineUsers.length) {
      return conversations.map((conv) =>
        conv.participant.isOnline
          ? {
              ...conv,
              participant: { ...conv.participant, isOnline: false },
            }
          : conv
      );
    }

    return conversations.map((conv) => {
      const isOnline = onlineUsers.some(
        (user) => user?.id === conv.participant.id
      );
      if (conv.participant.isOnline === isOnline) {
        return conv;
      }

      return {
        ...conv,
        participant: {
          ...conv.participant,
          isOnline,
        },
      };
    });
  }, [conversations, onlineUsers]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return (
      conversationsWithPresence.find(
        (conv) => conv.id === selectedConversationId
      ) || null
    );
  }, [conversationsWithPresence, selectedConversationId]);

  const isDetailViewActive =
    !!selectedConversation || activeTab !== MainContentTabs.INBOX;

  const filteredConversations = useMemo(() => {
    let filtered = conversationsWithPresence;

    // Filter by category
    if (categoryFilter !== "All") {
      filtered = filtered.filter((conv) => conv.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const lowered = searchTerm.toLowerCase();
      filtered = filtered.filter((conv) => {
        const nameMatch = conv.participant?.name
          ?.toLowerCase()
          ?.includes(lowered);
        const lastMessageMatch = (conv.lastMessage || "")
          .toLowerCase()
          .includes(lowered);
        const messageMatch = conv.messages.some((msg) =>
          (msg.text || "").toLowerCase().includes(lowered)
        );

        return nameMatch || lastMessageMatch || messageMatch;
      });
    }

    return filtered;
  }, [conversationsWithPresence, searchTerm, categoryFilter]);

  const handleRealtimeMessage = useCallback(
    (payload) => {
      if (!payload?.message || !payload?.conversation) {
        return;
      }

      const normalizedConversation = normalizeConversation(
        payload.conversation,
        user?.id ?? null
      );
      let normalizedMessage = normalizeMessage(
        payload.message,
        normalizedConversation.participant?.name ?? "",
        user?.id ?? null
      );

      const isActiveConversation =
        !!selectedConversation &&
        isSameConversation(selectedConversation, normalizedConversation);

      if (isActiveConversation) {
        normalizedMessage = {
          ...normalizedMessage,
          isRead: true,
        };
      }

      setConversations((prev) => {
        let matchFound = false;

        const updated = prev.map((conv) => {
          if (!isSameConversation(conv, normalizedConversation)) {
            return conv;
          }

          matchFound = true;

          const messageExists = conv.messages.some(
            (msg) => msg.id === normalizedMessage.id
          );

          const messages = messageExists
            ? conv.messages.map((msg) =>
                msg.id === normalizedMessage.id ? normalizedMessage : msg
              )
            : [...conv.messages, normalizedMessage];

          return {
            ...conv,
            id: normalizedConversation.id ?? conv.id,
            conversationId:
              normalizedConversation.conversationId ?? conv.conversationId,
            participant: normalizedConversation.participant ?? conv.participant,
            participants:
              normalizedConversation.participants?.length
                ? normalizedConversation.participants
                : conv.participants,
            category: normalizedConversation.category ?? conv.category,
            lastMessage: normalizedMessage.text,
            lastMessageTime: normalizedMessage.timestamp,
            messages,
            unreadCount: isActiveConversation
              ? 0
              : messageExists
              ? conv.unreadCount
              : (conv.unreadCount ?? 0) + 1,
          };
        });

        if (!matchFound) {
          updated.push({
            ...normalizedConversation,
            messages: normalizedConversation.messages?.length
              ? normalizedConversation.messages
              : [normalizedMessage],
            unreadCount: isActiveConversation ? 0 : 1,
          });
        }

        return sortConversationsByRecency(updated);
      });

      if (
        isActiveConversation &&
        normalizedConversation.id &&
        normalizedConversation.id !== selectedConversationId
      ) {
        setSelectedConversationId(normalizedConversation.id);
      }
    },
    [selectedConversation, selectedConversationId, user?.id]
  );

  // Subscribe to realtime chat events
  useEffect(() => {
    if (!user) {
      return;
    }

    const echoInstance = getEchoInstance?.() || EchoClient;

    if (!echoInstance) {
      console.warn(
        "Echo instance is not available, cannot subscribe to chat events"
      );
      return;
    }

    reconnectEcho();

    const channelName = `chat.user.${user.id}`;
    let channel;

    try {
      channel = echoInstance.private(channelName);
      channel.listen(".message.sent", handleRealtimeMessage);
    } catch (subscriptionError) {
      console.error("Failed to subscribe to chat channel", subscriptionError);
      return () => {};
    }

    return () => {
      try {
        channel?.stopListening(".message.sent");
      } catch (stopError) {
        console.warn("Failed to stop listening to chat channel", stopError);
      }

      try {
        echoInstance.leave(channelName);
      } catch (leaveError) {
        console.warn("Failed to leave chat channel", leaveError);
      }
    };
  }, [user, handleRealtimeMessage]);

  const visibleOnlineNames = useMemo(() => {
    return onlineUsers
      .map((user) => user?.name ?? user?.user_info?.name ?? null)
      .filter(Boolean);
  }, [onlineUsers]);

  const maxNamesToShow = 3;
  const displayedNames = visibleOnlineNames.slice(0, maxNamesToShow);
  const hiddenCount = Math.max(
    visibleOnlineNames.length - displayedNames.length,
    0
  );

  let presenceContainerClass = "border-gray-200 bg-gray-50";
  let presenceLabelClass = "text-gray-800";
  let presenceDescriptionClass = "text-gray-600";
  let presenceIcon = <Clock size={16} className="text-gray-500" />;
  let presenceLabel = "Preparing realtime connection...";
  let presenceDescription = "Waiting for authentication to complete.";

  switch (presenceStatus) {
    case "connecting":
      presenceContainerClass = "border-amber-200 bg-amber-50";
      presenceLabelClass = "text-amber-700";
      presenceIcon = <Zap size={16} className="text-amber-600" />;
      presenceLabel = "Connecting to responders channel...";
      presenceDescription = "Authenticating and joining presence channel.";
      break;
    case "connected":
      presenceContainerClass = "border-green-200 bg-green-50";
      presenceLabelClass = "text-green-700";
      presenceIcon = <Check size={16} className="text-green-600" />;
      presenceLabel = `Connected (${visibleOnlineNames.length} online)`;
      presenceDescription = displayedNames.length
        ? `${displayedNames.join(", ")}${
            hiddenCount > 0 ? ` +${hiddenCount}` : ""
          }`
        : "Waiting for other responders to connect.";
      break;
    case "error":
      presenceContainerClass = "border-red-200 bg-red-50";
      presenceLabelClass = "text-red-700";
      presenceDescriptionClass = "text-red-600";
      presenceIcon = <AlertCircle size={16} className="text-red-600" />;
      presenceLabel = "Connection error";
      presenceDescription = presenceError || "Unable to join realtime channel.";
      break;
    case "unauthenticated":
      presenceContainerClass = "border-gray-200 bg-gray-50";
      presenceLabelClass = "text-gray-700";
      presenceIcon = <User size={16} className="text-gray-500" />;
      presenceLabel = "Sign in to join channel";
      presenceDescription = "Log in to see who is currently online.";
      break;
    case "idle":
    default:
      presenceContainerClass = "border-gray-200 bg-gray-50";
      presenceLabelClass = "text-gray-800";
      presenceDescriptionClass = "text-gray-600";
      presenceIcon = <Clock size={16} className="text-gray-500" />;
      presenceLabel = "Preparing realtime connection...";
      presenceDescription = "Waiting for authentication to complete.";
      break;
  }

  // Handle sending a new message
  const handleSendMessage = useCallback(
    async (conversation, messageText) => {
      if (!conversation || !user) return;

      const trimmed = messageText.trim();
      if (!trimmed) return;

      const receiverId = conversation.participant?.id;
      if (!receiverId) {
        console.warn("Conversation participant is missing an id");
        return;
      }

      try {
        const payload = await chatService.sendMessage({
          receiver_id: receiverId,
          message: trimmed,
        });

        const normalizedMessage = normalizeMessage(
          {
            ...payload,
            senderId: payload.senderId ?? user.id,
            sender: payload.sender ?? user.name,
            timestamp: payload.timestamp ?? new Date().toISOString(),
            isRead: true,
          },
          user.name,
          user.id
        );

        setConversations((prev) => {
          let matchedConversation = false;

          const updated = prev.map((conv) => {
            const sameConversation = isSameConversation(conv, conversation);

            if (!sameConversation) {
              return conv;
            }

            matchedConversation = true;

            const updatedMessages = [...conv.messages, normalizedMessage];

            return {
              ...conv,
              id: payload.conversationId ?? conv.id,
              conversationId: payload.conversationId ?? conv.conversationId,
              messages: updatedMessages,
              lastMessage: normalizedMessage.text,
              lastMessageTime: normalizedMessage.timestamp,
              unreadCount: 0,
            };
          });

          if (!matchedConversation) {
            const participantData =
              payload.participant ?? conversation.participant;
            const newConversation = normalizeConversation(
              {
                id: payload.conversationId,
                conversationId: payload.conversationId,
                participant: participantData,
                participants: payload.participants,
                sender: payload.sender,
                receiver: payload.receiver,
                messages: [normalizedMessage],
                lastMessage: normalizedMessage.text,
                lastMessageTime: normalizedMessage.timestamp,
              },
              user?.id ?? null
            );

            return sortConversationsByRecency([...updated, newConversation]);
          }

          return sortConversationsByRecency(updated);
        });

        setSelectedConversationId(payload.conversationId ?? conversation.id);
      } catch (error) {
        console.error("Failed to send message", error);
        throw error;
      }
    },
    [user]
  );

  // Handlers for navigation
  const navigateToInbox = () => {
    setActiveTab(MainContentTabs.INBOX);
    setSelectedConversationId(null);
  };

  const handleSelectConversation = (conversation) => {
    // Prevent page scroll when selecting conversation
    window.scrollTo({ top: 0, behavior: "instant" });

    setSelectedConversationId(conversation.id);
    setActiveTab(MainContentTabs.INBOX);

    // Mark messages as read
    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id
            ? {
                ...conv,
                unreadCount: 0,
                messages: conv.messages.map((msg) => ({
                  ...msg,
                  isRead: true,
                })),
              }
            : conv
        )
      );
    }
  };

  // Determine which component to render in the main panel
  const renderMainPanel = () => {
    switch (activeTab) {
      case MainContentTabs.COMPOSE:
        return <MessageComposer initialSubject="" onSend={navigateToInbox} />;
      case MainContentTabs.INBOX:
      default:
        // Show chat thread if a conversation is selected
        if (selectedConversation) {
          return (
            <ChatThread
              conversation={selectedConversation}
              currentUserId={user?.id ?? null}
              onBack={() => setSelectedConversationId(null)}
              onSendMessage={handleSendMessage}
            />
          );
        }
        return (
          <div className="p-6 text-center h-full flex flex-col justify-center items-center bg-white rounded-xl shadow-lg border">
            <MessageSquare size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Select a Conversation
            </h3>
            <p className="text-gray-500 mt-2">
              Choose a conversation from the list to view and send messages
            </p>
          </div>
        );
    }
  };

  const totalUnread = conversationsWithPresence.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className="flex flex-col h-full p-4 md:p-8 font-sans">
      {/* <header className="shrink-0 mb-6 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          Messages & Contact
        </h1>
      </header> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Conversation List and Navigation */}
        <aside
          className={`flex flex-col min-h-0 ${
            isDetailViewActive ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="bg-white p-4 rounded-xl shadow-xl border flex flex-col min-h-0 flex-1">
            {activeTab === MainContentTabs.INBOX && (
              <>
                <h3 className="shrink-0 text-lg font-bold text-gray-800 border-t pt-4 mb-2">
                  Conversations
                </h3>

                <div
                  className={`shrink-0 mb-3 rounded-xl border p-3 transition-colors ${presenceContainerClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5">{presenceIcon}</span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${presenceLabelClass}`}
                      >
                        {presenceLabel}
                      </p>
                      <p
                        className={`text-xs mt-1 leading-snug ${presenceDescriptionClass}`}
                      >
                        {presenceDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="shrink-0 relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>

                {/* Conversation List */}
                <ul className="flex-1 min-h-0 space-y-1 overflow-y-auto">
                  {isLoadingConversations ? (
                    <p className="text-center text-sm text-gray-500 p-4">
                      Loading conversations...
                    </p>
                  ) : conversationsError ? (
                    <p className="text-center text-sm text-red-500 p-4">
                      {conversationsError}
                    </p>
                  ) : filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <ConversationListItem
                        key={conv.id}
                        conversation={conv}
                        onSelect={handleSelectConversation}
                        isSelected={
                          selectedConversation &&
                          selectedConversation.id === conv.id
                        }
                      />
                    ))
                  ) : (
                    <p className="text-center text-sm text-gray-500 p-4">
                      No conversations found
                      {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                  )}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Right Column: Main Content Area */}
        <section
          className={`lg:col-span-2 flex flex-col items-center min-h-0 ${
            isDetailViewActive ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="w-full max-w-5xl h-full">{renderMainPanel()}</div>
        </section>
      </div>
    </div>
  );
}
