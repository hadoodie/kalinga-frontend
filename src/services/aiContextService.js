import { KALINGA_CONFIG } from "../constants/mapConfig";

const AI_CONTEXT_MAX_MESSAGES = Number(
  import.meta.env.VITE_AI_CONTEXT_WINDOW || 24
);
const AI_CONTEXT_MODEL =
  import.meta.env.VITE_AI_CONTEXT_MODEL || "gemini-2.0-flash-lite";
const GEMINI_CONTEXT_ENDPOINT =
  `${KALINGA_CONFIG.API_BASE_URL}/api/gemini/context`;

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

const buildPrompt = (messages) =>
  `${SYSTEM_PROMPT}\n\nTranscript:\n${buildTranscript(
    messages
  )}\n\nGenerate the JSON now.`;

async function generateInsights(messages, { signal } = {}) {
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

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Missing authentication token for AI context service");
  }

  const response = await fetch(GEMINI_CONTEXT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt: buildPrompt(sanitized),
      options: {
        model: AI_CONTEXT_MODEL,
        max_tokens: 512,
        temperature: 0.15,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `AI context API request failed (${response.status}): ${message}`
    );
  }

  const payload = await response.json();

  if (payload?.success === false) {
    throw new Error(payload?.error || "Gemini backend error");
  }

  const content =
    typeof payload?.data?.text === "string"
      ? payload.data.text
      : JSON.stringify(payload?.data?.raw ?? {});
  const parsed = parseAiContent(content);
  return normalizeAiPayload(parsed);
}

export default {
  generateInsights,
};
