import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

export default function ChatSidebar({ activeResponder, setActiveResponder }) {
  // Load responders from localStorage (persist chat history)
  const [responders, setResponders] = useState(() => {
    const saved = localStorage.getItem("chat-responders");
    return saved ? JSON.parse(saved) : [];
  });

  const [open, setOpen] = useState(false); // mobile toggle

  // Persist responders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chat-responders", JSON.stringify(responders));
  }, [responders]);

  // Add a new responder dynamically
  const addResponder = (responder) => {
    if (!responders.some((r) => r.id === responder.id)) {
      setResponders([...responders, responder]);
    }
    setActiveResponder(responder);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-82 z-30 bg-green-900 text-white px-2.5 py-2.5 rounded-md shadow"
      >
        <MessageSquare size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-green-900 text-white font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <span>Responders</span>
          </div>
          {/* Close button on mobile */}
          <button
            className="lg:hidden p-1 hover:bg-green-800 rounded"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Responder list */}
        <ul className="flex-1 overflow-y-auto">
          {responders.length > 0 ? (
            responders.map((responder) => (
              <li key={responder.id}>
                <button
                  onClick={() => {
                    setActiveResponder(responder);
                    setOpen(false); // auto-close on mobile when selecting
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-green-100 transition ${
                    activeResponder?.id === responder.id
                      ? "bg-green-200 font-semibold"
                      : ""
                  }`}
                >
                  <img
                    src={responder.avatar || "/default-avatar.png"}
                    alt={responder.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-800">{responder.name}</p>
                    <p className="text-xs text-gray-500">{responder.role}</p>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <p className="p-4 text-gray-500 text-sm">No chat history yet</p>
          )}
        </ul>
      </aside>
    </>
  );
}
