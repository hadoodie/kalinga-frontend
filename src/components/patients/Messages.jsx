import { useState, useMemo, useEffect, useRef } from "react";
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

// --- MOCK DATA ---

// Conversations with message history (chat-style)
const MOCK_CONVERSATIONS = [
  {
    id: 1,
    participant: {
      name: "Dr. Leda Vance",
      role: "Primary Care Provider",
      avatar: "https://placehold.co/100x100/34D399/ffffff?text=LV",
      isOnline: true,
    },
    category: "Medical",
    lastMessage: "Great! Keep taking it with food as prescribed.",
    lastMessageTime: "2024-10-05T14:30:00Z",
    unreadCount: 0,
    messages: [
      {
        id: 101,
        sender: "Dr. Leda Vance",
        senderId: "doc1",
        text: "Hi Jane! How are you feeling with the new Lisinopril dosage?",
        timestamp: "2024-10-04T10:30:00Z",
        isRead: true,
      },
      {
        id: 102,
        sender: "You",
        senderId: "patient",
        text: "Hi Dr. Vance! I'm feeling much better. The 10mg seems to be working well.",
        timestamp: "2024-10-04T11:15:00Z",
        isRead: true,
      },
      {
        id: 103,
        sender: "Dr. Leda Vance",
        senderId: "doc1",
        text: "That's wonderful to hear! Any side effects like dizziness or dry cough?",
        timestamp: "2024-10-04T11:20:00Z",
        isRead: true,
      },
      {
        id: 104,
        sender: "You",
        senderId: "patient",
        text: "No side effects at all. Should I continue taking it in the morning?",
        timestamp: "2024-10-05T08:45:00Z",
        isRead: true,
      },
      {
        id: 105,
        sender: "Dr. Leda Vance",
        senderId: "doc1",
        text: "Great! Keep taking it with food as prescribed.",
        timestamp: "2024-10-05T14:30:00Z",
        isRead: true,
      },
    ],
  },
  {
    id: 2,
    participant: {
      name: "Billing Department",
      role: "Patient Services",
      avatar: "https://placehold.co/100x100/FBBF24/ffffff?text=BD",
      isOnline: false,
    },
    category: "Billing",
    lastMessage: "We'll process that right away. Thank you!",
    lastMessageTime: "2024-10-03T16:45:00Z",
    unreadCount: 2,
    messages: [
      {
        id: 201,
        sender: "Billing Department",
        senderId: "billing1",
        text: "Hello! We need clarification on your secondary insurance information for the September visit.",
        timestamp: "2024-10-03T15:15:00Z",
        isRead: true,
      },
      {
        id: 202,
        sender: "You",
        senderId: "patient",
        text: "Hi! My secondary insurance is Blue Cross. Policy number: BC-445566.",
        timestamp: "2024-10-03T16:30:00Z",
        isRead: true,
      },
      {
        id: 203,
        sender: "Billing Department",
        senderId: "billing1",
        text: "We'll process that right away. Thank you!",
        timestamp: "2024-10-03T16:45:00Z",
        isRead: false,
      },
      {
        id: 204,
        sender: "Billing Department",
        senderId: "billing1",
        text: "Your claim has been updated successfully.",
        timestamp: "2024-10-03T17:00:00Z",
        isRead: false,
      },
    ],
  },
  {
    id: 3,
    participant: {
      name: "Nurse Sarah",
      role: "Clinical Coordinator",
      avatar: "https://placehold.co/100x100/60A5FA/ffffff?text=NS",
      isOnline: true,
    },
    category: "Medical",
    lastMessage: "You can view them in your Health Records section now.",
    lastMessageTime: "2024-10-02T08:30:00Z",
    unreadCount: 0,
    messages: [
      {
        id: 301,
        sender: "Nurse Sarah",
        senderId: "nurse1",
        text: "Hi Jane! Your cholesterol panel results are ready.",
        timestamp: "2024-10-02T08:00:00Z",
        isRead: true,
      },
      {
        id: 302,
        sender: "You",
        senderId: "patient",
        text: "Thank you! Are there any concerns I should know about?",
        timestamp: "2024-10-02T08:15:00Z",
        isRead: true,
      },
      {
        id: 303,
        sender: "Nurse Sarah",
        senderId: "nurse1",
        text: "Everything looks good! Your levels are within normal range. Dr. Vance added some notes.",
        timestamp: "2024-10-02T08:25:00Z",
        isRead: true,
      },
      {
        id: 304,
        sender: "Nurse Sarah",
        senderId: "nurse1",
        text: "You can view them in your Health Records section now.",
        timestamp: "2024-10-02T08:30:00Z",
        isRead: true,
      },
    ],
  },
  {
    id: 4,
    participant: {
      name: "Emergency Responder - Mark Santos",
      role: "Emergency Response Team",
      avatar: "https://placehold.co/100x100/EF4444/ffffff?text=ER",
      isOnline: true,
    },
    category: "Emergency",
    lastMessage: "Stay where you are. ETA 8 minutes.",
    lastMessageTime: "2024-10-05T14:35:00Z",
    unreadCount: 3,
    isActive: true, // Active emergency
    messages: [
      {
        id: 401,
        sender: "System",
        senderId: "system",
        text: "Emergency report received. Responder Mark Santos has been assigned to your location.",
        timestamp: "2024-10-05T14:22:00Z",
        isRead: true,
        isSystemMessage: true,
      },
      {
        id: 402,
        sender: "Emergency Responder - Mark Santos",
        senderId: "responder1",
        text: "Hello! I've received your flood assistance request. What's your exact location?",
        timestamp: "2024-10-05T14:25:00Z",
        isRead: true,
      },
      {
        id: 403,
        sender: "You",
        senderId: "patient",
        text: "I'm at 123 Main Street, 2nd floor. Water is rising fast.",
        timestamp: "2024-10-05T14:27:00Z",
        isRead: true,
      },
      {
        id: 404,
        sender: "Emergency Responder - Mark Santos",
        senderId: "responder1",
        text: "Copy that. I'm en route with a rescue boat. Stay calm and move to the highest point in your building.",
        timestamp: "2024-10-05T14:30:00Z",
        isRead: false,
      },
      {
        id: 405,
        sender: "Emergency Responder - Mark Santos",
        senderId: "responder1",
        text: "Stay where you are. ETA 8 minutes.",
        timestamp: "2024-10-05T14:35:00Z",
        isRead: false,
      },
      {
        id: 406,
        sender: "You",
        senderId: "patient",
        text: "Okay, I'm on the 2nd floor balcony. Thank you!",
        timestamp: "2024-10-05T14:36:00Z",
        isRead: false,
      },
    ],
  },
  {
    id: 5,
    participant: {
      name: "Emergency Medical Services",
      role: "EMS Team",
      avatar: "https://placehold.co/100x100/9CA3AF/ffffff?text=EM",
      isOnline: false,
    },
    category: "Emergency",
    lastMessage: "Case closed. Take care!",
    lastMessageTime: "2024-09-28T10:00:00Z",
    unreadCount: 0,
    isActive: false, // Resolved emergency
    isArchived: true,
    messages: [
      {
        id: 501,
        sender: "System",
        senderId: "system",
        text: "Emergency medical request received. Paramedic dispatched to your location.",
        timestamp: "2024-09-28T09:15:00Z",
        isRead: true,
        isSystemMessage: true,
      },
      {
        id: 502,
        sender: "Paramedic Johnson",
        senderId: "ems1",
        text: "EMS arriving in 3 minutes. Is the patient conscious?",
        timestamp: "2024-09-28T09:17:00Z",
        isRead: true,
      },
      {
        id: 503,
        sender: "You",
        senderId: "patient",
        text: "Yes, conscious but experiencing chest pain.",
        timestamp: "2024-09-28T09:18:00Z",
        isRead: true,
      },
      {
        id: 504,
        sender: "Paramedic Johnson",
        senderId: "ems1",
        text: "We're here. Opening the door now.",
        timestamp: "2024-09-28T09:20:00Z",
        isRead: true,
      },
      {
        id: 505,
        sender: "System",
        senderId: "system",
        text: "Patient transported to St. Mary's Hospital. Emergency case resolved.",
        timestamp: "2024-09-28T09:45:00Z",
        isRead: true,
        isSystemMessage: true,
      },
      {
        id: 506,
        sender: "Emergency Medical Services",
        senderId: "ems1",
        text: "Case closed. Take care!",
        timestamp: "2024-09-28T10:00:00Z",
        isRead: true,
      },
    ],
  },
];

const MOCK_CARE_TEAM = [
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

const MOCK_GENERAL_CONTACTS = [
  {
    name: "Main Hospital Line",
    number: "(555) 500-1234",
    role: "General Inquiry",
  },
  { name: "Scheduling Office", number: "(555) 500-1235", role: "Appointments" },
  {
    name: "Billing & Insurance",
    number: "(555) 500-1236",
    role: "Payment Questions",
  },
];

// --- Sub-Components ---

/**
 * Tab/View Selector for the Main Content Area
 */
const MainContentTabs = {
  INBOX: "Inbox",
  COMPOSE: "Compose",
  CONTACTS: "Contacts",
  SUPPORT: "Support",
};

/**
 * Component 1. Conversation List Item (Messenger-style)
 */
const ConversationListItem = ({ conversation, onSelect, isSelected }) => {
  const isEmergency = conversation.category === "Emergency";
  const hasUnread = conversation.unreadCount > 0;

  // Emergency conversations get special red styling
  const statusClass = isEmergency
    ? hasUnread
      ? "border-red-400 bg-red-50"
      : "border-red-200 bg-red-50/50"
    : hasUnread
    ? "border-green-200 bg-green-50"
    : "bg-white hover:bg-gray-50 border-gray-100";

  const timeFormatted = new Date(conversation.lastMessageTime).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  return (
    <li
      onClick={() => onSelect(conversation)}
      className={`p-3 cursor-pointer transition rounded-xl mb-2 border ${statusClass} ${
        isSelected ? "ring-2 ring-green-500 shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3">
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
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
                  className={`text-red-600 ${
                    conversation.isActive ? "animate-pulse" : ""
                  }`}
                />
              )}
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {timeFormatted}
            </span>
          </div>

          <p
            className={`text-sm truncate ${
              hasUnread
                ? "font-semibold text-gray-900"
                : "text-gray-600 font-normal"
            }`}
          >
            {conversation.lastMessage}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {conversation.participant.role}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isEmergency
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {conversation.unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

/**
 * Component 2. Chat Thread View (Messenger-style)
 */
const ChatThread = ({ conversation, onBack, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isEmergency = conversation.category === "Emergency";
  const isArchived = conversation.isArchived;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || isArchived) return;

    setIsSending(true);

    // Simulate sending message
    setTimeout(() => {
      onSendMessage(conversation.id, newMessage);
      setNewMessage("");
      setIsSending(false);
    }, 500);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
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
      className={`flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-lg border ${
        isEmergency ? "border-red-400" : "border-gray-200"
      }`}
    >
      {/* Chat Header */}
      <div
        className={`p-4 border-b flex items-center justify-between rounded-t-xl ${
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {conversation.messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === "patient";
          const isSystemMessage = msg.isSystemMessage;
          const showAvatar =
            index === 0 ||
            conversation.messages[index - 1].senderId !== msg.senderId;

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
                    {msg.sender}
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
        className={`p-4 border-t bg-white rounded-b-xl ${
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
          <form onSubmit={handleSend} className="flex items-end gap-2">
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

/**
 * Component 2. Contact Directory
 */
const ContactDirectory = () => (
  <div className="space-y-8 p-6 bg-white rounded-xl shadow-lg border">
    <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
      <Phone size={24} className="text-primary" /> Contact Directory
    </h2>

    {/* My Care Team */}
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-1">
        My Care Team
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {MOCK_CARE_TEAM.map((member) => (
          <div
            key={member.name}
            className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 shadow-sm"
          >
            <img
              src={member.photo}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover shrink-0"
              onError={(e) =>
                (e.currentTarget.src = `https://placehold.co/100x100/A5B4FC/374151?text=${member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}`)
              }
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

    {/* General Hospital Contacts */}
    <div className="space-y-4 pt-4 border-t text-left">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-1">
        General Contact Numbers
      </h3>
      <div className="space-y-3">
        {MOCK_GENERAL_CONTACTS.map((contact) => (
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
);

/**
 * Component 3. Support & Self-Help
 */
const SupportSection = () => (
  <div className="p-6 bg-white rounded-xl shadow-lg border space-y-4">
    <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
      <HelpCircle size={24} className="text-green-600" /> Support & Self-Help
    </h2>

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
);

// --- Main App Component ---

export default function MessagesContact() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(MainContentTabs.INBOX);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Derive detail view state for mobile master-detail pattern
  const isDetailViewActive = selectedConversation || activeTab !== MainContentTabs.INBOX;

  // Check if we're coming from emergency report with a filter state
  useEffect(() => {
    if (location.state?.filterCategory) {
      setCategoryFilter(location.state.filterCategory);
      setActiveTab(MainContentTabs.INBOX);
    }
  }, [location.state]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by category
    if (categoryFilter !== "All") {
      filtered = filtered.filter((conv) => conv.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv.participant.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.messages.some((msg) =>
            msg.text.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    return filtered;
  }, [conversations, searchTerm, categoryFilter]);

  // Handle sending a new message
  const handleSendMessage = (conversationId, messageText) => {
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === conversationId) {
          const newMsg = {
            id: Date.now(),
            sender: "You",
            senderId: "patient",
            text: messageText,
            timestamp: new Date().toISOString(),
            isRead: false,
          };
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, newMsg],
            lastMessage: messageText,
            lastMessageTime: newMsg.timestamp,
          };
          // Update selectedConversation to reflect new message immediately
          setSelectedConversation(updatedConv);
          return updatedConv;
        }
        return conv;
      });
      return updated;
    });
  };

  // Handlers for navigation
  const navigateToCompose = () => {
    setActiveTab(MainContentTabs.COMPOSE);
    setSelectedConversation(null);
  };

  const navigateToInbox = () => {
    setActiveTab(MainContentTabs.INBOX);
    setSelectedConversation(null);
  };

  const handleSelectConversation = (conversation) => {
    // Prevent page scroll when selecting conversation
    window.scrollTo({ top: 0, behavior: "instant" });

    setSelectedConversation(conversation);
    setActiveTab(MainContentTabs.INBOX);

    // Mark messages as read
    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
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
              onBack={() => setSelectedConversation(null)}
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

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          Messages & Contact
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversation List and Navigation */}
        <aside className={`lg:col-span-1 space-y-6 ${isDetailViewActive ? "hidden lg:block" : "block"}`}>
          <div className="bg-white p-4 rounded-xl shadow-xl border">
            {/* New Message Button */}
            <button
              onClick={navigateToCompose}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2 transition shadow-md shadow-green-200"
            >
              <Plus size={20} /> New Message
            </button>

            {/* Main Tabs for Sidebar */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setActiveTab(MainContentTabs.INBOX);
                  setSelectedConversation(null);
                }}
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
                onClick={() => setActiveTab(MainContentTabs.CONTACTS)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.CONTACTS
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Phone size={20} /> Contact Directory
              </button>
              <button
                onClick={() => setActiveTab(MainContentTabs.SUPPORT)}
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
                <h3 className="text-lg font-bold text-gray-800 border-t pt-4 mb-2">
                  Conversations
                </h3>

                {/* Category Filter Tabs */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {["All", "Emergency", "Medical", "Billing"].map(
                    (category) => {
                      const count =
                        category === "All"
                          ? conversations.length
                          : conversations.filter((c) => c.category === category)
                              .length;
                      const isEmergency = category === "Emergency";
                      const emergencyUnread = isEmergency
                        ? conversations
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

                {/* Search Bar */}
                <div className="relative mb-3">
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
                <ul className="space-y-1 overflow-y-auto max-h-[40vh] md:max-h-[50vh]">
                  {filteredConversations.length > 0 ? (
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
        <section className={`lg:col-span-2 ${isDetailViewActive ? "block" : "hidden lg:block"}`}>{renderMainPanel()}</section>
      </div>
    </div>
  );
}
