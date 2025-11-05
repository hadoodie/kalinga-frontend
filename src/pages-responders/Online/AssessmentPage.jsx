// src/pages/Online/AssessmentPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import courseContent from "../../data/courseContent";
import "../../styles/assessment.css";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function AssessmentPage() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const course = courseContent[id];
  const normalizedType = type?.replace(/-/g, "").toLowerCase(); // allow "pre-test" or "pretest"
  const questions =
    (course && course.assessments && course.assessments[normalizedType]) || [];

  // default duration: 10 minutes (600s) for final, 5 min for quiz, 3 min for pretest -- adjust as desired
  const defaultDurations = { pretest: 180, quiz: 300, final: 600 };
  const initialTime = defaultDurations[normalizedType] || 300;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    // if no questions -> nothing to do
    if (!questions.length) return;
    setAnswers(Array(questions.length).fill(null));
  }, [id, type]); // reset when id/type changes

  useEffect(() => {
    if (!questions.length) return;
    if (submitted) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(); // auto-submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, submitted]);

  const handleSelect = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = optionIndex;
      return copy;
    });
  };

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));

  const handleSubmit = () => {
    if (submitted) return;
    // compute score
    let correct = 0;
    for (let i = 0; i < questions.length; i += 1) {
      if (answers[i] != null && answers[i] === questions[i].answer)
        correct += 1;
    }
    setScore({
      correct,
      total: questions.length,
      percent: questions.length
        ? Math.round((correct / questions.length) * 100)
        : 0,
    });
    setSubmitted(true);
  };

  if (!course) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>Course not found.</div>
        <Footer />
      </Layout>
    );
  }

  if (!questions.length) {
    return (
      <Layout>
        <div className="assessment-wrapper">
          <h2>
            {course.title} — {normalizedType.toUpperCase()}
          </h2>
          <p>No assessment questions available for this activity.</p>
          <button onClick={() => navigate(-1)} className="btn">
            Back
          </button>
        </div>
        <Footer />
      </Layout>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <Layout>
      <div className="assessment-wrapper">
        <div className="assessment-header">
          <div>
            <h2>{course.title}</h2>
            <h4 className="muted">
              {normalizedType === "pretest"
                ? "Pre-Test"
                : normalizedType === "quiz"
                ? "Quiz"
                : "Final Assessment"}
            </h4>
          </div>

          <div className="timer">
            <div>Time left</div>
            <div className="timer-value">{formatTime(timeLeft)}</div>
          </div>
        </div>

        {!submitted ? (
          <div>
            <div className="question-card">
              <div className="question-meta">
                <strong>
                  Question {currentIndex + 1} / {questions.length}
                </strong>
              </div>
              <div className="question-text">{currentQ.q}</div>

              <div className="options">
                {currentQ.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`option ${
                      answers[currentIndex] === oi ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentIndex}`}
                      checked={answers[currentIndex] === oi}
                      onChange={() => handleSelect(currentIndex, oi)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              <div className="question-actions">
                <button
                  onClick={handlePrev}
                  className="btn btn-light"
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="btn btn-light"
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={handleSubmit} className="btn btn-primary">
                  Submit
                </button>
              </div>
            </div>

            <div className="progress-line">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`progress-dot ${
                    answers[i] != null ? "answered" : ""
                  } ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="result-card">
            <h3>Results</h3>
            <p>
              Score: {score.correct} / {score.total} ({score.percent}%)
            </p>
            <div className="result-actions">
              <button className="btn" onClick={() => navigate(-1)}>
                Back to Course
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  // reset and return to first question
                  setSubmitted(false);
                  setAnswers(Array(questions.length).fill(null));
                  setScore(null);
                  setTimeLeft(initialTime);
                  setCurrentIndex(0);
                }}
              >
                Retake
              </button>
            </div>

            <div className="answers-review">
              <h4>Review</h4>
              {questions.map((qq, idx) => (
                <div key={idx} className="review-item">
                  <div>
                    <strong>{idx + 1}.</strong> {qq.q}
                  </div>
                  <div>
                    {" "}
                    Your answer:{" "}
                    {answers[idx] == null
                      ? "No answer"
                      : qq.options[answers[idx]]}
                  </div>
                  <div> Correct: {qq.options[qq.answer]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </Layout>
  );
}
