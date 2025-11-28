const AI_CONTEXT_API_URL = import.meta.env.VITE_AI_CONTEXT_API_URL;
const AI_CONTEXT_API_KEY = import.meta.env.VITE_AI_CONTEXT_API_KEY;
const AI_CONTEXT_MODEL = import.meta.env.VITE_AI_CONTEXT_MODEL || "gpt-4o-mini";
const AI_CONTEXT_MAX_MESSAGES = Number(
  import.meta.env.VITE_AI_CONTEXT_WINDOW || 24
);

const SYSTEM_PROMPT = `You are an emergency response context generator tasked with helping field responders understand patient needs.
Return strictly valid JSON with the following shape:
{
  "summary": string,
  "symptoms": string[],
  "hazards": string[],
  "location": string[],
  "urgencyCue": string | null
}
Only reference facts that appear in the transcript. Use concise language and lowercase tokens for list entries. When there is not enough information, use empty arrays and null for urgencyCue.`;

const sanitizeMessages = (messages = []) => {
  const limited = messages.slice(-AI_CONTEXT_MAX_MESSAGES);
  return limited
    .map((message, index) => {
      const role = inferRole(message);
      const text =
        (typeof message?.text === "string" && message.text.trim()) ||
        (typeof message?.body === "string" && message.body.trim());
      if (!text) {
        return null;
      }
      const createdAt =
        message?.createdAt || message?.created_at || new Date().toISOString();
      return {
        id: message?.id || `${createdAt}-${index}`,
        role,
        text,
        createdAt,
      };
    })
    .filter(Boolean);
};

const inferRole = (message = {}) => {
  const role =
    message.senderRole ||
    message.sender_role ||
    message.actor_role ||
    message.metadata?.actor;
  if (!role) {
    return "participant";
  }
  if (role.toLowerCase().includes("patient")) {
    return "patient";
  }
  if (role.toLowerCase().includes("responder")) {
    return "responder";
  }
  if (role.toLowerCase().includes("dispatcher")) {
    return "dispatcher";
  }
  return role.toLowerCase();
};

const buildTranscript = (messages) =>
  messages
    .map((message) => {
      const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `(${time}) ${message.role.toUpperCase()}: ${message.text}`;
    })
    .join("\n");

const parseAiContent = (content) => {
  if (!content) {
    throw new Error("AI response did not include content");
  }

  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw error;
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
};

const normalizeAiPayload = (payload = {}) => {
  const toArray = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  return {
    summary:
      typeof payload.summary === "string"
        ? payload.summary.trim()
        : "Monitoring patient chatter — no critical signals yet.",
    symptoms: toArray(payload.symptoms),
    hazards: toArray(payload.hazards),
    location: toArray(payload.location),
    urgencyCue:
      typeof payload.urgencyCue === "string" && payload.urgencyCue.trim()
        ? payload.urgencyCue.trim()
        : null,
  };
};

const buildRequestBody = (messages) => ({
  model: AI_CONTEXT_MODEL,
  response_format: { type: "json_object" },
  temperature: 0.2,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Transcript:\n${buildTranscript(
        messages
      )}\n\nGenerate the JSON now.`,
    },
  ],
});

async function generateInsights(messages, { signal } = {}) {
  if (!AI_CONTEXT_API_URL || !AI_CONTEXT_API_KEY) {
    throw new Error(
      "AI context API is not configured. Set VITE_AI_CONTEXT_API_URL and VITE_AI_CONTEXT_API_KEY."
    );
  }

  const sanitized = sanitizeMessages(messages);
  if (!sanitized.length) {
    return {
      summary: "Awaiting patient updates…",
      symptoms: [],
      hazards: [],
      location: [],
      urgencyCue: null,
    };
  }

  const response = await fetch(AI_CONTEXT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONTEXT_API_KEY}`,
    },
    body: JSON.stringify(buildRequestBody(sanitized)),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `AI context API request failed (${response.status}): ${message}`
    );
  }

  const data = await response.json();
  const content =
    data?.choices?.[0]?.message?.content || data?.result || data?.content;
  const parsed = parseAiContent(content);
  return normalizeAiPayload(parsed);
}

export default {
  generateInsights,
};
