import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ChatReport = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const goToHome = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = {
      text: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div
      className="flex flex-col bg-background font-sans text-primary overflow-hidden text-left text-xs sm:text-sm"
      style={{ height: "calc(100vh - 6rem)" }}
    >
      {/* Header */}
      <div className="p-5 text-center font-normal border-b border-gray-200 bg-background">
        Your <strong>EMERGENCY</strong> report has been{" "}
        <span className="text-[#f2c400] font-bold">successfully sent</span> to
        the admin/rescuer. They will contact you shortly. Stay calm and follow
        safety precautions.
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col-reverse gap-4 bg-background scroll-smooth">
        <div ref={bottomRef}></div>

        {[...messages].reverse().map((msg, idx) => (
          <div
            key={idx}
            className="bg-[#f2c400] text-white px-4 py-3 rounded-2xl max-w-[70%] self-end relative"
          >
            {msg.text}
            <span className="block text-white mt-1 text-right">
              {msg.timestamp}
            </span>
          </div>
        ))}

        <div className="bg-[#f2c400] text-white px-4 py-3 rounded-2xl max-w-[70%] self-end relative">
          Here’s my current location: [Location Attachment]
          <span className="block text-xs text-white mt-1 text-right">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="bg-primary text-white px-4 py-3 rounded-2xl max-w-[70%] self-start relative">
          Your emergency alert has been sent. The Admin/Rescuer has been
          notified and will respond shortly.
          <span className="block text-xs text-white mt-1 text-right">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-4 bg-background border-t border-gray-200 gap-3">
        {/* Home button */}
        <button
          className="hidden sm:block bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary transition w-full sm:w-auto"
          onClick={goToHome}
        >
          ⮜ Home
        </button>

        {/* Input + Send */}
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Write a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-lg outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-primary text-white text-xs sm:text-sm px-5 py-2 rounded-lg hover:bg-primary transition flex items-center justify-center"
          >
            Send ⮞
          </button>
        </div>
      </div>
    </div>
  );
};
