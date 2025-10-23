// src/lib/progressUtils.js

const PROGRESS_KEY = "responder_courseProgress";

export const getCourseProgress = () => {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    return data;
  } catch (e) {
    console.error("Failed to parse courseProgress:", e);
    return {};
  }
};

export const markLessonComplete = (moduleId, section, lessonSlug) => {
  const data = getCourseProgress();

  if (!data[moduleId]) data[moduleId] = {};
  if (!data[moduleId][section]) data[moduleId][section] = [];

  if (!data[moduleId][section].includes(lessonSlug)) {
    data[moduleId][section].push(lessonSlug);
  }

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
};

export const isSectionCompleted = (moduleId, section, totalLessons) => {
  const data = getCourseProgress();
  return data[moduleId]?.[section]?.length >= totalLessons;
};
