import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Loader2,
} from "lucide-react";
import EchoClient, {
  reconnectEcho,
  getEchoInstance,
} from "../../services/echo";
import chatService from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../context/RealtimeContext";

/**
 * Tab/View Selector for the Main Content Area
 */
const MainContentTabs = {
  INBOX: "Inbox",
  COMPOSE: "Compose",
  CONTACTS: "Contacts",
  SUPPORT: "Support",
};

// Generate a deterministic avatar URL when the backend does not provide one.
const buildAvatarUrl = (name, avatar) => {
  if (avatar) return avatar;
  const fallbackName = name ? encodeURIComponent(name) : "Patient";
  return `https://ui-avatars.com/api/?background=118A7E&color=fff&name=${fallbackName}`;
};
const normalizePerson = (person = {}, fallbackName = "Unknown") => {
  const name =
    person.name || person.fullName || person.displayName || fallbackName;
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
    message.receiver ??
    message.receiver_info ??
    message.receiverDetails ??
    null;

  const senderObject =
    senderSource && typeof senderSource === "object" ? senderSource : null;
  const receiverObject =
    receiverSource && typeof receiverSource === "object"
      ? receiverSource
      : null;

  const senderId =
    message.senderId ?? message.sender_id ?? senderObject?.id ?? null;
  const receiverId =
    message.receiverId ?? message.receiver_id ?? receiverObject?.id ?? null;

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

  const isOwnMessage =
    message.isOwn ??
    (currentUserId !== null && senderId !== null
      ? senderId === currentUserId
      : undefined);

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
    isOwn: isOwnMessage,
    deliveryStatus:
      message.deliveryStatus ??
      (typeof isOwnMessage === "boolean"
        ? isOwnMessage
          ? "sent"
          : "delivered"
        : undefined),
    sendError: message.sendError ?? null,
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
      return (
        participantFromPayload ??
        participantsRaw[0] ??
        senderRaw ??
        receiverRaw ??
        {}
      );
    }

    const fromArray = participantsRaw.find(
      (person) => person?.id && person.id !== currentUserId
    );

    if (fromArray) {
      return fromArray;
    }

    if (
      participantFromPayload?.id &&
      participantFromPayload.id !== currentUserId
    ) {
      return participantFromPayload;
    }

    if (senderRaw?.id && senderRaw.id !== currentUserId) {
      return senderRaw;
    }

    if (receiverRaw?.id && receiverRaw.id !== currentUserId) {
      return receiverRaw;
    }

    return (
      participantFromPayload ??
      participantsRaw[0] ??
      senderRaw ??
      receiverRaw ??
      {}
    );
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

const sortConversationsByRecency = (list = []) => {
  return [...list].sort((a, b) => {
    const timeA = a?.lastMessageTime
      ? new Date(a.lastMessageTime).getTime()
      : 0;
    const timeB = b?.lastMessageTime
      ? new Date(b.lastMessageTime).getTime()
      : 0;
    return timeB - timeA;
  });
};

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

const INCOMING_QUEUE_INITIAL_DELAY_MS = 60;
const INCOMING_QUEUE_ACTIVE_DRAIN_INTERVAL_MS = 4;
const INCOMING_QUEUE_PASSIVE_DRAIN_INTERVAL_MS = 12;
const INCOMING_QUEUE_HIGH_PRESSURE_THRESHOLD = 40;
const INCOMING_QUEUE_AGGRESSIVE_INTERVAL_MS = 2;

const insertMessageChronologically = (messages, newMessage) => {
  if (!newMessage?.timestamp) {
    return [...messages, newMessage];
  }

  const newMessageTime = new Date(newMessage.timestamp).getTime();

  const insertIndex = messages.findIndex((existing) => {
    if (!existing?.timestamp) {
      return false;
    }

    return new Date(existing.timestamp).getTime() > newMessageTime;
  });

  if (insertIndex === -1) {
    return [...messages, newMessage];
  }

  return [
    ...messages.slice(0, insertIndex),
    newMessage,
    ...messages.slice(insertIndex),
  ];
};

const buildConversationBufferKey = (
  conversation,
  fallbackParticipantId = null
) => {
  if (conversation?.conversationId) {
    return `cid:${conversation.conversationId}`;
  }

  if (conversation?.id) {
    return `id:${conversation.id}`;
  }

  if (fallbackParticipantId) {
    return `participant:${fallbackParticipantId}`;
  }

  return null;
};

const mergeConversationSnapshot = (
  currentSnapshot = {},
  incomingSnapshot = {}
) => {
  const mergedMessages = Array.isArray(incomingSnapshot.messages)
    ? incomingSnapshot.messages.length
      ? incomingSnapshot.messages
      : Array.isArray(currentSnapshot.messages)
      ? currentSnapshot.messages
      : incomingSnapshot.messages
    : Array.isArray(currentSnapshot.messages)
    ? currentSnapshot.messages
    : [];

  const mergedParticipants = Array.isArray(incomingSnapshot.participants)
    ? incomingSnapshot.participants.length
      ? incomingSnapshot.participants
      : Array.isArray(currentSnapshot.participants)
      ? currentSnapshot.participants
      : incomingSnapshot.participants
    : Array.isArray(currentSnapshot.participants)
    ? currentSnapshot.participants
    : [];

  return {
    ...currentSnapshot,
    ...incomingSnapshot,
    id: incomingSnapshot.id ?? currentSnapshot.id ?? null,
    conversationId:
      incomingSnapshot.conversationId ?? currentSnapshot.conversationId ?? null,
    participant:
      incomingSnapshot.participant ?? currentSnapshot.participant ?? null,
    participants: mergedParticipants,
    category:
      incomingSnapshot.category ?? currentSnapshot.category ?? "General",
    messages: mergedMessages,
    lastMessage:
      incomingSnapshot.lastMessage ?? currentSnapshot.lastMessage ?? "",
    lastMessageTime:
      incomingSnapshot.lastMessageTime ??
      currentSnapshot.lastMessageTime ??
      null,
  };
};

const PATIENT_CARE_TEAM = [
  {
    name: "Dr. Leda Vance",
    role: "Primary Care Provider (PCP)",
    phone: "(555) 101-2000",
    email: "leda.vance@clinic.org",
    photo: "https://placehold.co/100x100/34D399/ffffff?text=LV",
  },
  {
    name: "Clinical Nurse Sarah",
    role: "RN, Patient Coordinator",
    phone: "(555) 101-2001",
    email: "sarah.rn@clinic.org",
    photo: "https://placehold.co/100x100/60A5FA/ffffff?text=SN",
  },
  {
    name: "Alex Chen",
    role: "Billing Specialist",
    phone: "(555) 101-2002",
    email: "alex.chen@clinic.org",
    photo: "https://placehold.co/100x100/FBBF24/ffffff?text=AC",
  },
];

const HOSPITAL_CONTACTS = [
  {
    name: "Main Hospital Line",
    number: "(555) 500-1234",
    role: "General Inquiry",
  },
  {
    name: "Scheduling Office",
    number: "(555) 500-1235",
    role: "Appointments",
  },
  {
    name: "Billing & Insurance",
    number: "(555) 500-1236",
    role: "Payment Questions",
  },
];

const getCurrentLocation = ({ timeout = 10000 } = {}) =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({
        ok: false,
        error: "Geolocation is not supported in this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (error) => {
        let message = error?.message || "Unable to acquire location.";

        switch (error?.code) {
          case error?.PERMISSION_DENIED:
            message = "Location permission denied by the user.";
            break;
          case error?.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error?.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            break;
        }

        resolve({ ok: false, error: message });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });

const buildMapsLink = (latitude, longitude) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

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

    return undefined;
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
  const messagesEndRef = useRef(null);

  const isEmergency = conversation.category === "Emergency";
  const isArchived = conversation.isArchived;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isArchived) return;

    const textToSend = newMessage.trim();
    setNewMessage("");

    Promise.resolve(onSendMessage(conversation, textToSend)).catch((error) => {
      console.error("Failed to send message:", error);
    });
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
            <p className="text-sm text-gray-600 text-left">
              {conversation.participant.isOnline && !isArchived && (
                <span className="text-green-600">● Online</span>
              )}
              {isArchived && (
                <span className="text-gray-500">● Archived</span>
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
                  <p className="text-sm whitespace-pre-wrap break-words text-left">
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
                  {isOwnMessage && msg.deliveryStatus === "sending" && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Sending…
                    </span>
                  )}
                  {isOwnMessage && msg.deliveryStatus === "failed" && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Not sent
                    </span>
                  )}
                  {isOwnMessage &&
                    (!msg.deliveryStatus ||
                      msg.deliveryStatus === "sent" ||
                      msg.deliveryStatus === "delivered") && (
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
              disabled={!newMessage.trim()}
              className={`p-3 rounded-full transition shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                isEmergency
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary hover:bg-green-700 text-white"
              }`}
            >
              <Send size={20} />
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

const ContactDirectory = () => (
  <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border">
    <h2 className="shrink-0 text-2xl font-bold text-gray-900 border-b p-6 pb-4 flex items-center gap-2">
      <Phone size={24} className="text-primary" /> Contact Directory
    </h2>

    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-1">
          My Care Team
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {PATIENT_CARE_TEAM.map((member) => (
            <div
              key={member.email}
              className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 shadow-sm"
            >
              <img
                src={member.photo}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                onError={(e) => {
                  const initials = member.name
                    .split(" ")
                    .map((part) => part[0] || "")
                    .join("");
                  e.currentTarget.src = `https://placehold.co/100x100/A5B4FC/374151?text=${initials}`;
                }}
              />
              <div>
                <p className="font-bold text-gray-900">{member.name}</p>
                <p className="text-sm text-green-700 font-medium">
                  {member.role}
                </p>
                <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                  <p className="flex items-center gap-1">
                    <Phone size={12} /> {member.phone}
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail size={12} /> {member.email}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t text-left">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-1">
          General Contact Numbers
        </h3>
        <div className="space-y-3">
          {HOSPITAL_CONTACTS.map((contact) => (
            <div
              key={contact.name}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
            >
              <div className="text-gray-800">
                <p className="font-medium">{contact.name}</p>
                <p className="text-xs text-gray-500">{contact.role}</p>
              </div>
              <a
                href={`tel:${contact.number}`}
                className="font-bold text-lg text-green-600 hover:text-green-800 transition"
              >
                {contact.number}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SupportSection = () => (
  <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border">
    <div className="shrink-0 p-6 border-b">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <HelpCircle size={24} className="text-green-600" /> Support & Self-Help
      </h2>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
      <p className="text-gray-600">
        Find quick answers to common questions about billing, appointments, and
        accessing your health records.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <a
          href="#"
          className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition shadow-sm"
        >
          <FileText size={24} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">FAQ & Knowledge Base</p>
            <p className="text-xs text-gray-600">
              Common questions about the portal and services.
            </p>
          </div>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition shadow-sm"
        >
          <Settings size={24} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Technical Support</p>
            <p className="text-xs text-gray-600">
              Troubleshoot login and site issues.
            </p>
          </div>
        </a>
      </div>

      <div className="pt-4 border-t mt-4">
        <p className="text-sm text-gray-500 italic">
          For medical emergencies, please call your local emergency number
          immediately.
        </p>
      </div>
    </div>
  </div>
);

// --- Main App Component ---

export default function MessagesContact() {
  const { user, loading: authLoading } = useAuth();
  const { onlineUsers, presenceStatus, presenceError, ensureConnected } =
    useRealtime();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(MainContentTabs.INBOX);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const inflightConversationFetch = useRef(new Set());
  const scheduledConversationRefreshes = useRef(new Map());
  const pendingIncomingMessages = useRef(new Map());
  const selectedConversationIdRef = useRef(null);
  const selectedConversationSnapshotRef = useRef(null);
  const [emergencyAction, setEmergencyAction] = useState({
    status: "idle",
    message: null,
  });
  const emergencyInFlightRef = useRef(false);
  const lastEmergencyTriggerRef = useRef(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (emergencyAction.status !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      setEmergencyAction({ status: "idle", message: null });
    }, 6000);

    return () => clearTimeout(timer);
  }, [emergencyAction.status]);

  useEffect(() => {
    if (!selectedConversationId) {
      selectedConversationSnapshotRef.current = null;
      return;
    }

    const match = conversations.find(
      (conv) => conv.id === selectedConversationId
    );

    selectedConversationSnapshotRef.current = match ?? null;
  }, [conversations, selectedConversationId]);

  const isConversationCurrentlyActive = useCallback((snapshot) => {
    if (!snapshot) {
      return false;
    }

    const selectedSnapshot = selectedConversationSnapshotRef.current;
    if (!selectedSnapshot) {
      return false;
    }

    return isSameConversation(selectedSnapshot, snapshot);
  }, []);

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

  useEffect(() => {
    const refreshTimers = scheduledConversationRefreshes.current;
    const bufferedMessagesRef = pendingIncomingMessages.current;

    return () => {
      refreshTimers.forEach((timer) => clearTimeout(timer));
      refreshTimers.clear();
      bufferedMessagesRef.forEach((entry) => {
        if (entry?.timer) {
          clearTimeout(entry.timer);
        }
      });
      bufferedMessagesRef.clear();
    };
  }, []);

  const refreshConversationMessages = useCallback(
    async (participantId, meta = {}) => {
      if (!user || !participantId) {
        return;
      }

      const key = `${participantId}:${meta.conversationId ?? ""}`;
      if (inflightConversationFetch.current.has(key)) {
        return;
      }

      inflightConversationFetch.current.add(key);

      try {
        const data = await chatService.getMessages(participantId);
        const normalizedMessages = data.map((msg) =>
          normalizeMessage(msg, "", user.id)
        );
        const latestMessage =
          normalizedMessages[normalizedMessages.length - 1] ?? null;

        const descriptor = {
          id:
            meta.id ??
            meta.conversationId ??
            (participantId ? `user-${participantId}` : undefined),
          conversationId: meta.conversationId ?? null,
          participant: { id: participantId },
        };

        setConversations((prev) =>
          sortConversationsByRecency(
            prev.map((conv) => {
              if (!isSameConversation(conv, descriptor)) {
                return conv;
              }

              return {
                ...conv,
                messages: normalizedMessages.map((message) => ({
                  ...message,
                  deliveryStatus:
                    message.deliveryStatus ??
                    (message.isOwn ? "sent" : "delivered"),
                  sendError: null,
                })),
                lastMessage: latestMessage?.text ?? conv.lastMessage,
                lastMessageTime:
                  latestMessage?.timestamp ?? conv.lastMessageTime,
              };
            })
          )
        );
      } catch (error) {
        console.error("Failed to refresh conversation messages", error);
      } finally {
        inflightConversationFetch.current.delete(key);
      }
    },
    [user]
  );

  const scheduleConversationRefresh = useCallback(
    (participantId, meta = {}) => {
      if (!participantId) {
        return;
      }

      const key = `${participantId}:${meta.conversationId ?? ""}`;
      if (scheduledConversationRefreshes.current.has(key)) {
        return;
      }

      const timer = setTimeout(() => {
        scheduledConversationRefreshes.current.delete(key);
        refreshConversationMessages(participantId, meta);
      }, 200);

      scheduledConversationRefreshes.current.set(key, timer);
    },
    [refreshConversationMessages]
  );

  const applyBufferedMessageToState = useCallback(
    (conversationSnapshot, message) => {
      if (!conversationSnapshot || !message) {
        return;
      }

      setConversations((prev) => {
        let matchFound = false;

        const updated = prev.map((conv) => {
          if (!isSameConversation(conv, conversationSnapshot)) {
            return conv;
          }

          matchFound = true;

          const isActive = isConversationCurrentlyActive(
            conversationSnapshot ?? conv
          );
          const preparedMessage = isActive
            ? { ...message, isRead: true }
            : message;

          const existingIndex = conv.messages.findIndex(
            (msg) => msg.id === preparedMessage.id
          );

          let nextMessages;
          if (existingIndex !== -1) {
            nextMessages = [
              ...conv.messages.slice(0, existingIndex),
              preparedMessage,
              ...conv.messages.slice(existingIndex + 1),
            ];
          } else {
            nextMessages = insertMessageChronologically(
              conv.messages,
              preparedMessage
            );
          }

          const lastMessage = nextMessages[nextMessages.length - 1] ?? null;

          return {
            ...conv,
            id: conversationSnapshot.id ?? conv.id,
            conversationId:
              conversationSnapshot.conversationId ?? conv.conversationId,
            participant: conversationSnapshot.participant ?? conv.participant,
            participants: conversationSnapshot.participants?.length
              ? conversationSnapshot.participants
              : conv.participants,
            category: conversationSnapshot.category ?? conv.category,
            lastMessage: lastMessage?.text ?? conv.lastMessage,
            lastMessageTime: lastMessage?.timestamp ?? conv.lastMessageTime,
            messages: nextMessages,
            unreadCount: isActive
              ? 0
              : existingIndex !== -1
              ? conv.unreadCount ?? 0
              : (conv.unreadCount ?? 0) + 1,
          };
        });

        if (!matchFound) {
          const isActive = isConversationCurrentlyActive(conversationSnapshot);
          const preparedMessage = isActive
            ? { ...message, isRead: true }
            : message;

          const baseMessages = Array.isArray(conversationSnapshot.messages)
            ? conversationSnapshot.messages.filter(Boolean)
            : [];

          const baseWithoutIncoming = baseMessages.filter(
            (existing) => existing?.id !== preparedMessage.id
          );

          const nextMessages = insertMessageChronologically(
            baseWithoutIncoming,
            preparedMessage
          );

          const finalLastMessage =
            nextMessages[nextMessages.length - 1] ?? preparedMessage ?? null;

          updated.push({
            ...conversationSnapshot,
            messages: nextMessages,
            lastMessage: finalLastMessage?.text ?? "",
            lastMessageTime: finalLastMessage?.timestamp ?? null,
            unreadCount: isActive ? 0 : 1,
          });
        }

        return sortConversationsByRecency(updated);
      });
    },
    [isConversationCurrentlyActive]
  );

  const flushBufferedIncomingMessages = useCallback(
    (conversationKey) => {
      const entry = pendingIncomingMessages.current.get(conversationKey);
      if (!entry) {
        return;
      }

      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }

      entry.state = "processing";

      const messagesOrdered = Array.from(entry.messages.values());
      if (!messagesOrdered.length) {
        entry.state = "idle";
        pendingIncomingMessages.current.delete(conversationKey);
        return;
      }

      messagesOrdered.sort((a, b) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });

      const nextMessage = messagesOrdered[0];
      entry.messages.delete(nextMessage.id);

      const conversationSnapshot = entry.conversation;
      const isActive = isConversationCurrentlyActive(conversationSnapshot);

      applyBufferedMessageToState(conversationSnapshot, nextMessage);

      if (entry.messages.size > 0) {
        const backlogSize = entry.messages.size;
        const delay =
          backlogSize > INCOMING_QUEUE_HIGH_PRESSURE_THRESHOLD
            ? INCOMING_QUEUE_AGGRESSIVE_INTERVAL_MS
            : isActive
            ? INCOMING_QUEUE_ACTIVE_DRAIN_INTERVAL_MS
            : INCOMING_QUEUE_PASSIVE_DRAIN_INTERVAL_MS;

        entry.timer = setTimeout(() => {
          flushBufferedIncomingMessages(conversationKey);
        }, Math.max(0, delay));
      } else {
        entry.state = "idle";
        pendingIncomingMessages.current.delete(conversationKey);
      }
    },
    [applyBufferedMessageToState, isConversationCurrentlyActive]
  );

  const bufferIncomingMessage = useCallback(
    (
      normalizedConversation,
      normalizedMessageWithStatus,
      otherParticipantId
    ) => {
      const bufferKey = buildConversationBufferKey(
        normalizedConversation,
        otherParticipantId
      );

      if (!bufferKey) {
        applyBufferedMessageToState(
          normalizedConversation,
          normalizedMessageWithStatus
        );
        return;
      }

      const isActiveConversation = isConversationCurrentlyActive(
        normalizedConversation
      );

      const existingEntry = pendingIncomingMessages.current.get(bufferKey);

      if (existingEntry) {
        existingEntry.state = existingEntry.state ?? "idle";
        existingEntry.conversation = mergeConversationSnapshot(
          existingEntry.conversation,
          normalizedConversation
        );
        existingEntry.messages.set(
          normalizedMessageWithStatus.id,
          normalizedMessageWithStatus
        );

        if (isActiveConversation) {
          if (existingEntry.timer) {
            clearTimeout(existingEntry.timer);
            existingEntry.timer = null;
          }

          if (existingEntry.state !== "processing") {
            existingEntry.state = "processing";
            flushBufferedIncomingMessages(bufferKey);
          }

          return;
        }

        if (existingEntry.state !== "processing" && !existingEntry.timer) {
          existingEntry.timer = setTimeout(() => {
            flushBufferedIncomingMessages(bufferKey);
          }, INCOMING_QUEUE_INITIAL_DELAY_MS);
        }

        return;
      }

      const entry = {
        conversation: mergeConversationSnapshot({}, normalizedConversation),
        messages: new Map([
          [normalizedMessageWithStatus.id, normalizedMessageWithStatus],
        ]),
        timer: null,
        state: "idle",
      };

      pendingIncomingMessages.current.set(bufferKey, entry);

      if (isActiveConversation) {
        entry.state = "processing";
        flushBufferedIncomingMessages(bufferKey);
      } else {
        entry.timer = setTimeout(() => {
          flushBufferedIncomingMessages(bufferKey);
        }, INCOMING_QUEUE_INITIAL_DELAY_MS);
      }
    },
    [
      flushBufferedIncomingMessages,
      applyBufferedMessageToState,
      isConversationCurrentlyActive,
    ]
  );

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const keysToFlush = [];

    pendingIncomingMessages.current.forEach((entry, key) => {
      if (!entry?.conversation) {
        return;
      }

      if (!isConversationCurrentlyActive(entry.conversation)) {
        return;
      }

      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }

      if (entry.state !== "processing") {
        entry.state = "processing";
        keysToFlush.push(key);
      }
    });

    keysToFlush.forEach((key) => {
      setTimeout(() => {
        flushBufferedIncomingMessages(key);
      }, 0);
    });
  }, [
    selectedConversationId,
    flushBufferedIncomingMessages,
    isConversationCurrentlyActive,
  ]);

  // Ensure realtime presence connection is established when this view mounts
  useEffect(() => {
    ensureConnected().catch((error) => {
      console.warn("Unable to establish realtime presence", error);
    });
  }, [ensureConnected]);

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

      const isIncomingMessage = normalizedMessage.senderId !== user?.id;

      const normalizedMessageWithStatus = {
        ...normalizedMessage,
        deliveryStatus:
          normalizedMessage.deliveryStatus ??
          (isIncomingMessage ? "delivered" : "sent"),
        sendError: null,
      };

      const participantCandidates = (normalizedConversation.participants || [])
        .concat(normalizedConversation.participant || [])
        .filter(Boolean);

      const otherParticipantId =
        participantCandidates
          .map((person) => person?.id)
          .find((id) => id && id !== user?.id) ??
        (payload.message?.senderId === user?.id
          ? payload.message?.receiverId
          : payload.message?.senderId);

      if (isIncomingMessage) {
        bufferIncomingMessage(
          normalizedConversation,
          normalizedMessageWithStatus,
          otherParticipantId
        );
      } else {
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
                  msg.id === normalizedMessage.id
                    ? normalizedMessageWithStatus
                    : msg
                )
              : [...conv.messages, normalizedMessageWithStatus];

            return {
              ...conv,
              id: normalizedConversation.id ?? conv.id,
              conversationId:
                normalizedConversation.conversationId ?? conv.conversationId,
              participant:
                normalizedConversation.participant ?? conv.participant,
              participants: normalizedConversation.participants?.length
                ? normalizedConversation.participants
                : conv.participants,
              category: normalizedConversation.category ?? conv.category,
              lastMessage: normalizedMessageWithStatus.text,
              lastMessageTime: normalizedMessageWithStatus.timestamp,
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
                : [normalizedMessageWithStatus],
              unreadCount: isActiveConversation ? 0 : 1,
            });
          }

          return sortConversationsByRecency(updated);
        });
      }

      if (
        isActiveConversation &&
        normalizedConversation.id &&
        normalizedConversation.id !== selectedConversationId
      ) {
        setSelectedConversationId(normalizedConversation.id);
      }

      if (otherParticipantId && isIncomingMessage) {
        scheduleConversationRefresh(otherParticipantId, {
          conversationId: normalizedConversation.conversationId ?? null,
          id: normalizedConversation.id ?? null,
        });
      }
    },
    [
      selectedConversation,
      selectedConversationId,
      user?.id,
      scheduleConversationRefresh,
      bufferIncomingMessage,
    ]
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
      presenceLabel = "Connecting...";
      presenceDescription = "Authenticating and joining presence channel.";
      break;
    case "connected":
      presenceContainerClass = "border-green-200 bg-green-50";
      presenceLabelClass = "text-green-700";
      presenceIcon = <Check size={16} className="text-green-600" />;
      presenceLabel = `Online (${visibleOnlineNames.length})`;
      presenceDescription = displayedNames.length
        ? `${displayedNames.join(", ")}${
            hiddenCount > 0 ? ` +${hiddenCount}` : ""
          }`
        : "Waiting for others to connect.";
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

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const timestamp = new Date().toISOString();

      const optimisticMessage = {
        id: tempId,
        clientId: tempId,
        text: trimmed,
        senderId: user.id,
        receiverId,
        sender: user.name,
        timestamp,
        isRead: true,
        isSystemMessage: false,
        isOwn: true,
        deliveryStatus: "sending",
        sendError: null,
      };

      setConversations((prev) => {
        let matchFound = false;

        const updated = prev.map((conv) => {
          if (!isSameConversation(conv, conversation)) {
            return conv;
          }

          matchFound = true;
          const messages = [...conv.messages, optimisticMessage];

          return {
            ...conv,
            messages,
            lastMessage: trimmed,
            lastMessageTime: timestamp,
            unreadCount: 0,
          };
        });

        if (!matchFound) {
          const fallbackParticipant = conversation.participant ?? {
            id: receiverId,
            name: "",
          };

          const normalizedParticipant = normalizePerson(
            fallbackParticipant,
            fallbackParticipant.name ?? ""
          );

          const newConversation = {
            ...conversation,
            id: conversation.id ?? `user-${receiverId}`,
            participant: normalizedParticipant,
            participants:
              Array.isArray(conversation.participants) &&
              conversation.participants.length
                ? conversation.participants.map((person) =>
                    normalizePerson(person)
                  )
                : [normalizedParticipant],
            messages: [optimisticMessage],
            lastMessage: trimmed,
            lastMessageTime: timestamp,
            unreadCount: 0,
          };

          return sortConversationsByRecency([...updated, newConversation]);
        }

        return sortConversationsByRecency(updated);
      });

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

        setConversations((prev) =>
          sortConversationsByRecency(
            prev.map((conv) => {
              const isTarget =
                isSameConversation(conv, conversation) ||
                (payload.conversationId &&
                  conv.conversationId === payload.conversationId);

              if (!isTarget) {
                return conv;
              }

              const updatedParticipant = payload.participant
                ? normalizePerson(payload.participant)
                : conv.participant;

              const updatedParticipants =
                Array.isArray(payload.participants) &&
                payload.participants.length
                  ? payload.participants.map((person) =>
                      normalizePerson(person)
                    )
                  : conv.participants;

              const messages = conv.messages.map((msg) =>
                msg.id === tempId
                  ? {
                      ...msg,
                      ...normalizedMessage,
                      id: normalizedMessage.id ?? payload.id ?? tempId,
                      clientId: tempId,
                      deliveryStatus: "sent",
                      sendError: null,
                      isOwn: true,
                    }
                  : msg
              );

              return {
                ...conv,
                id: payload.conversationId ?? conv.id,
                conversationId: payload.conversationId ?? conv.conversationId,
                participant: updatedParticipant,
                participants: updatedParticipants,
                lastMessage: normalizedMessage.text,
                lastMessageTime: normalizedMessage.timestamp,
                messages,
              };
            })
          )
        );

        if (payload.conversationId) {
          setSelectedConversationId((prevId) => {
            if (!prevId) {
              return prevId;
            }

            if (
              prevId === conversation.id ||
              prevId === conversation.conversationId ||
              prevId === `user-${receiverId}`
            ) {
              return payload.conversationId;
            }

            return prevId;
          });
        }
      } catch (error) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (!isSameConversation(conv, conversation)) {
              return conv;
            }

            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === tempId
                  ? {
                      ...msg,
                      deliveryStatus: "failed",
                      sendError:
                        error?.response?.data?.message ??
                        error?.message ??
                        "Failed to send message",
                    }
                  : msg
              ),
            };
          })
        );

        throw error;
      }
    },
    [user]
  );

  const triggerEmergencyConversation = useCallback(
    async (options = {}) => {
      if (!user) {
        setEmergencyAction({
          status: "error",
          message: "You must be signed in to send an emergency alert.",
        });
        return;
      }

      if (emergencyInFlightRef.current) {
        return;
      }

      emergencyInFlightRef.current = true;
      setEmergencyAction({
        status: "loading",
        message: "Contacting responders with your SOS...",
      });
      setCategoryFilter("Emergency");
      setActiveTab(MainContentTabs.INBOX);

      const realtimeResult = await ensureConnected();
      if (!realtimeResult?.ok) {
        console.warn("Realtime connection not ready for emergency alert", realtimeResult);
      }

      const triggeredAt = options.triggeredAt ?? new Date().toISOString();

      let locationInfo = options.location ?? null;
      let locationErrorMessage = options.locationError ?? null;

      if (!locationInfo && !options.skipGeolocation) {
        try {
          const result = await getCurrentLocation({ timeout: 12000 });
          if (result.ok) {
            locationInfo = result.coords;
          } else {
            locationErrorMessage = result.error;
          }
        } catch (error) {
          locationErrorMessage =
            error?.message || "Unable to retrieve location automatically.";
        }
      }

      const timestampLabel = new Date(triggeredAt).toLocaleString();
      let messageText = options.message ?? "";

      if (!messageText) {
        if (locationInfo) {
          const latNumber = Number(locationInfo.latitude);
          const lngNumber = Number(locationInfo.longitude);
          const hasCoordinates =
            Number.isFinite(latNumber) && Number.isFinite(lngNumber);
          const latDisplay = hasCoordinates
            ? latNumber.toFixed(5)
            : String(locationInfo.latitude ?? "");
          const lngDisplay = hasCoordinates
            ? lngNumber.toFixed(5)
            : String(locationInfo.longitude ?? "");
          const accuracyDisplay =
            typeof locationInfo.accuracy === "number"
              ? `Accuracy: ±${Math.round(locationInfo.accuracy)}m`
              : null;
          const mapLink = hasCoordinates
            ? buildMapsLink(latNumber, lngNumber)
            : null;

          messageText = [
            "🚨 Emergency SOS activated by patient.",
            `Time: ${timestampLabel}`,
            `Coordinates: ${latDisplay}, ${lngDisplay}`,
            accuracyDisplay,
            mapLink ? `Map: ${mapLink}` : null,
            options.notes ? `Notes: ${options.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        } else {
          messageText = [
            "🚨 Emergency SOS activated by patient.",
            `Time: ${timestampLabel}`,
            "Location: Unable to determine automatically.",
            locationErrorMessage ? `Details: ${locationErrorMessage}` : null,
            options.notes ? `Notes: ${options.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        }
      }

      const emergencyConversation = conversationsWithPresence.find(
        (conv) => conv.category === "Emergency"
      );
      const responderConversation = conversationsWithPresence.find(
        (conv) =>
          typeof conv.participant?.role === "string" &&
          conv.participant.role.toLowerCase() === "responder"
      );

      const presenceResponder = onlineUsers.find((candidate) => {
        const roleValue =
          typeof candidate?.role === "string"
            ? candidate.role
            : typeof candidate?.user_info?.role === "string"
            ? candidate.user_info.role
            : typeof candidate?.user?.role === "string"
            ? candidate.user.role
            : null;
        return roleValue?.toLowerCase() === "responder";
      });

      let targetConversation = null;
      if (options.conversationId) {
        targetConversation = conversationsWithPresence.find(
          (conv) => conv.id === options.conversationId
        );
      }
      if (!targetConversation) {
        targetConversation =
          emergencyConversation ?? responderConversation ?? null;
      }

      const envReceiverIdRaw = import.meta.env
        .VITE_EMERGENCY_DISPATCH_RECEIVER_ID;
      const envReceiverId = envReceiverIdRaw ? Number(envReceiverIdRaw) : null;

      const presenceResponderId = presenceResponder
        ? Number(
            presenceResponder.id ??
              presenceResponder.user_id ??
              presenceResponder.userId ??
              presenceResponder.user?.id ??
              presenceResponder.user_info?.id
          )
        : null;
      const sanitizedPresenceResponderId = Number.isFinite(presenceResponderId)
        ? presenceResponderId
        : null;

      const candidateReceiverId =
        options.receiverId ??
        targetConversation?.participant?.id ??
        sanitizedPresenceResponderId ??
        envReceiverId;

      const receiverId = Number(candidateReceiverId);

      if (!Number.isFinite(receiverId) || receiverId <= 0) {
        setEmergencyAction({
          status: "error",
          message:
            "No responder contact is available. Please call your local emergency number.",
        });
        emergencyInFlightRef.current = false;
        return;
      }

      const responderName =
        options.receiverName ??
        targetConversation?.participant?.name ??
        presenceResponder?.name ??
        presenceResponder?.user?.name ??
        presenceResponder?.user_info?.name ??
        "Emergency Dispatch";

      const participant =
        targetConversation?.participant ??
        normalizePerson(
          {
            id: receiverId,
            name: responderName,
            role: "Responder",
            profile_image:
              presenceResponder?.profile_image ??
              presenceResponder?.user?.profile_image ??
              presenceResponder?.user_info?.profile_image,
          },
          responderName
        );

      const responderParticipant = { ...participant, id: receiverId };

      const patientParticipant = normalizePerson(
        {
          id: user.id,
          name: user.name,
          role: user.role,
          profile_image: user.profile_image,
        },
        user.name
      );

      if (targetConversation && targetConversation.category !== "Emergency") {
        const updatedConversation = {
          ...targetConversation,
          category: "Emergency",
        };
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetConversation.id ? updatedConversation : conv
          )
        );
        targetConversation = updatedConversation;
      }

      const stubConversation = targetConversation ?? {
        id: `emergency-${receiverId}`,
        conversationId: null,
        participant: responderParticipant,
        participants: [responderParticipant, patientParticipant],
        category: "Emergency",
        messages: [],
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
      };

      const preparedConversation = {
        ...stubConversation,
        participant: responderParticipant,
        participants:
          Array.isArray(stubConversation.participants) &&
          stubConversation.participants.length
            ? stubConversation.participants
            : [responderParticipant, patientParticipant],
        category: "Emergency",
      };

      selectedConversationIdRef.current = preparedConversation.id;
      selectedConversationSnapshotRef.current = preparedConversation;
      setSelectedConversationId(preparedConversation.id);

      try {
        await handleSendMessage(preparedConversation, messageText);
        setEmergencyAction({
          status: "success",
          message: "Emergency alert sent to responders.",
        });
      } catch (error) {
        console.error("Failed to dispatch emergency SOS", error);
        setEmergencyAction({
          status: "error",
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Unable to send emergency alert. Please try again.",
        });
      } finally {
        emergencyInFlightRef.current = false;
      }
    },
    [
      user,
      conversationsWithPresence,
      onlineUsers,
      handleSendMessage,
      ensureConnected,
      setConversations,
      setCategoryFilter,
      setActiveTab,
      setSelectedConversationId,
      setEmergencyAction,
    ]
  );

  // Handlers for navigation
  const navigateToCompose = () => {
    setActiveTab(MainContentTabs.COMPOSE);
    setSelectedConversationId(null);
    selectedConversationIdRef.current = null;
    selectedConversationSnapshotRef.current = null;
  };

  useEffect(() => {
    const emergencyState = location.state?.startEmergencyChat;
    if (!emergencyState) {
      return;
    }

    const triggerId =
      emergencyState.triggeredAt ?? JSON.stringify(emergencyState);

    if (lastEmergencyTriggerRef.current === triggerId) {
      return;
    }

    lastEmergencyTriggerRef.current = triggerId;

    triggerEmergencyConversation({
      ...emergencyState,
      skipGeolocation: Boolean(emergencyState.location),
    });

    const nextState = location.state?.filterCategory
      ? { filterCategory: location.state.filterCategory }
      : null;

    navigate(location.pathname, {
      replace: true,
      state: nextState,
    });
  }, [location, navigate, triggerEmergencyConversation]);

  const navigateToContacts = () => {
    setActiveTab(MainContentTabs.CONTACTS);
    setSelectedConversationId(null);
  };

  const navigateToSupport = () => {
    setActiveTab(MainContentTabs.SUPPORT);
    setSelectedConversationId(null);
  };

  const navigateToInbox = () => {
    setActiveTab(MainContentTabs.INBOX);
    setSelectedConversationId(null);
  };

  const handleSelectConversation = (conversation) => {
    // Prevent page scroll when selecting conversation
    window.scrollTo({ top: 0, behavior: "instant" });

    selectedConversationIdRef.current = conversation.id;
    selectedConversationSnapshotRef.current = conversation;

    const bufferKey = buildConversationBufferKey(
      conversation,
      conversation?.participant?.id ?? null
    );

    if (bufferKey) {
      flushBufferedIncomingMessages(bufferKey);
    }

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
      case MainContentTabs.CONTACTS:
        return <ContactDirectory />;
      case MainContentTabs.SUPPORT:
        return <SupportSection />;
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
            <button
              onClick={navigateToCompose}
              className="shrink-0 w-full bg-primary hover:bg-green-700 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2 transition shadow-md shadow-green-200"
            >
              <Plus size={20} /> New Message
            </button>

            {emergencyAction.status !== "idle" && (
              <div
                className={`shrink-0 mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${
                  emergencyAction.status === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : emergencyAction.status === "loading"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                {emergencyAction.status === "loading" ? (
                  <Loader2 size={18} className="mt-1 animate-spin" />
                ) : (
                  <Zap
                    size={18}
                    className={`mt-1 ${
                      emergencyAction.status === "error"
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  />
                )}
                <div>
                  <p className="font-semibold mb-0.5">
                    {emergencyAction.status === "loading"
                      ? "Dispatching emergency alert..."
                      : emergencyAction.status === "success"
                      ? "Emergency alert sent"
                      : "Emergency alert failed"}
                  </p>
                  <p className="text-xs leading-snug">
                    {emergencyAction.message ||
                      (emergencyAction.status === "loading"
                        ? "Contacting responders with your emergency details."
                        : emergencyAction.status === "success"
                        ? "A responder has been notified and will follow up shortly."
                        : "Unable to notify responders automatically. Please try again or call your local emergency hotline.")}
                  </p>
                </div>
              </div>
            )}

            <div className="shrink-0 space-y-2 mb-4">
              <button
                onClick={navigateToInbox}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.INBOX
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MessageSquare size={20} /> Messages
                {totalUnread > 0 && (
                  <span className="ml-auto bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                onClick={navigateToContacts}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.CONTACTS
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Phone size={20} /> Contact Directory
              </button>
              <button
                onClick={navigateToSupport}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.SUPPORT
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <HelpCircle size={20} /> Support & FAQ
              </button>
            </div>

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

                <div className="shrink-0 flex gap-2 mb-3 flex-wrap">
                  {["All", "Emergency", "Medical", "Billing"].map(
                    (category) => {
                      const count =
                        category === "All"
                          ? conversationsWithPresence.length
                          : conversationsWithPresence.filter(
                              (c) => c.category === category
                            ).length;
                      const isEmergency = category === "Emergency";
                      const emergencyUnread = isEmergency
                        ? conversationsWithPresence
                            .filter((c) => c.category === "Emergency")
                            .reduce((sum, c) => sum + c.unreadCount, 0)
                        : 0;

                      return (
                        <button
                          key={category}
                          onClick={() => setCategoryFilter(category)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                            categoryFilter === category
                              ? isEmergency
                                ? "bg-red-600 text-white"
                                : "bg-primary text-white"
                              : isEmergency
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {isEmergency && (
                            <AlertCircle
                              size={14}
                              className={
                                emergencyUnread > 0 ? "animate-pulse" : ""
                              }
                            />
                          )}
                          {category}
                          {count > 0 && ` (${count})`}
                        </button>
                      );
                    }
                  )}
                </div>

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
