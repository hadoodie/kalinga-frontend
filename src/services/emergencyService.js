import chatService from "./chatService";
import { buildMapsLink } from "../utils/location";

const DEFAULT_AUTO_REPLY =
  "Our responders have received your emergency alert and are preparing to assist you. Stay safe and provide any updates if your situation changes.";

const formatCoordinates = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toFixed(5);
  }
  return value !== undefined && value !== null ? String(value) : null;
};

export const submitEmergencyReport = async ({
  user,
  location,
  locationError,
  triggeredAt = new Date().toISOString(),
  notes,
  receiverId: overrideReceiverId,
  incidentType = "Emergency SOS",
}) => {
  if (!user?.id) {
    throw new Error("You must be signed in to send an emergency alert.");
  }

  const envReceiverId = overrideReceiverId ?? import.meta.env.VITE_EMERGENCY_DISPATCH_RECEIVER_ID;
  const receiverId = Number(envReceiverId);

  if (!Number.isFinite(receiverId) || receiverId <= 0) {
    throw new Error(
      "Emergency dispatcher is not configured. Please contact support immediately."
    );
  }

  const latNumber = Number(location?.latitude);
  const lngNumber = Number(location?.longitude);
  const accuracyNumber = Number(location?.accuracy);
  const latDisplay = formatCoordinates(location?.latitude);
  const lngDisplay = formatCoordinates(location?.longitude);
  const mapLink = Number.isFinite(latNumber) && Number.isFinite(lngNumber)
    ? buildMapsLink(latNumber, lngNumber)
    : null;

  const timestampLabel = new Date(triggeredAt).toLocaleString();

  const locationLabel =
    location?.label ??
    location?.name ??
    location?.displayName ??
    (latDisplay && lngDisplay ? `${latDisplay}, ${lngDisplay}` : null);

  const messageLines = [
    "🚨 Emergency SOS activated by patient.",
    `Time: ${timestampLabel}`,
  ];

  if (Number.isFinite(latNumber) && Number.isFinite(lngNumber)) {
    const accuracyLabel = Number.isFinite(accuracyNumber)
      ? `Accuracy: ±${Math.round(accuracyNumber)}m`
      : null;

    messageLines.push(`Coordinates: ${latNumber.toFixed(5)}, ${lngNumber.toFixed(5)}`);
    if (accuracyLabel) {
      messageLines.push(accuracyLabel);
    }
    if (mapLink) {
      messageLines.push(`Map: ${mapLink}`);
    }
  } else {
    messageLines.push("Location: Unable to determine automatically.");
    if (locationError) {
      messageLines.push(`Details: ${locationError}`);
    }
  }

  if (notes) {
    messageLines.push(`Notes: ${notes}`);
  }

  const messageText = messageLines.filter(Boolean).join("\n");

  const emergencyPayload = {
    type: "sos",
    triggered_at: triggeredAt,
    description: messageText,
    incident_type: incidentType,
    auto_reply_text: DEFAULT_AUTO_REPLY,
    responder_id: receiverId,
    responder_name: "Emergency Dispatch",
    patient_id: user.id,
  };

  if (Number.isFinite(latNumber)) {
    emergencyPayload.latitude = latNumber;
  }

  if (Number.isFinite(lngNumber)) {
    emergencyPayload.longitude = lngNumber;
  }

  if (Number.isFinite(accuracyNumber)) {
    emergencyPayload.accuracy = accuracyNumber;
  }

  if (locationLabel) {
    emergencyPayload.location_label = locationLabel;
  }

  if (mapLink) {
    emergencyPayload.map_url = mapLink;
  }

  if (notes) {
    emergencyPayload.notes = notes;
  }

  if (locationError) {
    emergencyPayload.location_error = locationError;
  }

  const payload = {
    receiver_id: receiverId,
    message: messageText,
    emergency_payload: emergencyPayload,
  };

  return chatService.sendMessage(payload);
};
