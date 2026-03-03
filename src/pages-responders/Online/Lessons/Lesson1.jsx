// src/pages/Online/Modules/Lesson1.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "../../../layouts/Layout";
import Footer from "../../../components/responder/Footer";
import "../../../styles/Modules/module1.css";

export default function Lesson1() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Lesson ID from URL, defaulting to 0
  const lessonIdParam = parseInt(id, 10);

  // Module 1 Lessons (IDs 0–3)
  const lessons = [
    { id: 0, title: "Understanding the First 1000 Days", path: "/modules/1/module-1" },
    { id: 1, title: "Importance of Early Nutrition", path: "/modules/1/lesson-1" },
    { id: 2, title: "Maternal and Child Health Integration", path: "/modules/1/lesson-2" },
    { id: 3, title: "Key Nutrition Interventions", path: "/modules/1/lesson-3" },
  ];

  const totalSteps = lessons.length;

  const [currentLessonId, setCurrentLessonId] = useState(lessonIdParam);
  const [progressData, setProgressData] = useState(
    JSON.parse(localStorage.getItem("lessonProgress")) || {}
  );

  const currentLesson = lessons.find((l) => l.id === currentLessonId);
  const isComplete = progressData[`2-${currentLessonId}`] === true;

  // Progress calculation: scale 0–100% based on lesson index
  const [progress, setProgress] = useState(() => {
    return Math.round((currentLessonId / (totalSteps - 1)) * 100);
  });

  useEffect(() => {
    setProgress(Math.round((currentLessonId / (totalSteps - 1)) * 100));
  }, [currentLessonId]);

  // Mark lesson complete
  const markComplete = () => {
    const updated = { ...progressData, [`2-${currentLessonId}`]: true };
    localStorage.setItem("lessonProgress", JSON.stringify(updated));
    setProgressData(updated);
  };

  // Navigation
  const goPrev = () => {
    if (currentLessonId > 0) {
      const prevId = currentLessonId - 1;
      setCurrentLessonId(prevId);
      navigate(lessons[prevId].path);
    }
  };

  const goNext = () => {
    if (currentLessonId < totalSteps - 1) {
      const nextId = currentLessonId + 1;
      setCurrentLessonId(nextId);
      navigate(lessons[nextId].path);
    }
  };

  const handleJumpChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    setCurrentLessonId(selectedId);
    navigate(lessons[selectedId].path);
  };

  const pdfFile = `/lessons/${currentLessonId}/lesson${currentLessonId}.pdf`;

  return (
    <Layout>
      <div className="lesson-layout">
        {/* MAIN CONTENT */}
        <div className="lesson-page">
          {/* Breadcrumbs */}
          <div className="lesson-breadcrumbs">
            <Link to="/responder/online-training">Home</Link> <span>/</span>
            <Link to="/responder/modules"> Modules</Link> <span>/</span>
            <Link to="/modules/1"> Barangay First 1000 Days Facilitator's Guide eTraining</Link> <span>/</span>
            <span> {currentLesson?.title}</span>
          </div>

          {/* Titles */}
          <div className="lesson-header">
            <h1 className="lesson-course-title">
              Module 1: Understanding the First 1000 Days
            </h1>
            <h2 className="lesson-activity-title">{currentLesson?.title}</h2>
          </div>

          {/* GLOBAL PROGRESS BAR */}
          <div style={{ marginBottom: 10 }}>
            <div
              className="progress-wrapper"
              style={{
                width: "100%",
                height: "6px",
                background: "#e5e7eb",
                borderRadius: "6px",
              }}
            >
              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: "6px",
                  background: "#16a34a",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: "14px", color: "#374151" }}>
              {progress === 100 ? "Completed ✅" : `${progress}%`}
            </div>
          </div>

          {/* PDF Viewer (unchanged) */}
          <div className="pdf-viewer" style={{ marginTop: "20px" }}>
            <iframe
              src={pdfFile}
              width="100%"
              height="900px"
              title={`Lesson ${currentLessonId}`}
              onLoad={markComplete}
              style={{ border: "1px solid #ccc", borderRadius: "8px" }}
            ></iframe>
          </div>

          {/* Complete Button */}
          <div style={{ marginTop: "16px" }}>
            {isComplete ? (
              <button className="btn btn-disabled" disabled>
                Completed ✅
              </button>
            ) : (
              <button onClick={markComplete} className="btn btn-success">
                Mark as Complete
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="lesson-controls">
            <button
              className="btn btn-light"
              onClick={goPrev}
              disabled={currentLessonId <= 0}
            >
              ⬅ Previous
            </button>

            <div className="jump-wrapper">
              <select
                className="jump-select"
                value={currentLessonId}
                onChange={handleJumpChange}
              >
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-light"
              onClick={goNext}
              disabled={currentLessonId >= totalSteps - 1}
            >
              Next ➡
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lesson-activity-list">
          <h4>Module 1 Lessons</h4>
          <ul>
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className={lesson.id === currentLessonId ? "active" : ""}
              >
                <Link to={lesson.path}>
                  {lesson.id}. {lesson.title} {lesson.id <= currentLessonId ? "✓" : ""}
                </Link>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "10px", color: "#374151" }}>
            Module unlocked: Yes
          </p>
        </aside>
      </div>

      <Footer />
    </Layout>
  );
}
