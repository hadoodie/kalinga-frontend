import { useMemo, useRef } from "react";

const normalizeText = (value) =>
  typeof value === "string" ? value.toLowerCase() : "";

const KEYWORD_GROUPS = {
  symptoms: {
    burns: ["burn", "scald", "blister", "scorch"],
    bleeding: ["bleed", "blood", "hemorrhage"],
    breathing: ["breath", "breathing", "asthma", "choke", "smoke"],
    trauma: ["fracture", "broken", "crush", "impact", "injury"],
    nausea: ["nausea", "vomit", "dizzy", "headache"],
  },
  hazards: {
    fire: ["fire", "flame", "burning", "smoke"],
    flood: ["flood", "water level", "rising water"],
    structural: ["collapse", "debris", "building", "structure"],
    chemical: ["chemical", "tox", "leak", "hazmat"],
    violence: ["attack", "weapon", "threat"]
  },
  location: {
    materials: ["wood", "gas", "fuel", "chemical"],
    setting: ["house", "apartment", "road", "highway", "factory"],
    constraints: ["blocked", "trap", "stuck", "no exit"],
  },
};

const URGENCY_HINTS = [
  "hurry",
  "urgent",
  "can't breathe",
  "unconscious",
  "massive bleeding",
  "fire spreading",
  "explosion",
  "critical",
];

const matchKeywords = (text, keywords) =>
  keywords.find((keyword) => text.includes(keyword));

const classifyMessage = (message) => {
  const text = normalizeText(message?.text || message?.body || "");
  if (!text) return null;

  const findings = {
    raw: message,
    text,
    symptoms: new Set(),
    hazards: new Set(),
    location: new Set(),
    urgencyHits: URGENCY_HINTS.filter((hint) => text.includes(hint)),
  };

  Object.entries(KEYWORD_GROUPS.symptoms).forEach(([label, keywords]) => {
    if (matchKeywords(text, keywords)) {
      findings.symptoms.add(label);
    }
  });

  Object.entries(KEYWORD_GROUPS.hazards).forEach(([label, keywords]) => {
    if (matchKeywords(text, keywords)) {
      findings.hazards.add(label);
    }
  });

  Object.entries(KEYWORD_GROUPS.location).forEach(([label, keywords]) => {
    if (matchKeywords(text, keywords)) {
      findings.location.add(label);
    }
  });

  return findings;
};

const buildSummary = (aggregate) => {
  const parts = [];

  if (aggregate.symptoms.length) {
    parts.push(
      `Patient reports ${aggregate.symptoms
        .map((symptom) => symptom.replace(/_/g, " "))
        .join(", ")}`
    );
  }

  if (aggregate.hazards.length) {
    parts.push(
      `Hazards detected: ${aggregate.hazards
        .map((hazard) => hazard.replace(/_/g, " "))
        .join(", ")}`
    );
  }

  if (aggregate.location.length) {
    parts.push(
      `Environment clues: ${aggregate.location
        .map((clue) => clue.replace(/_/g, " "))
        .join(", ")}`
    );
  }

  if (aggregate.urgencyCue) {
    parts.push(
      `Urgency flagged (${aggregate.urgencyCue}) — notify dispatch immediately.`
    );
  }

  return parts.length
    ? parts.join(". ")
    : "Monitoring patient chatter — no critical signals yet.";
};

const determineUrgencyCue = (messages) => {
  const urgent = messages.find((msg) => msg.urgencyHits.length > 0);
  return urgent ? urgent.urgencyHits[0] : null;
};

const filterMessages = (messages, { lockTimestamp }) => {
  if (!Array.isArray(messages) || !messages.length) {
    return [];
  }

  return messages.filter((message) => {
    const createdAt = Date.parse(message?.createdAt || message?.created_at);
    if (lockTimestamp && Number.isFinite(createdAt)) {
      return createdAt <= lockTimestamp;
    }
    return true;
  });
};

const collectInsights = (messages, options) => {
  const filtered = filterMessages(messages, options);

  const patientMessages = filtered.filter((message) => {
    const senderRole = message?.senderRole || message?.sender_role;
    const actor = message?.actor_role || message?.metadata?.actor;
    const inferredPatient =
      senderRole === "patient" || actor === "patient" || message?.isPatient;
    return inferredPatient;
  });

  if (!patientMessages.length) {
    return {
      summary: "Awaiting patient updates…",
      symptoms: [],
      hazards: [],
      location: [],
      supportingMessages: [],
      urgencyCue: null,
    };
  }

  const classifications = patientMessages
    .map((message) => classifyMessage(message))
    .filter(Boolean);

  const aggregate = {
    symptoms: Array.from(
      new Set(classifications.flatMap((item) => Array.from(item.symptoms)))
    ),
    hazards: Array.from(
      new Set(classifications.flatMap((item) => Array.from(item.hazards)))
    ),
    location: Array.from(
      new Set(classifications.flatMap((item) => Array.from(item.location)))
    ),
    urgencyCue: determineUrgencyCue(classifications),
    supportingMessages: patientMessages.slice(-5),
  };

  return {
    ...aggregate,
    summary: buildSummary(aggregate),
  };
};

export default function useConversationInsights(messages, options = {}) {
  const { lockTimestamp } = options;
  const lockRef = useRef(null);

  const computed = useMemo(
    () => collectInsights(messages, { lockTimestamp }),
    [messages, lockTimestamp]
  );

  if (Number.isFinite(lockTimestamp) && lockTimestamp > 0) {
    if (lockRef.current) {
      return lockRef.current;
    }
    lockRef.current = computed;
    return lockRef.current;
  }

  lockRef.current = null;
  return computed;
}
