import api from "./api";
import { openDB } from "idb";

const DRAFT_KEY = "pcr:draft:v1";
const PCR_DB_NAME = "pcr-offline-db";
const PCR_STORE = "pcr_queue";

const getPcrDb = async () => {
  return openDB(PCR_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PCR_STORE)) {
        const store = db.createObjectStore(PCR_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
};

export const getPcrDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const savePcrDraft = (draft) => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const clearPcrDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
};

const listQueuedItems = async () => {
  const db = await getPcrDb();
  const items = await db.getAll(PCR_STORE);
  return items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const enqueueItem = async (item) => {
  const db = await getPcrDb();
  await db.put(PCR_STORE, item);
};

const deleteQueuedItem = async (id) => {
  const db = await getPcrDb();
  await db.delete(PCR_STORE, id);
};

const buildPayload = (values, isDraft) => {
  const payload = {
    is_draft: isDraft,
    incident_id: values.dispatch.incidentId || null,
    patient_user_id: values.patient.patientUserId || null,
    client_submission_id:
      values.meta?.clientSubmissionId || crypto.randomUUID(),
    client_updated_at: new Date().toISOString(),
    case_no: values.dispatch.caseNo || null,
    mobile_unit: values.dispatch.mobileUnit || null,
    dispatch_date: values.dispatch.date || null,
    response_times: {
      dispatch: values.dispatch.dispatchTime || null,
      arrival: values.dispatch.arrivalTime || null,
      back_to_base: values.dispatch.backToBaseTime || null,
    },
    noi_moi: [
      ...((values.noiMoi || []).filter((item) => item !== "Others")),
      ...(values.noiMoi?.includes("Others") && values.noiMoiOther
        ? [`Others: ${values.noiMoiOther.trim()}`]
        : []),
    ],
    patient_details: values.patient,
    physiological_status: {
      ...values.physiological,
      pmh: [
        ...((values.physiological?.pmh || []).filter((item) => item !== "Others")),
        ...(values.physiological?.pmh?.includes("Others") && values.physiological?.pmhOther
          ? [`Others: ${values.physiological.pmhOther.trim()}`]
          : []),
      ],
    },
    vitals_entries: values.vitals,
    gcs_entries: values.vitals.map((row) => ({
      time: row.time || null,
      eyes: Number(row.gcs?.eyes || 0),
      verbal: Number(row.gcs?.verbal || 0),
      motor: Number(row.gcs?.motor || 0),
      total:
        Number(row.gcs?.eyes || 0) +
        Number(row.gcs?.verbal || 0) +
        Number(row.gcs?.motor || 0),
    })),
    management_transport: {
    ...values.management,
    personnelOnScene: Array.isArray(values.management?.personnelOnSceneChips)
      ? [
          ...values.management.personnelOnSceneChips.filter(
            (item) => item !== "Others"
          ),
          ...(values.management.personnelOnSceneChips.includes("Others") &&
          values.management.personnelOnSceneOther
            ? `Others: ${values.management.personnelOnSceneOther.trim()}`
            : []),
        ].join(", ") || null
      : values.management.personnelOnScene || null,
  },
  waivers: values.waivers,
  edge_ingest_meta: {
    source: values.edgeMeta.source || "manual",
    last_ingested_at: values.edgeMeta.lastIngestedAt || null,
    sensor: values.edgeMeta.sensor || null,
    node_event_id: values.edgeMeta.nodeEventId || null,
  },
};

  return payload;
};

export const submitPcr = async (values, { isDraft = false } = {}) => {
  const payload = buildPayload(values, isDraft);
  console.log("PCR submit payload", payload);

  try {
    const response = await api.post("/patient-care-reports", payload);
    return { queued: false, data: response.data, clientSubmissionId: payload.client_submission_id };
  } catch (error) {
    const offline = !error.response || !navigator.onLine;
    if (!offline) throw error;

    await enqueueItem({
      id: crypto.randomUUID(),
      payload,
      createdAt: new Date().toISOString(),
      conflictState: "pending",
    });

    return { queued: true, clientSubmissionId: payload.client_submission_id };
  }
};

export const flushPcrQueue = async () => {
  const queue = await listQueuedItems();
  if (!queue.length || !navigator.onLine) return { sent: 0, remaining: queue.length, conflicted: 0 };

  let sent = 0;
  let conflicted = 0;

  for (const item of queue) {
    try {
      await api.post("/patient-care-reports", item.payload);
      await deleteQueuedItem(item.id);
      sent += 1;
    } catch (error) {
      if (error?.response?.status === 409) {
        conflicted += 1;
      }
    }
  }

  const remaining = await listQueuedItems();
  return { sent, remaining: remaining.length, conflicted };
};

export const getQueuedCount = async () => {
  const queue = await listQueuedItems();
  return queue.length;
};

export const generatePcrSoftCopy = async (reportId) => {
  const response = await api.post(`/patient-care-reports/${reportId}/soft-copy`);
  return response.data;
};

export const getPcrSoftCopy = async (reportId) => {
  const response = await api.get(`/patient-care-reports/${reportId}/soft-copy`);
  return response.data;
};
