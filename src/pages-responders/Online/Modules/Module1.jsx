// src/pages/Online/Modules/Module1.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../layouts/Layout";
import Footer from "../../../components/responder/Footer";
import "../../../styles/Modules/module1.css";

export default function Module() {
  const navigate = useNavigate();

  // Module 1 Lessons / Steps
  const lessons = [
    { id: 0, title: "Understanding the First 1000 Days", path: "/modules/1/module-1" },
    { id: 1, title: "Importance of Early Nutrition", path: "/modules/1/lesson-1" },
    { id: 2, title: "Maternal and Child Health Integration", path: "/modules/1/lesson-2" },
    { id: 3, title: "Key Nutrition Interventions", path: "/modules/1/lesson-3" },
  ];

  const totalSteps = lessons.length;
  const [currentLessonId, setCurrentLessonId] = useState(0);
  const [progress, setProgress] = useState(Math.round((currentLessonId / (totalSteps - 1)) * 100));
  const [showTranscript, setShowTranscript] = useState(false);

  const currentLesson = lessons.find(l => l.id === currentLessonId);

  // Navigation functions
  const goNext = () => {
    if (currentLessonId < totalSteps - 1) {
      const nextId = currentLessonId + 1;
      setCurrentLessonId(nextId);
      setProgress(Math.round((nextId / (totalSteps - 1)) * 100));
      navigate(lessons[nextId].path); // No more -1
    }
  };

  const goPrev = () => {
    if (currentLessonId > 0) {
      const prevId = currentLessonId - 1;
      setCurrentLessonId(prevId);
      setProgress(Math.round((prevId / (totalSteps - 1)) * 100));
      navigate(lessons[prevId].path); // No more -1
    }
  };

  const handleJumpChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    setCurrentLessonId(selectedId);
    setProgress(Math.round((selectedId / (totalSteps - 1)) * 100));
    navigate(lessons[selectedId].path); // Correct indexing
  };

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
            <span> {currentLesson.title}</span>
          </div>

          {/* Title */}
          <div className="lesson-header">
            <h1 className="lesson-course-title">
              Barangay First 1000 Days Facilitator's Guide eTraining
            </h1>
            <h3 className="lesson-activity-title">{currentLesson.title}</h3>
          </div>

          {/* Progress Bar */}
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
                }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: "14px", color: "#374151" }}>
              {progress === 100 ? "Completed ✅" : `${progress}%`}
            </div>
          </div>

          {/* VIDEO */}
          <div className="video-wrapper" style={{ marginTop: "20px" }}>
            <video
              width="100%"
              height="500px"
              controls
              style={{ borderRadius: "8px" }}
            >
              <source src={`/public/lessons/1/module${currentLessonId + 1}.mp4`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Open in new tab */}
          <div style={{ marginTop: "8px" }}>
            <a
              href={`/public/lessons/1/module${currentLessonId + 1}.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "14px", color: "#0b472d", textDecoration: "underline" }}
            >
              Open video in new tab
            </a>
          </div>

          {/* Transcript */}
          <div className="transcript-section">
            <h3 onClick={() => setShowTranscript(prev => !prev)}>
              Transcript {showTranscript ? "▲" : "▼"}
            </h3>
            {showTranscript && (
              <p>
                Community mobilization brings together leaders, parents, and stakeholders to create shared action toward improving maternal and child health outcomes…
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="lesson-controls">
            <button className="btn btn-light" onClick={goPrev} disabled={currentLessonId <= 0}>
              ⬅ Previous
            </button>

            <div className="jump-wrapper">
              <select className="jump-select" value={currentLessonId} onChange={handleJumpChange}>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-light" onClick={goNext} disabled={currentLessonId >= totalSteps - 1}>
              Next ➡
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lesson-activity-list">
          <h4>Module 1 Lessons</h4>
          <ul>
            {lessons.map(lesson => (
              <li key={lesson.id} className={lesson.id === currentLessonId ? "active" : ""}>
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
