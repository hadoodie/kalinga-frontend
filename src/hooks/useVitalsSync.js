import { useEffect } from "react";
import { io } from "socket.io-client";

const NODE_BASE = import.meta.env.VITE_NODE_API_URL || "http://localhost:5000";

export function useVitalsSync({
  getValues,
  setValue,
  caseNo,
  patientUuid,
  isFieldLocked,
  onStatusChange,
  onPayload,
}) {
  useEffect(() => {
    if (!caseNo && !patientUuid) {
      onStatusChange?.("waiting");
      return;
    }

    const token = localStorage.getItem("token") || undefined;
    const socket = io(NODE_BASE, {
      transports: ["websocket"],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      onStatusChange?.("connected");
      socket.emit("pcr:subscribe", { caseNo, patientUuid });
    });

    socket.on("disconnect", () => {
      onStatusChange?.("waiting");
    });

    socket.on("pcr:edge-vitals", (payload) => {
      onPayload?.(payload);
      onStatusChange?.("ingesting");

      const vitals = getValues("vitals") || [];
      const lastIndex = Math.max(vitals.length - 1, 0);
      const current = getValues(`vitals.${lastIndex}`) || {};

      const candidates = [
        {
          path: `vitals.${lastIndex}.temp`,
          value: payload.reading?.temperature,
        },
        {
          path: `vitals.${lastIndex}.spo2`,
          value: payload.reading?.spo2,
        },
        {
          path: `vitals.${lastIndex}.pulse`,
          value: payload.reading?.pulse,
        },
        {
          path: `vitals.${lastIndex}.rr`,
          value: payload.reading?.rr,
        },
        {
          path: `vitals.${lastIndex}.bp`,
          value: payload.reading?.bp,
        },
      ];

      setValue(
        `vitals.${lastIndex}.time`,
        payload.reading?.time || current.time || new Date().toISOString().slice(11, 16),
        { shouldDirty: true }
      );

      for (const field of candidates) {
        if (field.value == null) continue;
        if (isFieldLocked?.(field.path)) continue;
        setValue(field.path, field.value, { shouldDirty: true });
      }

      setValue(`vitals.${lastIndex}.source`, "edge", { shouldDirty: true });
      setValue("edgeMeta", {
        source: "edge",
        lastIngestedAt: payload.ingestedAt,
        sensor: payload.sensor || "GY-906 MLX90614",
        nodeEventId: payload.eventId || null,
      });

      window.setTimeout(() => onStatusChange?.("connected"), 900);
    });

    return () => socket.disconnect();
  }, [
    caseNo,
    patientUuid,
    getValues,
    isFieldLocked,
    onPayload,
    onStatusChange,
    setValue,
  ]);
}
