import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";

const MessageBubble = ({ message, currentUserId }) => {
  const isOwn =
    message.senderId === currentUserId ||
    message.sender_id === currentUserId ||
    message.isOwn;
  const senderName =
    message.sender || message.sender_name || (isOwn ? "You" : "Patient");
  const timestamp = useMemo(() => {
    const value = message.createdAt || message.created_at;
    if (!value) return null;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value;
    return new Date(parsed).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.createdAt, message.created_at]);

  return (
    <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm border break-words whitespace-pre-wrap ${
          isOwn
            ? "bg-primary text-white rounded-br-sm border-primary self-end"
            : "bg-white text-gray-900 rounded-bl-sm border-gray-200 self-start"
        }`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        <p
          className={`text-xs mb-1 ${
            isOwn ? "text-right text-white/80" : "text-left text-gray-500"
          }`}
        >
          {senderName} {timestamp ? `· ${timestamp}` : ""}
        </p>
        <p className="leading-relaxed text-left break-words whitespace-pre-wrap">
          {message.text || message.body}
        </p>
      </div>
    </div>
  );
};

export default function ConversationPanel({
  conversation,
  messages,
  loading,
  onBack,
  currentUserId,
  onSendMessage,
  sending,
  sendError,
}) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !onSendMessage) {
      return;
    }

    try {
      await Promise.resolve(onSendMessage(trimmed));
      setDraft("");
      textareaRef.current?.focus();
    } catch (error) {
      // errors handled upstream, keep draft for retry
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  if (loading) {
    return (
      <section className="bg-white border border-gray-200 rounded-2xl p-8 flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </section>
    );
  }

  if (!conversation) {
    return (
      <section className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-600">
        No active conversation for this incident yet.
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl h-full flex flex-col shadow-sm">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">
            Responding to
          </p>
          <h2 className="text-lg font-black text-gray-900">
            {conversation.participant?.name || conversation.title || "Patient"}
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            {conversation.reference || `Thread #${conversation.id}`}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/60">
        {messages?.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id || `${message.createdAt}-${message.text}`}
              message={message}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center mt-8">
            Awaiting first message…
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 bg-white px-5 py-4"
      >
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {sendError && (
          <p className="mt-2 text-xs text-red-500">{sendError}</p>
        )}
      </form>
    </section>
  );
}
