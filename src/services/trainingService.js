import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  orderBy,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getBlob, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const COLLECTION = "training_courses";
const PROGRESS_COLLECTION = "training_progress";
const STORAGE_PREFIX = "training";
const SUBMISSIONS_PREFIX = "submissions";

/** Parse passingCriteria string to number (e.g. "70%" or "70" -> 70). */
export function parsePassingScore(passingCriteria) {
  if (passingCriteria == null || passingCriteria === "") return 70;
  const s = String(passingCriteria).trim().replace(/%/g, "");
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 70;
}

/**
 * @typedef {Object} ContentItem
 * @property {string} title
 * @property {string} type - 'pdf' | 'video' | 'document'
 * @property {string} [downloadURL]
 * @property {string} [storagePath]
 * @property {number} [order]
 */

/**
 * @typedef {Object} Section
 * @property {string} heading
 * @property {ContentItem[]} items
 */

/**
 * Full training module schema (Basic Info, Learning Structure, Content, Assessment, Administration, Feedback).
 * @typedef {Object} Course
 * @property {string} [id]
 * @property {string} [moduleCode] - Module ID / Code
 * @property {string} title - Module Title
 * @property {string} [description] - Module Description / Overview
 * @property {string} [category] - Training Category / Type
 * @property {string} [targetAudience] - e.g. Students, Responders, LGU Staff
 * @property {string} [difficultyLevel] - Beginner | Intermediate | Advanced
 * @property {string} [estimatedDuration] - e.g. "2 hours" or "90 minutes"
 * @property {string[]} [learningObjectives]
 * @property {string[]} [prerequisites]
 * @property {string[]} [keyTopics] - Key Topics / Lessons
 * @property {Section[]} [sections] - Content sections (PDF, video, manuals)
 * @property {string} [requiredMaterials] - Required Materials / Equipment
 * @property {string} [references] - References / Sources
 * @property {string} [assessmentType] - Quiz | Practical Test | Simulation | Evaluation Form
 * @property {string} [passingCriteria]
 * @property {string} [assessmentMaterials]
 * @property {Array<{ question: string, type: 'text'|'textarea'|'radio'|'checkbox', options?: string[] }>} [evaluationFormQuestions] - When assessmentType is Evaluation Form
 * @property {boolean} [certificationEnabled] - Certification / Completion Status
 * @property {string} [trainerName] - Trainer / Facilitator Name
 * @property {string} [schedule] - Training Schedule / Availability
 * @property {string} [deliveryMode] - Online | On-site
 * @property {number} [maxParticipants]
 * @property {string} [version]
 * @property {string} [status] - Draft | Active | Archived
 * @property {string} [trainerNotes]
 * @property {string} [participantFeedback]
 * @property {Array<{date: string, note: string}>} [revisionHistory]
 * @property {*} [createdAt]
 * @property {*} [updatedAt]
 */

/**
 * @returns {Promise<Course[]>}
 */
export async function listCourses() {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * @param {string} id
 * @returns {Promise<Course | null>}
 */
export async function getCourse(id) {
  const d = await getDoc(doc(db, COLLECTION, id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}

/**
 * @param {Course} data
 * @returns {Promise<string>} document id
 */
const DEFAULT_COURSE = {
  title: "",
  description: "",
  category: "general",
  moduleCode: "",
  targetAudience: "",
  difficultyLevel: "beginner",
  estimatedDuration: "",
  learningObjectives: [],
  prerequisites: [],
  keyTopics: [],
  sections: [],
  requiredMaterials: "",
  references: "",
  assessmentType: "",
  passingCriteria: "",
  assessmentMaterials: "",
  certificationEnabled: false,
  trainerName: "",
  schedule: "",
  deliveryMode: "online",
  maxParticipants: null,
  version: "1",
  status: "draft",
  trainerNotes: "",
  participantFeedback: "",
  revisionHistory: [],
  assessments: { pretest: [], quiz: [], final: [] },
  signatories: [],
  evaluationFormQuestions: [],
};

/** Firestore does not accept undefined; remove undefined keys. */
function stripUndefined(obj) {
  if (obj == null) return obj;
  const out = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}

function toFirestorePayload(data) {
  const payload = { ...DEFAULT_COURSE, ...data };
  payload.title = payload.title || "";
  payload.category = payload.category || "general";
  payload.sections = payload.sections || [];
  payload.learningObjectives = Array.isArray(payload.learningObjectives) ? payload.learningObjectives : [];
  payload.prerequisites = Array.isArray(payload.prerequisites) ? payload.prerequisites : [];
  payload.keyTopics = Array.isArray(payload.keyTopics) ? payload.keyTopics : [];
  payload.revisionHistory = Array.isArray(payload.revisionHistory) ? payload.revisionHistory : [];
  if (payload.assessments == null || typeof payload.assessments !== "object") {
    payload.assessments = { pretest: [], quiz: [], final: [] };
  }
  payload.signatories = Array.isArray(payload.signatories) ? payload.signatories : [];
  payload.evaluationFormQuestions = Array.isArray(payload.evaluationFormQuestions) ? payload.evaluationFormQuestions : [];
  delete payload.id;
  return stripUndefined(payload);
}

export async function createCourse(data) {
  const payload = toFirestorePayload(data);
  payload.createdAt = serverTimestamp();
  payload.updatedAt = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTION), stripUndefined(payload));
  return ref.id;
}

/**
 * @param {string} id
 * @param {Partial<Course>} data
 */
export async function updateCourse(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  delete payload.id;
  delete payload.createdAt;
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(payload));
}

/**
 * @param {string} id
 */
export async function deleteCourse(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * @param {string} courseId
 * @param {File} file
 * @param {string} type - 'pdf' | 'video' | 'document'
 * @returns {Promise<{ storagePath: string, downloadURL: string }>}
 */
export async function uploadCourseFile(courseId, file, type = "document") {
  const ext = (file.name || "").split(".").pop() || "bin";
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storagePath = `${STORAGE_PREFIX}/${courseId}/${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
  const downloadURL = await getDownloadURL(storageRef);
  return { storagePath, downloadURL };
}

/**
 * @param {string} storagePath
 */
export async function deleteCourseFile(storagePath) {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

/**
 * Upload responder submission video (Practical Test / Simulation). Stored under submissions/{userId}/{courseId}/.
 * @param {string} userId
 * @param {string} courseId
 * @param {File} file - Video file
 * @returns {Promise<{ storagePath: string, downloadURL: string }>}
 */
export async function uploadSubmissionVideo(userId, courseId, file) {
  const ext = (file.name || "").split(".").pop() || "mp4";
  const safeName = `${Date.now()}_${(file.name || "video").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storagePath = `${SUBMISSIONS_PREFIX}/${userId}/${courseId}/${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || "video/mp4" });
  const downloadURL = await getDownloadURL(storageRef);
  return { storagePath, downloadURL };
}

// ---------------------------------------------------------------------------
// Training progress & certification (keyed by app user id from AuthContext)
// ---------------------------------------------------------------------------

/**
 * @param {string} userId - App user id (from useAuth().user.id)
 * @param {string} courseId
 * @returns {Promise<{ completedContent: string[], assessmentResults: Object, certifiedAt: * } | null>}
 */
export async function getProgress(userId, courseId) {
  if (!userId || !courseId) return null;
  const id = `${String(userId)}_${String(courseId)}`;
  const d = await getDoc(doc(db, PROGRESS_COLLECTION, id));
  if (!d.exists()) return null;
  return d.data();
}

/**
 * List all progress documents for a user.
 * @param {string} userId
 * @returns {Promise<Array<{ progressId: string, userId: string, courseId: string, completedContent?: string[], assessmentResults?: Object, certifiedAt?: *, updatedAt?: * }>>}
 */
export async function getUserProgress(userId) {
  if (!userId) return [];
  const uid = String(userId);
  let q = query(
    collection(db, PROGRESS_COLLECTION),
    where("userId", "==", uid)
  );
  let snap = await getDocs(q);
  if (snap.empty && String(userId) !== userId) {
    q = query(
      collection(db, PROGRESS_COLLECTION),
      where("userId", "==", String(userId))
    );
    snap = await getDocs(q);
  }
  return snap.docs.map((d) => ({ progressId: d.id, ...d.data() }));
}

/**
 * Mark one content item as completed. Merges with existing progress.
 * @param {string} userId
 * @param {string} courseId
 * @param {string} contentSlug - Slug of the content item (e.g. from slugify(title))
 */
export async function markContentComplete(userId, courseId, contentSlug) {
  if (!userId || !courseId || !contentSlug) return;
  const uid = String(userId);
  const cid = String(courseId);
  const id = `${uid}_${cid}`;
  const ref = doc(db, PROGRESS_COLLECTION, id);
  const existing = await getDoc(ref);
  const completedContent = existing.exists()
    ? [...new Set([...(existing.data().completedContent || []), contentSlug])]
    : [contentSlug];
  await setDoc(ref, {
    userId: uid,
    courseId: cid,
    completedContent,
    assessmentResults: existing.exists() ? existing.data().assessmentResults || {} : {},
    certifiedAt: existing.exists() ? existing.data().certifiedAt : null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Save assessment result and optionally set certifiedAt if all conditions met.
 * @param {string} userId
 * @param {string} courseId
 * @param {string} assessmentType - 'pretest' | 'quiz' | 'final'
 * @param {{ percent: number, passed: boolean }} result
 * @param {import("./trainingService").Course} course - Full course from getCourse (for passingScore & certificationEnabled)
 * @param {{ videoSubmission?: { downloadURL: string, storagePath: string }, evalFormSubmission?: Record<string, string> }} [submission] - For Practical/Simulation (video) or Evaluation Form (form data)
 */
export async function saveAssessmentResult(userId, courseId, assessmentType, result, course, submission) {
  if (!userId || !courseId) return;
  const id = `${String(userId)}_${String(courseId)}`;
  const docRef = doc(db, PROGRESS_COLLECTION, id);
  const existing = await getDoc(docRef);
  const uid = String(userId);
  const cid = String(courseId);
  const data = existing.exists() ? existing.data() : { userId: uid, courseId: cid, completedContent: [], assessmentResults: {} };
  const assessmentResults = { ...(data.assessmentResults || {}) };
  assessmentResults[assessmentType] = { percent: result.percent, passed: result.passed };
  const payload = {
    userId: uid,
    courseId: cid,
    completedContent: data.completedContent || [],
    assessmentResults,
    certifiedAt: data.certifiedAt || null,
    updatedAt: serverTimestamp(),
  };
  if (submission?.videoSubmission) payload.videoSubmission = submission.videoSubmission;
  if (submission?.evalFormSubmission) payload.evalFormSubmission = submission.evalFormSubmission;
  const assessmentTypes = ["pretest", "quiz", "final"].filter((t) => {
    const questions = course.assessments && course.assessments[t];
    return Array.isArray(questions) && questions.length > 0;
  });
  const at = course.assessmentType;
  const submissionOnly = at === "Practical Test" || at === "Simulation" || at === "Evaluation Form";
  if (submissionOnly && (payload.videoSubmission || payload.evalFormSubmission)) {
    const finalPassed = assessmentResults.final?.passed;
    const canCertify = course.certificationEnabled && finalPassed;
    payload.certifiedAt = canCertify ? serverTimestamp() : (data.certifiedAt || null);
  } else {
    const allPassed = assessmentTypes.every((t) => assessmentResults[t] && assessmentResults[t].passed);
    const canCertify = course.certificationEnabled && assessmentTypes.length > 0 && allPassed;
    payload.certifiedAt = canCertify ? serverTimestamp() : (data.certifiedAt || null);
  }
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Re-check certification and set certifiedAt if all required assessments are passed.
 * Use when a user has already passed but certifiedAt was not set (e.g. after rule change).
 * For submission-only courses (Practical Test, Simulation, Evaluation Form), "passed" means assessmentResults.final?.passed.
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<boolean>} true if certified (now or already)
 */
export async function recheckCertification(userId, courseId) {
  if (!userId || !courseId) return false;
  const [progressData, course] = await Promise.all([getProgress(userId, courseId), getCourse(courseId)]);
  if (!course?.certificationEnabled) return false;
  const at = course.assessmentType;
  const submissionOnly = at === "Practical Test" || at === "Simulation" || at === "Evaluation Form";
  const assessmentResults = progressData?.assessmentResults || {};
  let allPassed = false;
  if (submissionOnly) {
    allPassed = assessmentResults.final?.passed === true;
  } else if (course.assessments) {
    const assessmentTypes = ["pretest", "quiz", "final"].filter(
      (t) => Array.isArray(course.assessments[t]) && course.assessments[t].length > 0
    );
    if (assessmentTypes.length === 0) return false;
    allPassed = assessmentTypes.every((t) => assessmentResults[t]?.passed);
  }
  if (!allPassed) return false;
  const progressId = `${String(userId)}_${String(courseId)}`;
  await setDoc(
    doc(db, PROGRESS_COLLECTION, progressId),
    { certifiedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  return true;
}

/**
 * Re-check and set certifiedAt for any course where user has passed all assessments but certifiedAt was never set.
 * Call this before getCertifications so users who already passed see their certificates.
 * @param {string} userId
 */
export async function ensureCertificationsForUser(userId) {
  if (!userId) return;
  const q = query(
    collection(db, PROGRESS_COLLECTION),
    where("userId", "==", userId)
  );
  let snap = await getDocs(q);
  if (snap.empty && String(userId) !== userId) {
    const q2 = query(
      collection(db, PROGRESS_COLLECTION),
      where("userId", "==", String(userId))
    );
    snap = await getDocs(q2);
  }
  await Promise.all(
    snap.docs.map(async (d) => {
      const p = d.data();
      if (p.certifiedAt != null) return;
      const course = await getCourse(p.courseId);
      if (!course?.certificationEnabled) return;
      const at = course.assessmentType;
      const submissionOnly = at === "Practical Test" || at === "Simulation" || at === "Evaluation Form";
      const assessmentResults = p.assessmentResults || {};
      const allPassed = submissionOnly
        ? assessmentResults.final?.passed === true
        : (() => {
            const types = ["pretest", "quiz", "final"].filter(
              (t) => Array.isArray(course.assessments?.[t]) && course.assessments[t].length > 0
            );
            return types.length > 0 && types.every((t) => assessmentResults[t]?.passed);
          })();
      if (!allPassed) return;
      await setDoc(
        doc(db, PROGRESS_COLLECTION, d.id),
        { certifiedAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    })
  );
}

/**
 * List all progress documents for a course (for admin to review video/eval submissions).
 * @param {string} courseId
 * @returns {Promise<Array<{ progressId: string, userId: string, courseId: string, videoSubmission?: *, evalFormSubmission?: *, assessmentResults?: *, completedContent?: *, certifiedAt?: * }>>}
 */
export async function getProgressByCourse(courseId) {
  if (!courseId) return [];
  const q = query(
    collection(db, PROGRESS_COLLECTION),
    where("courseId", "==", String(courseId))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ progressId: d.id, ...d.data() }));
}

/**
 * Admin: set assessment as passed/failed for a responder (e.g. after reviewing video or eval form).
 * @param {string} userId
 * @param {string} courseId
 * @param {boolean} passed
 */
export async function setAssessmentPassed(userId, courseId, passed) {
  if (!userId || !courseId) return;
  const id = `${String(userId)}_${String(courseId)}`;
  const docRef = doc(db, PROGRESS_COLLECTION, id);
  const existing = await getDoc(docRef);
  const data = existing.exists() ? existing.data() : {};
  const assessmentResults = { ...(data.assessmentResults || {}) };
  assessmentResults.final = { percent: passed ? 100 : 0, passed };
  const course = await getCourse(courseId);
  const at = course?.assessmentType;
  const submissionOnly = at === "Practical Test" || at === "Simulation" || at === "Evaluation Form";
  const canCertify = course?.certificationEnabled && passed && submissionOnly;
  await setDoc(docRef, {
    assessmentResults,
    certifiedAt: canCertify ? serverTimestamp() : (data.certifiedAt || null),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * @param {string} userId
 * @returns {Promise<Array<{ courseId: string, courseTitle: string, certifiedAt: * }>>}
 */
export async function getCertifications(userId) {
  if (!userId) return [];
  await ensureCertificationsForUser(userId);
  let q = query(
    collection(db, PROGRESS_COLLECTION),
    where("userId", "==", userId)
  );
  let snap = await getDocs(q);
  if (snap.empty && String(userId) !== userId) {
    q = query(
      collection(db, PROGRESS_COLLECTION),
      where("userId", "==", String(userId))
    );
    snap = await getDocs(q);
  }
  const list = snap.docs
    .map((d) => ({ ...d.data(), progressId: d.id }))
    .filter((p) => p.certifiedAt != null);
  const courses = await Promise.all(list.map((p) => getCourse(p.courseId)));
  return list.map((p, i) => ({
    courseId: p.courseId,
    courseTitle: (courses[i] && courses[i].title) || p.courseId,
    certifiedAt: p.certifiedAt,
  }));
}

const CERTIFICATE_TEMPLATE_PATH = "certificates/certificate.pdf";

/**
 * Get download URL for the certificate template PDF in Firebase Storage.
 * @returns {Promise<string>}
 */
export async function getCertificateTemplateUrl() {
  const storageRef = ref(storage, CERTIFICATE_TEMPLATE_PATH);
  return getDownloadURL(storageRef);
}

/** Same-origin paths to try for certificate template (avoids CORS). */
const LOCAL_CERTIFICATE_PATHS = [
  "/certificates/certificate.pdf",
  "/lessons/1/certificate.pdf",
];

/** PDF magic bytes: %PDF- */
function isPdfBuffer(buffer) {
  if (!buffer || buffer.byteLength < 5) return false;
  const u = new Uint8Array(buffer, 0, 5);
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d;
}

/**
 * Get certificate template PDF as bytes. Tries same-origin first (no CORS), then Firebase.
 * Only accepts responses that are actual PDFs (valid header); skips HTML/404 pages.
 * @returns {Promise<ArrayBuffer>}
 */
export async function getCertificateTemplateBytes() {
  const tryFirebase = async () => {
    const storageRef = ref(storage, CERTIFICATE_TEMPLATE_PATH);
    const blob = await getBlob(storageRef);
    return blob.arrayBuffer();
  };

  if (typeof window !== "undefined") {
    for (const path of LOCAL_CERTIFICATE_PATHS) {
      try {
        const url = `${window.location.origin}${path}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (isPdfBuffer(buf)) return buf;
      } catch {
        continue;
      }
    }
    try {
      const buf = await tryFirebase();
      if (isPdfBuffer(buf)) return buf;
    } catch (e) {
      throw new Error(
        "Certificate template not found. Add a valid PDF at public/certificates/certificate.pdf (same-origin, no CORS), or ensure Firebase Storage certificates/certificate.pdf is a valid PDF and CORS is configured for your origin."
      );
    }
  } else {
    const buf = await tryFirebase();
    if (!isPdfBuffer(buf)) {
      throw new Error("Certificate template at Firebase Storage certificates/certificate.pdf is not a valid PDF.");
    }
    return buf;
  }

  throw new Error(
    "Certificate template not found. Add a valid PDF at public/certificates/certificate.pdf."
  );
}
