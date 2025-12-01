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
  Loader2,
  Image,
} from "lucide-react";
import "../../styles/chat.css";
import EchoClient, {
  reconnectEcho,
  getEchoInstance,
} from "../../services/echo";
import chatService from "../../services/chatService";
import { updateIncidentStatus } from "../../services/incidents";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../context/RealtimeContext";
import { useToast } from "../../hooks/use-toast";
import {
  conversationStore,
  updateConversationStore,
  resetConversationStore,
} from "../../context/conversationStore";
import {
  buildConversationBufferKey,
  insertMessageChronologically,
  isSameConversation,
  mergeConversationSnapshot,
  normalizePerson,
  normalizeConversation,
  normalizeMessage,
  sortConversationsByRecency,
} from "../../lib/chatUtils";

/**
 * Tab/View Selector for the Main Content Area
 */
const MainContentTabs = {
  INBOX: "Inbox",
  COMPOSE: "Compose",
};

const INCOMING_QUEUE_INITIAL_DELAY_MS = 60;
const INCOMING_QUEUE_ACTIVE_DRAIN_INTERVAL_MS = 4;
const INCOMING_QUEUE_PASSIVE_DRAIN_INTERVAL_MS = 12;
const INCOMING_QUEUE_HIGH_PRESSURE_THRESHOLD = 40;
const INCOMING_QUEUE_AGGRESSIVE_INTERVAL_MS = 2;

/**
 * Get initials from name for avatar
 */
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Component 1. Conversation List Item (iMessage-style)
 */
const ConversationListItem = ({ conversation, onSelect, isSelected }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const isEmergency = conversation.category === "Emergency";
  const hasUnread = conversation.unreadCount > 0;
  const isResolved = conversation.isArchived || conversation.status === "resolved";

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
      <div
        onClick={() => onSelect(conversation)}
        onContextMenu={handleContextMenu}
        className={`conversation-item ${isSelected ? "active" : ""}`}
      >
        {/* Avatar with initials */}
        <div className="conv-avatar">
          {conversation.participant.avatar ? (
            <img
              src={conversation.participant.avatar}
              alt={conversation.participant.name}
              className="conv-avatar-img"
            />
          ) : (
            <div className="conv-avatar-initials">
              {getInitials(conversation.participant.name)}
            </div>
          )}
          <div
            className={`conv-status-dot ${conversation.participant.isOnline ? "online" : "offline"}`}
          />
        </div>
        
        {/* Content */}
        <div className="conv-info">
          <div className="conv-header">
            <span className={`conv-name ${isEmergency ? "text-red-600" : ""}`}>
              {conversation.participant.name}
              {isEmergency && (
                <AlertCircle
                  size={12}
                  className={`inline ml-1 ${conversation.isActive ? "animate-pulse" : ""}`}
                />
              )}
            </span>
            <span className="conv-time">{timeFormatted}</span>
          </div>
          <div className="conv-preview">
            {conversation.messages?.length > 0 &&
              conversation.messages[conversation.messages.length - 1]?.isOwn && (
                <span className="check-icon">
                  {conversation.messages[conversation.messages.length - 1]?.isRead ? (
                    <CheckCheck size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                </span>
              )}
            <span>
              {conversation.lastMessage?.slice(0, 35) || "No messages yet"}
              {conversation.lastMessage?.length > 35 ? "..." : ""}
            </span>
          </div>
          {isResolved ? (
            <span className="conv-resolved-badge">Resolved</span>
          ) : hasUnread ? (
            <span className="conv-unread-badge">{conversation.unreadCount}</span>
          ) : null}
        </div>
      </div>
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
 * Component 2. Chat Thread View (iMessage-style)
 */
const ChatThread = ({
  conversation,
  currentUserId,
  onBack,
  onSendMessage,
  onResolveConversation,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isEmergency = conversation.category === "Emergency";
  const isArchived = conversation.isArchived;
  const canResolveIncident =
    Boolean(conversation.activeIncidentId) && !isArchived;

  useEffect(() => {
    if (isArchived) {
      setShowResolveModal(false);
      setResolveLoading(false);
    }
  }, [isArchived]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages, isTyping]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilePreview({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file",
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !filePreview) || isArchived) return;

    const textToSend = filePreview
      ? `📎 ${filePreview.name}${newMessage.trim() ? `\n${newMessage.trim()}` : ""}`
      : newMessage.trim();
    
    setNewMessage("");
    setFilePreview(null);

    Promise.resolve(onSendMessage(conversation, textToSend)).catch((error) => {
      console.error("Failed to send message:", error);
    });
  };

  const handleResolveClick = () => {
    if (!canResolveIncident) return;
    setResolveError("");
    setShowResolveModal(true);
  };

  const handleConfirmResolve = async () => {
    if (!canResolveIncident) {
      setResolveError("No active incident is linked to this chat.");
      return;
    }

    if (typeof onResolveConversation !== "function") {
      setResolveError("Resolve action is currently unavailable.");
      return;
    }

    setResolveLoading(true);
    setResolveError("");

    try {
      await onResolveConversation(conversation);
      setShowResolveModal(false);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to resolve this conversation.";
      setResolveError(message);
    } finally {
      setResolveLoading(false);
    }
  };

  const handleDismissResolveModal = () => {
    if (resolveLoading) return;
    setShowResolveModal(false);
    setResolveError("");
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

  // Group messages by date for display
  const groupMessages = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let header;
      if (date.toDateString() === today.toDateString()) {
        header = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        header = "Yesterday";
      } else {
        header = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      
      if (!groups[header]) groups[header] = [];
      groups[header].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessages(conversation.messages || []);

  return (
    <div className="chat-right-panel" style={{ borderRadius: 0, overflow: 'hidden' }}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <button
            onClick={onBack}
            className="chat-header-back lg:hidden"
          >
            ‹
          </button>
          
          {/* Avatar with initials */}
          {conversation.participant.avatar ? (
            <img
              src={conversation.participant.avatar}
              alt={conversation.participant.name}
              className="chat-header-avatar"
            />
          ) : (
            <div className="chat-header-avatar-initials">
              {getInitials(conversation.participant.name)}
            </div>
          )}
          
          <div className="chat-header-text">
            <h3>
              {conversation.participant.name}
              {isEmergency && (
                <AlertCircle
                  size={14}
                  className={`inline ml-2 text-red-600 ${
                    conversation.isActive ? "animate-pulse" : ""
                  }`}
                />
              )}
            </h3>
            <p style={{ color: conversation.participant.isOnline ? '#34c759' : '#8e8e93' }}>
              {conversation.participant.isOnline && !isArchived
                ? "Online"
                : isArchived
                ? "Archived"
                : "Offline"}
            </p>
          </div>
        </div>
        
        <div className="chat-header-actions">
          {!isArchived && (
            <button
              className="chat-header-btn resolve"
              onClick={handleResolveClick}
              disabled={!canResolveIncident}
              style={!canResolveIncident ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              title={
                !canResolveIncident
                  ? "This conversation is not linked to an active incident."
                  : undefined
              }
            >
              <Check size={16} />
              Mark Resolved
            </button>
          )}
          <button className="chat-header-btn more">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area - iMessage style */}
      <div className="chat-messages">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="chat-date-separator">
              <span>{date}</span>
            </div>
            
            {msgs.map((msg, index) => {
              const isOwnMessage =
                msg.senderId === currentUserId || msg.isOwn === true;
              const isSystemMessage = msg.isSystemMessage;
              const showAvatar =
                index === 0 || msgs[index - 1]?.senderId !== msg.senderId;

              if (isSystemMessage) {
                return (
                  <div key={msg.id} className="chat-date-separator">
                    <span style={{ background: '#dbeafe', color: '#1e40af' }}>{msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`message-row ${isOwnMessage ? "personnel" : "patient"}`}
                >
                  {/* Avatar for received messages */}
                  {!isOwnMessage && showAvatar && (
                    <div className="message-avatar">
                      {getInitials(conversation.participant.name)}
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && <div style={{ width: 28 }} />}

                  {/* Message Bubble */}
                  <div className="message-bubble">
                    <p className="message-text">{msg.text}</p>
                    <div className="message-time">
                      {formatMessageTime(msg.timestamp)}
                      {isOwnMessage && (
                        <span className="message-status">
                          {msg.deliveryStatus === "sending" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : msg.deliveryStatus === "failed" ? (
                            <AlertCircle size={12} className="text-red-500" />
                          ) : msg.isRead ? (
                            <CheckCheck size={14} />
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
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="file-preview">
          <span className="file-preview-icon">
            {filePreview.type === "image" ? <Image size={18} /> : <Paperclip size={18} />}
          </span>
          <span className="file-preview-name">{filePreview.name}</span>
          <button
            className="file-preview-remove"
            onClick={() => setFilePreview(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Message Input Area - iMessage style */}
      {isArchived ? (
        <div className="chat-input-bar" style={{ justifyContent: 'center' }}>
          <p style={{ color: '#6e6e73', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            This conversation has been closed and archived.
          </p>
        </div>
      ) : (
        <div className="chat-input-bar">
          <div className="chat-input-attachments">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              accept="image/*,.pdf,.doc,.docx"
            />
            <button
              className="chat-input-btn"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip size={18} />
            </button>
            <button
              className="chat-input-btn"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
              type="button"
            >
              <Image size={18} />
            </button>
          </div>
          
          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder={isEmergency ? "Type your emergency message..." : "Type a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend(e)}
            />
          </div>
          
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!newMessage.trim() && !filePreview}
            style={isEmergency ? { background: '#ff3b30' } : {}}
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {isEmergency && !isArchived && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#8e8e93', padding: '8px' }}>
          Emergency chat - Responder will reply as soon as possible
        </p>
      )}

      {showResolveModal && (
        <div className="chat-modal-overlay" role="dialog" aria-modal="true">
          <div className="chat-modal">
            <div className="chat-modal-icon warning">
              <Check size={22} />
            </div>
            <h3>Resolve &amp; Archive Conversation?</h3>
            <p>
              Confirm that the incident with {conversation.participant?.name || "this resident"}
              has been handled. This will archive the thread and disable further replies.
            </p>
            {resolveError && (
              <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginTop: -8, marginBottom: 18 }}>
                {resolveError}
              </p>
            )}
            <div className="chat-modal-actions">
              <button
                type="button"
                className="chat-modal-btn cancel"
                onClick={handleDismissResolveModal}
                disabled={resolveLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="chat-modal-btn confirm"
                onClick={handleConfirmResolve}
                disabled={resolveLoading}
              >
                {resolveLoading ? (
                  <Loader2 size={16} className="spinner" />
                ) : (
                  <Check size={16} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
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
  const { toast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(MainContentTabs.INBOX);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversations, setConversations] = useState(
    () => conversationStore.conversations
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(
    () => !conversationStore.hydrated
  );
  const [isRefreshingConversations, setIsRefreshingConversations] =
    useState(false);
  const [conversationsError, setConversationsError] = useState(
    () => conversationStore.error
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { presenceStatus, presenceError, onlineUsers, ensureConnected } =
    useRealtime();
  const inflightConversationFetch = useRef(new Set());
  const scheduledConversationRefreshes = useRef(new Map());
  const pendingIncomingMessages = useRef(new Map());
  const selectedConversationIdRef = useRef(null);
  const selectedConversationSnapshotRef = useRef(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

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
      resetConversationStore();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    let isCancelled = false;

    const hasCachedData =
      conversationStore.hydrated && conversationStore.conversations.length > 0;

    const loadConversations = async () => {
      if (!hasCachedData) {
        setIsLoadingConversations(true);
      } else {
        setIsRefreshingConversations(true);
      }
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
          updateConversationStore({
            conversations: normalized,
            error: null,
            hydrated: true,
            lastFetchedAt: Date.now(),
          });
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load conversations", error);
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load conversations.";
          setConversationsError(message);
          updateConversationStore({ error: message });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
          setIsRefreshingConversations(false);
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

  useEffect(() => {
    updateConversationStore((prev) => ({
      ...prev,
      conversations,
      hydrated: true,
    }));
  }, [conversations]);

  useEffect(() => {
    updateConversationStore((prev) => ({
      ...prev,
      error: conversationsError ?? null,
    }));
  }, [conversationsError]);

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
        // Pass incidentId to ensure we only fetch messages for the active incident.
        // This enforces incident-scoped messaging and prevents archived incident
        // messages from appearing in new conversations.
        const data = await chatService.getMessages(participantId, {
          incidentId: meta.incidentId || meta.activeIncidentId,
          conversationId: meta.conversationId,
        });
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

  useEffect(() => {
    let isActive = true;

    ensureConnected()
      .then((result) => {
        if (!isActive) return;
        if (!result?.ok) {
          console.warn("Presence channel connection not established", result);
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error("Failed to ensure realtime presence connection", error);
      });

    return () => {
      isActive = false;
    };
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

  const handleResolveConversation = useCallback(
    async (conversation) => {
      const incidentId =
        conversation?.activeIncidentId ??
        conversation?.incidentId ??
        null;

      if (!incidentId) {
        throw new Error("This conversation is not linked to an active incident.");
      }

      try {
        const response = await updateIncidentStatus(incidentId, {
          status: "resolved",
          notes: "Marked resolved from the responder messaging workspace.",
        });

        setConversations((prev) =>
          prev.map((conv) =>
            isSameConversation(conv, conversation)
              ? {
                  ...conv,
                  isArchived: true,
                  status: "resolved",
                  incidentStatus: "resolved",
                }
              : conv
          )
        );

        toast({
          title: "Incident resolved",
          description: `${conversation.participant?.name || "Conversation"} archived successfully.`,
        });

        return response;
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to resolve incident.";

        toast({
          variant: "destructive",
          title: "Failed to resolve",
          description: message,
        });

        const err = new Error(message);
        err.cause = error;
        throw err;
      }
    },
    [toast]
  );

  // Handlers for navigation
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
              onResolveConversation={handleResolveConversation}
            />
          );
        }
        return (
          <div className="chat-empty-state" style={{ background: '#ffffff', height: '100%' }}>
            <div className="chat-empty-icon">💬</div>
            <h3>Select a Conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        );
    }
  };

  return (
    <div className="chat-container">
      {/* Left Panel - Conversation List */}
      <div
        className={`chat-left-panel ${isDetailViewActive ? "hidden lg:flex" : "flex"}`}
      >
        <div className="chat-left-header">
          <h2>Messages</h2>
          <div className="chat-search">
            <span className="chat-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="chat-filters">
          <button
            className={`chat-filter-btn ${categoryFilter === "All" ? "active" : ""}`}
            onClick={() => setCategoryFilter("All")}
          >
            All
          </button>
          <button
            className={`chat-filter-btn ${categoryFilter === "Emergency" ? "active" : ""}`}
            onClick={() => setCategoryFilter("Emergency")}
          >
            Emergency
          </button>
          <button
            className={`chat-filter-btn ${categoryFilter === "General" ? "active" : ""}`}
            onClick={() => setCategoryFilter("General")}
          >
            General
          </button>
        </div>

        {/* Presence Status */}
        <div
          className={`shrink-0 mx-2 mb-2 rounded-xl border p-3 transition-colors ${presenceContainerClass}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5">{presenceIcon}</span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${presenceLabelClass}`}>
                {presenceLabel}
              </p>
              <p className={`text-xs mt-1 leading-snug ${presenceDescriptionClass}`}>
                {presenceDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="conversation-list">
          {isLoadingConversations ? (
            <p style={{ textAlign: 'center', color: '#8e8e93', padding: '16px' }}>
              Loading conversations...
            </p>
          ) : conversationsError ? (
            <p style={{ textAlign: 'center', color: '#ff3b30', padding: '16px' }}>
              {conversationsError}
            </p>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                onSelect={handleSelectConversation}
                isSelected={
                  selectedConversation && selectedConversation.id === conv.id
                }
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#8e8e93', padding: '16px' }}>
              No conversations found
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          )}
          {isRefreshingConversations && !isLoadingConversations && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#8e8e93', padding: '8px' }}>
              Syncing latest messages…
            </p>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div
        className={`chat-right-panel ${isDetailViewActive ? "flex" : "hidden lg:flex"}`}
      >
        {renderMainPanel()}
      </div>
    </div>
  );
}
