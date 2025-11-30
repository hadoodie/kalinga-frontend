// Shared chat data normalization helpers used across responder messaging views.

export const buildAvatarUrl = (name, avatar) => {
  if (avatar) return avatar;
  const fallbackName = name ? encodeURIComponent(name) : "Responder";
  return `https://ui-avatars.com/api/?background=118A7E&color=fff&name=${fallbackName}`;
};

export const normalizePerson = (person = {}, fallbackName = "Unknown") => {
  const name =
    person.name || person.fullName || person.displayName || fallbackName;
  const avatarSource =
    person.avatar ||
    person.profile_image ||
    person.profile_image_url ||
    person.profileImage;

  return {
    id: person.id ?? null,
    name,
    role: person.role ?? person.category ?? "General",
    avatar: buildAvatarUrl(name, avatarSource),
    isOnline: person.isOnline ?? false,
  };
};

export const normalizeMessage = (
  message = {},
  fallbackSenderName = "",
  currentUserId = null
) => {
  const timestamp =
    message.timestamp || message.created_at || new Date().toISOString();

  const senderSource =
    message.sender ?? message.sender_info ?? message.senderDetails ?? null;
  const receiverSource =
    message.receiver ??
    message.receiver_info ??
    message.receiverDetails ??
    null;

  const senderObject =
    senderSource && typeof senderSource === "object" ? senderSource : null;
  const receiverObject =
    receiverSource && typeof receiverSource === "object"
      ? receiverSource
      : null;

  const senderId =
    message.senderId ?? message.sender_id ?? senderObject?.id ?? null;
  const receiverId =
    message.receiverId ?? message.receiver_id ?? receiverObject?.id ?? null;

  const senderName =
    (typeof senderSource === "string" && senderSource) ||
    senderObject?.name ||
    message.sender_name ||
    message.senderName ||
    fallbackSenderName ||
    "";

  const receiverName =
    (typeof receiverSource === "string" && receiverSource) ||
    receiverObject?.name ||
    message.receiver_name ||
    message.receiverName ||
    "";

  const senderInfo = senderObject
    ? normalizePerson(senderObject, senderName || fallbackSenderName)
    : null;

  const receiverInfo = receiverObject
    ? normalizePerson(receiverObject, receiverName)
    : null;

  const normalizeRole = (roleValue) => {
    if (!roleValue) return null;
    if (typeof roleValue === "string") {
      return roleValue.toLowerCase();
    }
    return null;
  };

  const senderRole = normalizeRole(
    message.sender_role ??
      message.senderRole ??
      message.sender_category ??
      senderObject?.role ??
      senderObject?.category ??
      null
  );

  const receiverRole = normalizeRole(
    message.receiver_role ??
      message.receiverRole ??
      message.receiver_category ??
      receiverObject?.role ??
      receiverObject?.category ??
      null
  );

  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? { ...message.metadata }
      : undefined;

  const actorRole =
    normalizeRole(
      message.actor_role ??
        message.actorRole ??
        metadata?.actor ??
        metadata?.role ??
        null
    ) ?? null;

  const isOwnMessage =
    message.isOwn ??
    (currentUserId !== null && senderId !== null
      ? senderId === currentUserId
      : undefined);

  return {
    id: message.id ?? `msg-${Math.random().toString(36).slice(2)}`,
    text: message.text ?? message.message ?? "",
    senderId,
    receiverId,
    sender: senderName,
    receiver: receiverName,
    senderInfo,
    receiverInfo,
    timestamp,
    isRead: message.isRead ?? false,
    isSystemMessage: message.isSystemMessage ?? false,
    isOwn: isOwnMessage,
    senderRole,
    receiverRole,
    actorRole,
    actor_role: actorRole,
    metadata,
    deliveryStatus:
      message.deliveryStatus ??
      (typeof isOwnMessage === "boolean"
        ? isOwnMessage
          ? "sent"
          : "delivered"
        : undefined),
    sendError: message.sendError ?? null,
  };
};

export const normalizeConversation = (
  conversation = {},
  currentUserId = null
) => {
  const participantsRaw = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
  const senderRaw = conversation.sender ?? conversation.from;
  const receiverRaw = conversation.receiver ?? conversation.to;

  const participantFromPayload = conversation.participant ?? null;

  const findOtherParticipant = () => {
    if (currentUserId === null) {
      return (
        participantFromPayload ??
        participantsRaw[0] ??
        senderRaw ??
        receiverRaw ??
        {}
      );
    }

    const fromArray = participantsRaw.find(
      (person) => person?.id && person.id !== currentUserId
    );

    if (fromArray) {
      return fromArray;
    }

    if (
      participantFromPayload?.id &&
      participantFromPayload.id !== currentUserId
    ) {
      return participantFromPayload;
    }

    if (senderRaw?.id && senderRaw.id !== currentUserId) {
      return senderRaw;
    }

    if (receiverRaw?.id && receiverRaw.id !== currentUserId) {
      return receiverRaw;
    }

    return (
      participantFromPayload ??
      participantsRaw[0] ??
      senderRaw ??
      receiverRaw ??
      {}
    );
  };

  const rawParticipant = findOtherParticipant() ?? {};
  const participant = normalizePerson(rawParticipant);

  const normalizedParticipants = participantsRaw
    .map((person) => normalizePerson(person))
    .filter((person) => person.id !== null);

  const participantName = participant.name ?? "Unknown";
  const normalizedMessages = Array.isArray(conversation.messages)
    ? conversation.messages.map((msg) =>
        normalizeMessage(msg, participantName, currentUserId)
      )
    : [];
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];

  return {
    id:
      conversation.id ??
      conversation.conversationId ??
      (participant.id ? `user-${participant.id}` : "conversation-unknown"),
    conversationId: conversation.conversationId ?? conversation.id ?? null,
    participant,
    participants: normalizedParticipants,
    category: conversation.category ?? participant.role ?? "General",
    unreadCount: conversation.unreadCount ?? 0,
    isArchived: conversation.isArchived ?? false,
    // Include incident tracking for incident-scoped messaging
    activeIncidentId:
      conversation.activeIncidentId ??
      conversation.incident_id ??
      conversation.incidentId ??
      null,
    incidentStatus: conversation.incidentStatus ?? null,
    lastMessage: conversation.lastMessage ?? lastMessage?.text ?? "",
    lastMessageTime:
      conversation.lastMessageTime ?? lastMessage?.timestamp ?? null,
    messages: normalizedMessages,
  };
};

export const sortConversationsByRecency = (list = []) => {
  return [...list].sort((a, b) => {
    const timeA = a?.lastMessageTime
      ? new Date(a.lastMessageTime).getTime()
      : 0;
    const timeB = b?.lastMessageTime
      ? new Date(b.lastMessageTime).getTime()
      : 0;
    return timeB - timeA;
  });
};

export const isSameConversation = (conv, other) => {
  if (!conv || !other) return false;

  if (conv.conversationId && other.conversationId) {
    return conv.conversationId === other.conversationId;
  }

  if (conv.participant?.id && other.participant?.id) {
    return conv.participant.id === other.participant.id;
  }

  return conv.id === other.id;
};

export const insertMessageChronologically = (messages, newMessage) => {
  if (!newMessage?.timestamp) {
    return [...messages, newMessage];
  }

  const newMessageTime = new Date(newMessage.timestamp).getTime();

  const insertIndex = messages.findIndex((existing) => {
    if (!existing?.timestamp) {
      return false;
    }

    return new Date(existing.timestamp).getTime() > newMessageTime;
  });

  if (insertIndex === -1) {
    return [...messages, newMessage];
  }

  return [
    ...messages.slice(0, insertIndex),
    newMessage,
    ...messages.slice(insertIndex),
  ];
};

export const buildConversationBufferKey = (
  conversation,
  fallbackParticipantId = null
) => {
  if (conversation?.conversationId) {
    return `cid:${conversation.conversationId}`;
  }

  if (conversation?.id) {
    return `id:${conversation.id}`;
  }

  if (fallbackParticipantId) {
    return `participant:${fallbackParticipantId}`;
  }

  return null;
};

export const mergeConversationSnapshot = (
  currentSnapshot = {},
  incomingSnapshot = {}
) => {
  const mergedMessages = Array.isArray(incomingSnapshot.messages)
    ? incomingSnapshot.messages.length
      ? incomingSnapshot.messages
      : Array.isArray(currentSnapshot.messages)
      ? currentSnapshot.messages
      : incomingSnapshot.messages
    : Array.isArray(currentSnapshot.messages)
    ? currentSnapshot.messages
    : [];

  const mergedParticipants = Array.isArray(incomingSnapshot.participants)
    ? incomingSnapshot.participants.length
      ? incomingSnapshot.participants
      : Array.isArray(currentSnapshot.participants)
      ? currentSnapshot.participants
      : incomingSnapshot.participants
    : Array.isArray(currentSnapshot.participants)
    ? currentSnapshot.participants
    : [];

  return {
    ...currentSnapshot,
    ...incomingSnapshot,
    id: incomingSnapshot.id ?? currentSnapshot.id ?? null,
    conversationId:
      incomingSnapshot.conversationId ?? currentSnapshot.conversationId ?? null,
    participant:
      incomingSnapshot.participant ?? currentSnapshot.participant ?? null,
    participants: mergedParticipants,
    category:
      incomingSnapshot.category ?? currentSnapshot.category ?? "General",
    messages: mergedMessages,
    lastMessage:
      incomingSnapshot.lastMessage ?? currentSnapshot.lastMessage ?? "",
    lastMessageTime:
      incomingSnapshot.lastMessageTime ??
      currentSnapshot.lastMessageTime ??
      null,
  };
};
