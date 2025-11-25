import { AlertTriangle, Info, Sparkles } from "lucide-react";

const formatList = (items, fallback) => {
  if (!items?.length) {
    return fallback;
  }
  return items
    .map((item) =>
      typeof item === "string" ? item.replace(/_/g, " ") : String(item)
    )
    .join(", ");
};

export default function ContextGeneratorPanel({ insights, locked }) {
  const {
    summary,
    symptoms,
    hazards,
    location,
    supportingMessages,
    urgencyCue,
  } = insights ?? {};

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide font-bold text-gray-500">
              AI Context Generator
            </p>
            <h2 className="text-lg font-black text-gray-900">
              Patient Insight Stream
            </h2>
          </div>
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wide">
            <Info className="h-3.5 w-3.5" />
            Locked — On Scene
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            Live feed
          </span>
        )}
      </header>

      <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4">
        {summary || "Listening for critical updates"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <article className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            Symptoms & Injuries
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formatList(symptoms, "No acute indicators yet")}
          </p>
        </article>
        <article className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            Hazards Nearby
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formatList(hazards, "Monitoring environment")}
          </p>
        </article>
        <article className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Environment Clues
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formatList(location, "Limited data")}
          </p>
        </article>
      </div>

      {urgencyCue ? (
        <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Escalation flag triggered (<strong>{urgencyCue}</strong>). Notify
            command center if not already done.
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Latest patient statements
        </p>
        {supportingMessages?.length ? (
          <ul className="space-y-2">
            {supportingMessages.map((message) => (
              <li
                key={message.id || `${message.createdAt}-${message.text}`}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700"
              >
                <p className="font-semibold text-gray-900 text-xs mb-1">
                  {new Date(
                    message.createdAt || message.created_at || Date.now()
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>{message.text || message.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No patient lines captured yet.
          </p>
        )}
      </div>
    </section>
  );
}
