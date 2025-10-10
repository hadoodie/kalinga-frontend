import { useState, useMemo } from 'react';
import { 
  Send, User, Clock, Phone, Mail, MessageSquare, Plus, FileText, 
  Settings, Zap, Search, HelpCircle, ChevronLeft, ChevronRight, CornerDownLeft 
} from 'lucide-react';

// --- MOCK DATA ---

const MOCK_MESSAGES = [
  { 
    id: 1, 
    subject: "Follow-up question on blood pressure meds", 
    sender: "Dr. Leda Vance (PCP)", 
    date: "2024-10-04T10:30:00Z", 
    status: "Read", 
    priority: "Routine",
    content: "Hi Jane, regarding the Lisinopril refill—are you experiencing any new symptoms or side effects since starting the 10mg dosage? Please reply here.",
    expectedResponseTime: "4 business hours"
  },
  { 
    id: 2, 
    subject: "Urgent: Billing Inquiry for September visit", 
    sender: "Billing Department", 
    date: "2024-10-03T15:15:00Z", 
    status: "Unread", 
    priority: "High",
    content: "We need clarification on your secondary insurance information. Please call the main billing line or send the details securely via a new message.",
    expectedResponseTime: "2 business days"
  },
  { 
    id: 3, 
    subject: "Test result explanation ready", 
    sender: "Clinical Nurse Sarah", 
    date: "2024-10-02T08:00:00Z", 
    status: "Read", 
    priority: "Routine",
    content: "The explanation for your recent Cholesterol Panel is ready in the Health Records section. No immediate action is required, but let me know if you have questions.",
    expectedResponseTime: "8 business hours"
  },
];

const MOCK_CARE_TEAM = [
  { name: "Dr. Leda Vance", role: "Primary Care Provider (PCP)", phone: "(555) 101-2000", email: "leda.vance@clinic.org", photo: "https://placehold.co/100x100/34D399/ffffff?text=LV" },
  { name: "Clinical Nurse Sarah", role: "RN, Patient Coordinator", phone: "(555) 101-2001", email: "sarah.rn@clinic.org", photo: "https://placehold.co/100x100/60A5FA/ffffff?text=SN" },
  { name: "Alex Chen", role: "Billing Specialist", phone: "(555) 101-2002", email: "alex.chen@clinic.org", photo: "https://placehold.co/100x100/FBBF24/ffffff?text=AC" },
];

const MOCK_GENERAL_CONTACTS = [
  { name: "Main Hospital Line", number: "(555) 500-1234", role: "General Inquiry" },
  { name: "Scheduling Office", number: "(555) 500-1235", role: "Appointments" },
  { name: "Billing & Insurance", number: "(555) 500-1236", role: "Payment Questions" },
];

// --- Sub-Components ---

/**
 * Tab/View Selector for the Main Content Area
 */
const MainContentTabs = {
  INBOX: 'Inbox',
  COMPOSE: 'Compose',
  CONTACTS: 'Contacts',
  SUPPORT: 'Support',
};

/**
 * Component 1. Secure Messaging - Message List Item
 */
const MessageListItem = ({ message, onSelect, isSelected }) => {
  const statusClass = message.status === "Unread" ? "border-green-200 font-bold" : "bg-white hover:bg-gray-50 border-gray-100";
  const priorityIcon = message.priority === "High" ? <Zap size={16} className="text-red-500" /> : null;
  
  const dateFormatted = new Date(message.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return (
    <li 
      onClick={() => onSelect(message)}
      className={`p-3 cursor-pointer transition rounded-xl mb-1 ${statusClass} ${isSelected ? 'shadow-md font-bold text-green-600' : 'hover:bg-gray-50'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-sm text-left">
          <User size={16} />
          {message.sender} {priorityIcon} 
        </div>
        <span className="text-xs text-gray-500">{dateFormatted}</span>
      </div>
      <p className={`text-left mt-1 text-md truncate ${message.status === "Unread" ? 'text-gray-900 font-extrabold' : 'text-gray-700 font-semibold'}`}>
        {message.subject}
      </p>
    </li>
  );
};

/**
 * Component 1. Secure Messaging - Thread View
 */
const MessageThread = ({ message, onReply, onBack }) => {
  const dateFormatted = new Date(message.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border">
      <div className="p-4 border-b bg-gray-50 sticky top-0 rounded-t-xl z-10">
        <button 
          onClick={onBack} 
          className="text-primary hover:text-green-700 font-semibold flex items-center mb-3"
        >
          <ChevronLeft size={20} /> Back to Inbox
        </button>
        <h3 className="text-xl font-bold text-gray-900">{message.subject}</h3>
        <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
          <span>From: <span className="font-semibold">{message.sender}</span></span>
          <span className="flex items-center gap-1"><Clock size={14} /> {dateFormatted}</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-gray-100 p-4 rounded-xl shadow-inner border border-gray-200">
          <p className="whitespace-pre-wrap text-gray-800">{message.content}</p>
        </div>
        
        {/* Expected Response Time Alert */}
        <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
          <Clock size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Expected Response:</span> {message.expectedResponseTime}. This message is for non-urgent communication.
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t sticky bottom-0 bg-white">
        <button 
          onClick={() => onReply(message.subject)}
          className="w-full bg-primary hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
        >
          <CornerDownLeft size={18} /> Reply Securely
        </button>
      </div>
    </div>
  );
};

/**
 * Component 1. Secure Messaging - Compose View
 */
const MessageComposer = ({ initialSubject = '', onSend }) => {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('Nurse');
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
      setSubject('');
      setBody('');
      setRecipient('Nurse');
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipient</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-green-500 focus:border-green-500 transition"
            disabled={isSending}
          >
            {recipients.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
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
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <><Send size={18} /> Send Secure Message</>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">Do not use for medical emergencies.</p>
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
        {MOCK_CARE_TEAM.map(member => (
          <div key={member.name} className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 shadow-sm">
            <img 
              src={member.photo} 
              alt={member.name} 
              className="w-12 h-12 rounded-full object-cover shrink-0" 
              onError={(e) => e.currentTarget.src = `https://placehold.co/100x100/A5B4FC/374151?text=${member.name.split(' ').map(n=>n[0]).join('')}`}
            />
            <div>
              <p className="font-bold text-gray-900">{member.name}</p>
              <p className="text-sm text-green-700 font-medium">{member.role}</p>
              <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                <p className="flex items-center gap-1"><Phone size={12} /> {member.phone}</p>
                <p className="flex items-center gap-1"><Mail size={12} /> {member.email}</p>
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
        {MOCK_GENERAL_CONTACTS.map(contact => (
          <div key={contact.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
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

    <p className="text-gray-600">Find quick answers to common questions about billing, appointments, and accessing your health records.</p>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
      <a href="#" className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition shadow-sm">
        <FileText size={24} className="text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-gray-900">FAQ & Knowledge Base</p>
          <p className="text-xs text-gray-600">Common questions about the portal and services.</p>
        </div>
      </a>
      <a href="#" className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition shadow-sm">
        <Settings size={24} className="text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-gray-900">Technical Support</p>
          <p className="text-xs text-gray-600">Troubleshoot login and site issues.</p>
        </div>
      </a>
    </div>
    
    <div className="pt-4 border-t mt-4">
        <p className="text-sm text-gray-500 italic">For medical emergencies, please call your local emergency number immediately.</p>
    </div>
  </div>
);


// --- Main App Component ---

export default function MessagesContact() {
  const [activeTab, setActiveTab] = useState(MainContentTabs.INBOX);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return MOCK_MESSAGES;
    return MOCK_MESSAGES.filter(msg =>
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);
  
  // Handlers for navigation
  const navigateToCompose = (subject) => {
    setActiveTab(MainContentTabs.COMPOSE);
    setSelectedMessage({ subject: subject || '' }); // Pass subject for reply
  };
  
  const navigateToInbox = () => {
    setActiveTab(MainContentTabs.INBOX);
    setSelectedMessage(null);
  }

  // Determine which component to render in the main panel
  const renderMainPanel = () => {
    switch (activeTab) {
      case MainContentTabs.COMPOSE:
        // Check if it's a reply (selectedMessage has subject)
        return <MessageComposer 
          initialSubject={selectedMessage?.subject || ''} 
          onSend={navigateToInbox}
        />;
      case MainContentTabs.CONTACTS:
        return <ContactDirectory />;
      case MainContentTabs.SUPPORT:
        return <SupportSection />;
      case MainContentTabs.INBOX:
      default:
        // Only show thread if a message is selected and we are in INBOX mode
        if (selectedMessage) {
          return <MessageThread 
            message={selectedMessage} 
            onReply={(subject) => navigateToCompose(`RE: ${subject}`)}
            onBack={() => setSelectedMessage(null)}
          />;
        }
        return (
          <div className="p-6 text-center h-full flex flex-col justify-center items-center">
            <MessageSquare size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">Select a Message</h3>
            <p className="text-gray-500">View a conversation thread here or click "New Message" to start a chat.</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          Messages & Contact
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inbox and Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-xl border">
            
            {/* New Message Button */}
            <button 
              onClick={() => navigateToCompose('')}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2 transition shadow-md shadow-green-200"
            >
              <Plus size={20} /> New Message
            </button>
            
            {/* Main Tabs for Sidebar */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setActiveTab(MainContentTabs.INBOX)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.INBOX 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={20} /> Secure Inbox ({MOCK_MESSAGES.filter(m => m.status === 'Unread').length} unread)
              </button>
              <button
                onClick={() => setActiveTab(MainContentTabs.CONTACTS)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.CONTACTS 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Phone size={20} /> Contact Directory
              </button>
              <button
                onClick={() => setActiveTab(MainContentTabs.SUPPORT)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
                  activeTab === MainContentTabs.SUPPORT 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HelpCircle size={20} /> Support & FAQ
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 border-t pt-4 mb-2">Message Threads</h3>
            
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>

            {/* Message List */}
            <ul className="space-y-1 overflow-y-auto max-h-[40vh] md:max-h-[60vh]">
              {filteredMessages.length > 0 ? (
                filteredMessages.map(msg => (
                  <MessageListItem 
                    key={msg.id} 
                    message={msg} 
                    onSelect={setSelectedMessage} 
                    isSelected={selectedMessage && selectedMessage.id === msg.id}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 p-4">No messages found matching "{searchTerm}"</p>
              )}
            </ul>
          </div>
        </aside>

        {/* Right Column: Main Content Area */}
        <section className="lg:col-span-2 h-full min-h-[70vh]">
          {renderMainPanel()}
        </section>
      </div>
    </div>
  );
}
