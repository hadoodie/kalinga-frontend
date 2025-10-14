import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ChatReport = ({ responder }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const goToHome = () => {
    navigate("/patient/dashboard");
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
      className="flex flex-col h-screen bg-background font-sans text-primary text-xs sm:text-sm md:text-base"
      style={{ height: "calc(100vh - 6rem)" }}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 text-center font-normal border-b border-gray-200 bg-background text-xs sm:text-sm md:text-base">
        {responder ? (
          <>
            Chatting with{" "}
            <span className="font-bold text-green-700">{responder.name}</span>{" "}
            ({responder.role})
          </>
        ) : (
          <>
            Your <strong>EMERGENCY</strong> report has been{" "}
            <span className="text-[#f2c400] font-bold">successfully sent</span>{" "}
            to the admin/rescuer. They will contact you shortly. Stay calm and
            follow safety precautions.
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 sm:p-5 overflow-y-auto flex flex-col-reverse gap-3 sm:gap-4 bg-background scroll-smooth">
        <div ref={bottomRef}></div>

        {[...messages].reverse().map((msg, idx) => (
          <div
            key={idx}
            className="bg-[#f2c400] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl max-w-[80%] sm:max-w-[70%] self-end relative text-xs sm:text-sm md:text-base"
          >
            {msg.text}
            <span className="block text-white mt-1 text-right text-[10px] sm:text-xs">
              {msg.timestamp}
            </span>
          </div>
        ))}

        <div className="bg-[#f2c400] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl max-w-[80%] sm:max-w-[70%] self-end relative text-xs sm:text-sm md:text-base">
          Here’s my current location: [Location Attachment]
          <span className="block text-[10px] sm:text-xs text-white mt-1 text-right">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="bg-primary text-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl max-w-[80%] sm:max-w-[70%] self-start relative text-xs sm:text-sm md:text-base">
          Your emergency alert has been sent. The Admin/Rescuer has been
          notified and will respond shortly.
          <span className="block text-[10px] sm:text-xs text-white mt-1 text-right">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-3 sm:p-4 bg-background border-t border-gray-200 gap-2 sm:gap-3">
        {/* Home button (hidden on mobile) */}
        <button
          className="hidden sm:block bg-primary text-white text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2 rounded-lg hover:bg-primary transition w-full sm:w-auto"
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
            className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-primary text-white text-xs sm:text-sm md:text-base px-4 sm:px-5 py-2 rounded-lg hover:bg-primary transition flex items-center justify-center"
          >
            Send ⮞
          </button>
        </div>
      </div>
    </div>
  );
};
