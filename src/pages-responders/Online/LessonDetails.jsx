import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/Footer";
import courseContent from "../../data/courseContent";
import "../../styles/lessonDetails.css";

const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function LessonDetails() {
  const { id, activitySlug } = useParams();
  const navigate = useNavigate();

  const course = courseContent[id];
  if (!course) {
    return (
      <Layout>
        <div className="lesson-center">
          <h2>Course not found</h2>
          <p>We could not find the course you requested.</p>
        </div>
        <Footer />
      </Layout>
    );
  }

  const activities = useMemo(
    () =>
      (course.sections || []).map((section) => {
        if (typeof section === "string") {
          return { title: section, slug: slugify(section), requiredTime: 10 };
        } else {
          return {
            title: section.title,
            slug: slugify(section.title),
            requiredTime: section.minTime ?? section.requiredTime ?? 10,
          };
        }
      }),
    [course]
  );

  if (!activities || activities.length === 0) {
    return (
      <Layout>
        <div className="lesson-center">
          <h2>No lessons found</h2>
          <p>This course has no lesson sections configured.</p>
        </div>
        <Footer />
      </Layout>
    );
  }

  useEffect(() => {
    if (!activitySlug) {
      const firstSlug = activities[0].slug;
      navigate(`/modules/${id}/activity/${firstSlug}`, { replace: true });
    } else {
      const found = activities.some((a) => a.slug === activitySlug);
      if (!found) {
        const firstSlug = activities[0].slug;
        navigate(`/modules/${id}/activity/${firstSlug}`, { replace: true });
      }
    }
  }, [id, activitySlug, activities]);

  const idx = activitySlug ? activities.findIndex((a) => a.slug === activitySlug) : 0;
  const activeIndex = idx === -1 ? 0 : idx;
  const current = activities[activeIndex];

  const videoUrl = `/lessons/${id}/lesson-video.mp4`;

  const progressKey = `course-progress-${id}`;
  const unlockKey = `unlocked-modules`;

  const [completedLessons, setCompletedLessons] = useState([]);
  const [waitTime, setWaitTime] = useState(current.requiredTime || 10);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isAssessmentPassed, setIsAssessmentPassed] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  const [moduleUnlocked, setModuleUnlocked] = useState(false);

  useEffect(() => {
    const results = JSON.parse(localStorage.getItem("assessmentResults")) || {};
    const quizKey = `${id}-quiz`;
    const quizResult = results[quizKey];
    const unlockedModules = JSON.parse(localStorage.getItem(unlockKey)) || [];

    const isUnlockedByList = unlockedModules.includes(String(id));
    const passedQuiz = quizResult ? quizResult.passed === true : false;

    setIsAssessmentPassed(isUnlockedByList || passedQuiz);
  }, [id]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(progressKey)) || [];
    setCompletedLessons(saved);

    const timeLimit = current.requiredTime ?? 10;
    if (timeLimit === 0 || saved.includes(current.slug)) {
      setIsWaiting(false);
      setWaitTime(0);
      return;
    }

    setIsWaiting(true);
    setWaitTime(timeLimit);

    let timer = setInterval(() => {
      setWaitTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWaiting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [id, activitySlug]);

  useEffect(() => {
    const unlockedModules = JSON.parse(localStorage.getItem(unlockKey)) || [];
    const isUnlockedByList = unlockedModules.includes(String(id));

    const saved = JSON.parse(localStorage.getItem(progressKey)) || [];
    const allDone = activities.length > 0 && activities.every((a) => saved.includes(a.slug));

    const unlocked = isUnlockedByList || allDone;
    setModuleUnlocked(unlocked);

    if (allDone && !isUnlockedByList) {
      const nextId = String(Number(id) + 1);
      const updated = Array.from(new Set([...unlockedModules, String(id), nextId]));
      localStorage.setItem(unlockKey, JSON.stringify(updated));
    }
  }, [completedLessons, id, activities.length]);

  const unlockNextModule = () => {
    const unlockedModules = JSON.parse(localStorage.getItem(unlockKey)) || [];
    const nextId = String(Number(id) + 1);
    if (!unlockedModules.includes(nextId)) {
      const updated = Array.from(new Set([...unlockedModules, nextId]));
      localStorage.setItem(unlockKey, JSON.stringify(updated));
    }
  };

  if (!moduleUnlocked && !isAssessmentPassed) {
    return (
      <Layout>
        <div className="lesson-center">
          <h2>🔒 This lesson is locked</h2>
          <p>You need to pass the module quiz before accessing the lessons.</p>
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/modules/${id}/assessment/quiz`)}
            >
              Take Module Quiz
            </button>
            <button
              className="btn btn-outline"
              style={{ marginLeft: 8 }}
              onClick={() => navigate(`/modules/${id}`)}
            >
              Back to Module
            </button>
          </div>

          <Footer />
        </div>
      </Layout>
    );
  }

  const handleMarkComplete = () => {
    if (!isAssessmentPassed) {
      alert("❌ You need to pass the assessment.");
      return;
    }

    const saved = JSON.parse(localStorage.getItem(progressKey)) || [];

    if (!saved.includes(current.slug)) {
      const updated = [...saved, current.slug];
      localStorage.setItem(progressKey, JSON.stringify(updated));
      setCompletedLessons(updated);
      alert(`✅ Completed: ${current.title}`);

      if (updated.length === activities.length) {
        setModuleUnlocked(true);

        const unlockedModules = JSON.parse(localStorage.getItem(unlockKey)) || [];
        const updatedModules = Array.from(new Set([...unlockedModules, String(id)]));
        const nextId = String(Number(id) + 1);
        if (!updatedModules.includes(nextId)) updatedModules.push(nextId);
        localStorage.setItem(unlockKey, JSON.stringify(updatedModules));
        unlockNextModule();

        setTimeout(() => navigate(`/modules/${id}/assessment/quiz`), 600);
        return;
      }
    }

    if (activeIndex < activities.length - 1) {
      setTimeout(() => {
        navigate(`/modules/${id}/activity/${activities[activeIndex + 1].slug}`);
      }, 600);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      navigate(`/modules/${id}/activity/${activities[activeIndex - 1].slug}`);
    }
  };

  const handleNext = () => {
    if (isWaiting || !isAssessmentPassed) return;

    if (activeIndex < activities.length - 1) {
      navigate(`/modules/${id}/activity/${activities[activeIndex + 1].slug}`);
    } else {
      navigate(`/modules/${id}/assessment/quiz`);
    }
  };

  const handleJump = (e) => {
    const slug = e.target.value;
    if (!slug) return;
    navigate(`/modules/${id}/activity/${slug}`);
  };

  const isCompleted = completedLessons.includes(current.slug);

  const sectionNumber = activeIndex + 1;
  const totalSections = activities.length;
  const percent = Math.round((sectionNumber / totalSections) * 100);

  return (
    <Layout>
      <div className="lesson-layout">
        <div className="lesson-page">
          <div className="lesson-breadcrumbs">
            <Link to="/modules">Home</Link>
            <span>/</span>
            <Link to={`/modules/${id}`}>Modules</Link>
            <span>/</span>
            <span className="muted">{course.title}</span>
            <span>/</span>
            <span className="muted">{current.title}</span>
          </div>

          <div className="lesson-header">
            <h1 className="lesson-course-title">{course.title}</h1>
            <h3 className="lesson-activity-title">{current.title}</h3>
          </div>

          <div style={{ margin: "12px 0 18px" }}>
            <div
              className="progress-bar-outer"
              style={{
                height: 10,
                background: "#e6e6e6",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                className="progress-bar-inner"
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "#16a34a",
                  transition: "width 300ms ease",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#4b5563" }}>
              Section {sectionNumber} of {totalSections} — {percent}%
            </div>
          </div>

          <div className="video-wrapper">
            <video src={videoUrl} className="video-player" controls controlsList="nodownload" />
          </div>
          <div className="pdf-fallback">
            <a href={videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
              Open video in new tab
            </a>
          </div>

          <div className="transcript-section">
            <h3 style={{ cursor: "pointer" }} onClick={() => setShowTranscript((prev) => !prev)}>
              Transcript {showTranscript ? "▲" : "▼"}
            </h3>
            {showTranscript && (
              <p>
                You know, when a typhoon is raging or the ground starts to shake,
                there's one place we all assume will be a sanctuary...
              </p>
            )}
          </div>

          <div className="completion-wrapper">
            {isCompleted ? (
              <button className="btn btn-disabled" disabled>
                Completed ✅
              </button>
            ) : isWaiting ? (
              <button className="btn btn-disabled" disabled>
                Please wait {waitTime}s…
              </button>
            ) : (
              <button onClick={handleMarkComplete} className="btn btn-success">
                Mark as Complete
              </button>
            )}
          </div>

          <div className="lesson-controls">
            <button onClick={handlePrev} className="btn btn-light" disabled={activeIndex === 0}>
              Back
            </button>

            <div className="jump-wrapper">
              <select className="jump-select" value={current.slug} onChange={handleJump}>
                {activities.map((a, i) => (
                  <option key={a.slug} value={a.slug}>
                    {i + 1}. {a.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNext}
              className={`btn ${isWaiting || !isAssessmentPassed ? "btn-disabled" : "btn-light"}`}
              disabled={isWaiting || !isAssessmentPassed}
            >
              {isAssessmentPassed
                ? isWaiting
                  ? `Please wait ${waitTime}s…`
                  : activeIndex === activities.length - 1
                  ? "Finish & Go to Quiz"
                  : "Next"
                : "Locked (Fail)"}
            </button>
          </div>
        </div>

        <div className="lesson-activity-list">
          <h4>All Lessons</h4>
          <ul>
            {activities.map((a, i) => (
              <li
                key={a.slug}
                className={`${i === activeIndex ? "active" : ""} ${
                  completedLessons.includes(a.slug) ? "done" : ""
                }`}
              >
                <Link to={`/modules/${id}/activity/${a.slug}`}>
                  {i + 1}. {a.title}{" "}
                  {completedLessons.includes(a.slug) && <span className="check">✓</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
            Module unlocked: {moduleUnlocked ? "Yes" : "No"}
          </div>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
