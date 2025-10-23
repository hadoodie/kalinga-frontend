// src/lib/progress.jsx
const KEY_PREFIX = "responder_course_progress_";

function key(courseId) {
  return `${KEY_PREFIX}${courseId}`;
}

export function getProgress(courseId) {
  try {
    const raw = localStorage.getItem(key(courseId));
    if (!raw) {
      return { viewed: { general: {}, helpful: {}, training: {} }, unlocked: { helpful: false, training: false } };
    }
    return JSON.parse(raw);
  } catch (e) {
    return { viewed: { general: {}, helpful: {}, training: {} }, unlocked: { helpful: false, training: false } };
  }
}

export function saveProgress(courseId, progress) {
  localStorage.setItem(key(courseId), JSON.stringify(progress));
}

/**
 * markViewed - mark a slug as viewed and compute unlocks
 * sectionType: "general" | "helpful" | "training"
 * courseSections: course.sections (expected shape from your courseContent.jsx)
 */
export function markViewed(courseId, sectionType, slug, courseSections) {
  const progress = getProgress(courseId);
  progress.viewed = progress.viewed || { general: {}, helpful: {}, training: {} };
  progress.viewed[sectionType] = progress.viewed[sectionType] || {};
  progress.viewed[sectionType][slug] = true;

  // if all general viewed -> unlock helpful
  if (sectionType === "general") {
    const allGeneral = (courseSections.general || []).map((s) => s.slug);
    const allViewed = allGeneral.every((s) => progress.viewed.general[s]);
    if (allViewed) progress.unlocked.helpful = true;
  }

  // if all helpful viewed -> unlock training
  if (sectionType === "helpful") {
    const allHelpful = (courseSections.helpful || []).map((s) => s.slug);
    const allViewed = allHelpful.every((s) => progress.viewed.helpful[s]);
    if (allViewed) progress.unlocked.training = true;
  }

  saveProgress(courseId, progress);
  return progress;
}

export function resetProgress(courseId) {
  localStorage.removeItem(key(courseId));
}
