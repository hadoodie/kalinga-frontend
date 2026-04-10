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
  const { user } = useAuth();
  // URL type can be "pre-test", "quiz", "final-assessment"; course.assessments uses "pretest", "quiz", "final"
  const rawType = type?.replace(/-/g, "").toLowerCase();
  const normalizedType =
    rawType === "finalassessment" ? "final" : (rawType || "");

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(undefined); // undefined = not yet loaded; null = no progress doc
  const [progressError, setProgressError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fromFirestore, setFromFirestore] = useState(false);

  const questions = course && course.assessments && course.assessments[normalizedType]
    ? course.assessments[normalizedType]
    : [];

  // default duration: 10 minutes (600s) for final, 5 min for quiz, 3 min for pretest -- adjust as desired
  const defaultDurations = { pretest: 180, quiz: 300, final: 600 };
  const initialTime = defaultDurations[normalizedType] || 300;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [certificateEarned, setCertificateEarned] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoSubmitted, setVideoSubmitted] = useState(false);
  const [evalFormValues, setEvalFormValues] = useState({});
  const [evalFormSubmitted, setEvalFormSubmitted] = useState(false);

  const toFriendlyFirebaseError = (err, action) => {
    const code = err?.code ? String(err.code) : "unknown";
    if (code.includes("permission-denied")) {
      return `Unable to ${action} due to Firestore permissions (permission-denied).`;
    }
    return `Unable to ${action}. ${err?.message || "Please try again."}`;
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCourse(id)
      .then((firestoreCourse) => {
        if (cancelled) return;
        if (firestoreCourse) {
          setCourse(firestoreCourse);
          setFromFirestore(true);
        } else {
          setCourse(courseContent[id] || null);
          setFromFirestore(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCourse(courseContent[id] || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, normalizedType]);

  useEffect(() => {
    if (!user?.id || !id || !fromFirestore) return;
    let cancelled = false;
    setProgressError("");
    getProgress(user.id, id)
      .then((p) => { if (!cancelled) setProgress(p); })
      .catch((e) => {
        if (!cancelled) {
          setProgress(null);
          setProgressError(toFriendlyFirebaseError(e, "load training progress"));
        }
      });
    return () => { cancelled = true; };
  }, [user?.id, id, fromFirestore]);

  const isVideoSubmission = course?.assessmentType === "Practical Test" || course?.assessmentType === "Simulation";
  const isEvalForm = course?.assessmentType === "Evaluation Form";

  // Enforce order: quiz only after pretest; final only after quiz passed (70%). Skip for submission-only types.
  useEffect(() => {
    if (!course || !fromFirestore || loading) return;
    if (normalizedType === "final" && (isVideoSubmission || isEvalForm)) return;
    if (!questions.length) return;
    if (normalizedType === "quiz" && course.assessments?.pretest?.length > 0) {
      if (progress === undefined) return;
      if (!progress?.assessmentResults?.pretest) {
        navigate(`/responder/modules/${id}`, { replace: true });
        return;
      }
    }
    if (normalizedType === "final" && course.assessments?.quiz?.length > 0) {
      if (progress === undefined) return;
      if (!progress?.assessmentResults?.quiz?.passed) {
        navigate(`/responder/modules/${id}`, { replace: true });
        return;
      }
    }
  }, [course, fromFirestore, loading, normalizedType, progress, id, navigate, questions.length, isVideoSubmission, isEvalForm]);

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

    if (fromFirestore && user?.id && id) {
      setSavingResult(true);
      try {
        await saveAssessmentResult(
          user.id,
          id,
          normalizedType,
          { percent, passed, score: correct, maxScore: questions.length, status: passed ? "PASSED" : "FAILED" },
          course
        );
        setProgress((prev) => {
          const base = prev || { assessmentResults: {} };
          return {
            ...base,
            assessmentResults: {
              ...(base.assessmentResults || {}),
              [normalizedType]: { percent, passed },
            },
          };
        });
        setProgressError("");

        // Auto-advance only after the write succeeds, preserving the enforced flow.
        if (normalizedType === "pretest" && course?.assessments?.quiz?.length > 0) {
          navigate(`/responder/modules/${id}/assessment/quiz`, { replace: true });
          return;
        }
        if (normalizedType === "quiz" && passed && course?.assessments?.final?.length > 0) {
          navigate(`/responder/modules/${id}/assessment/final-assessment`, { replace: true });
          return;
        }
      } catch (e) {
        const msg = toFriendlyFirebaseError(e, "save assessment result");
        setProgressError(msg);
        console.warn("Failed to save assessment result", e);
      } finally {
        setSavingResult(false);
      }
    }
  };

  const handleVideoSubmit = async () => {
    if (!videoFile || !user?.id || !id || !fromFirestore) return;
    setUploadingVideo(true);
    setSavingResult(true);
    try {
      const { downloadURL, storagePath } = await uploadSubmissionVideo(user.id, id, videoFile);
      await saveAssessmentResult(user.id, id, "final", { percent: 0, passed: false, score: null, maxScore: null, status: "PENDING_REVIEW" }, course, {
        videoSubmission: { downloadURL, storagePath },
      });
      setProgress((prev) => {
        const base = prev || { assessmentResults: {} };
        return {
          ...base,
          videoSubmission: { downloadURL, storagePath },
          assessmentResults: {
            ...(base.assessmentResults || {}),
            final: { percent: 0, passed: false },
          },
        };
      });
      setProgressError("");
      setVideoSubmitted(true);
    } catch (e) {
      setProgressError(toFriendlyFirebaseError(e, "upload video submission"));
      console.warn("Failed to upload video", e);
    } finally {
      setUploadingVideo(false);
      setSavingResult(false);
    }
  };

  const handleEvalFormSubmit = async () => {
    if (!user?.id || !id || !fromFirestore) return;
    setSavingResult(true);
    try {
      await saveAssessmentResult(user.id, id, "final", { percent: 0, passed: false, score: null, maxScore: null, status: "PENDING_REVIEW" }, course, {
        evalFormSubmission: evalFormValues,
      });
      setProgress((prev) => {
        const base = prev || { assessmentResults: {} };
        return {
          ...base,
          evalFormSubmission: evalFormValues,
          assessmentResults: {
            ...(base.assessmentResults || {}),
            final: { percent: 0, passed: false },
          },
        };
      });
      setProgressError("");
      setEvalFormSubmitted(true);
    } catch (e) {
      setProgressError(toFriendlyFirebaseError(e, "submit evaluation form"));
      console.warn("Failed to save evaluation form", e);
    } finally {
      setSavingResult(false);
    }
  };

  // When final assessment is passed, recheck certification (awards cert if all assessments passed)
  useEffect(() => {
    if (
      submitted &&
      score?.passed &&
      normalizedType === "final" &&
      fromFirestore &&
      user?.id &&
      id
    ) {
      recheckCertification(user.id, id).then((ok) => {
        if (ok) setCertificateEarned(true);
      });
    }
  }, [submitted, score?.passed, normalizedType, fromFirestore, user?.id, id]);

  const waitingForProgress =
    fromFirestore &&
    progress === undefined &&
    (normalizedType === "quiz" || (normalizedType === "final" && questions.length > 0 && !isVideoSubmission && !isEvalForm));

  if (loading || waitingForProgress) {
    return (
      <Layout>
        <div className="assessment-wrapper">
          <p>Loading...</p>
          {progressError && <p className="text-sm text-red-600 mt-2">{progressError}</p>}
        </div>
        <Footer />
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>Course not found.</div>
        <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Modules</button>
        <Footer />
      </Layout>
    );
  }

  if (normalizedType === "final" && isVideoSubmission) {
    const alreadySubmitted = progress?.videoSubmission;
    return (
      <Layout>
        <div className="assessment-wrapper">
          <div className="assessment-header">
            <h2>{course.title}</h2>
            <h4 className="muted">{course.assessmentType}</h4>
          </div>
          {alreadySubmitted ? (
            <div className="result-card">
              <h3>Video submitted</h3>
              <p>Your video has been submitted. An admin will review it and mark the result.</p>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Course</button>
            </div>
          ) : videoSubmitted ? (
            <div className="result-card">
              <h3>Submitted</h3>
              <p>Your video has been uploaded successfully. An admin will review it.</p>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Course</button>
            </div>
          ) : (
            <div className="question-card">
              <p className="mb-3">Upload your video demonstrating the practical task or simulation.</p>
              {progressError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {progressError}
                </div>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="mb-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              <button
                type="button"
                onClick={handleVideoSubmit}
                disabled={!videoFile || uploadingVideo || savingResult}
                className="btn btn-primary"
              >
                {uploadingVideo || savingResult ? "Uploading..." : "Submit video"}
              </button>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn btn-light ml-2">Cancel</button>
            </div>
          )}
        </div>
        <Footer />
      </Layout>
    );
  }

  if (normalizedType === "final" && isEvalForm) {
    const evalQuestions = course.evaluationFormQuestions || [];
    const alreadySubmitted = progress?.evalFormSubmission && Object.keys(progress.evalFormSubmission).length > 0;
    return (
      <Layout>
        <div className="assessment-wrapper">
          <div className="assessment-header">
            <h2>{course.title}</h2>
            <h4 className="muted">Evaluation Form</h4>
          </div>
          {alreadySubmitted ? (
            <div className="result-card">
              <h3>Form submitted</h3>
              <p>Your evaluation form has been submitted. An admin will review it.</p>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Course</button>
            </div>
          ) : evalFormSubmitted ? (
            <div className="result-card">
              <h3>Submitted</h3>
              <p>Your evaluation form has been submitted successfully.</p>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Course</button>
            </div>
          ) : evalQuestions.length === 0 ? (
            <div className="result-card">
              <p>No evaluation form questions have been set for this course yet.</p>
              <button onClick={() => navigate(`/responder/modules/${id}`)} className="btn">Back to Course</button>
            </div>
          ) : (
            <div className="question-card">
              <p className="mb-4">Please complete the evaluation form below.</p>
              {progressError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {progressError}
                </div>
              )}
              {evalQuestions.map((q, i) => (
                <div key={i} className="mb-4">
                  <label className="block font-medium mb-1">{q.question}</label>
                  {q.type === "text" && (
                    <input
                      type="text"
                      value={evalFormValues[`q${i}`] ?? ""}
                      onChange={(e) => setEvalFormValues((v) => ({ ...v, [`q${i}`]: e.target.value }))}
                      className="w-full rounded-lg border border-border/60 bg-background px-3 py-2"
                    />
                  )}
                  {q.type === "textarea" && (
                    <textarea
                      value={evalFormValues[`q${i}`] ?? ""}
                      onChange={(e) => setEvalFormValues((v) => ({ ...v, [`q${i}`]: e.target.value }))}
                      className="w-full rounded-lg border border-border/60 bg-background px-3 py-2"
                      rows={3}
                    />
                  )}
                  {q.type === "radio" && (q.options || []).map((opt, oi) => (
                    <label key={oi} className="block mb-1">
                      <input
                        type="radio"
                        name={`eval-q${i}`}
                        checked={(evalFormValues[`q${i}`] ?? "") === opt}
                        onChange={() => setEvalFormValues((v) => ({ ...v, [`q${i}`]: opt }))}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                  {q.type === "checkbox" && (q.options || []).map((opt) => {
                    const key = `q${i}`;
                    const current = (evalFormValues[key] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                    const checked = current.includes(opt);
                    return (
                      <label key={opt} className="block mb-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked ? current.filter((c) => c !== opt) : [...current, opt];
                            setEvalFormValues((v) => ({ ...v, [key]: next.join(", ") }));
                          }}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              ))}
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={handleEvalFormSubmit} disabled={savingResult} className="btn btn-primary">
                  {savingResult ? "Saving..." : "Submit form"}
                </button>
                <button type="button" onClick={() => navigate(`/responder/modules/${id}`)} className="btn btn-light">Cancel</button>
              </div>
            </div>
          )}
        </div>
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
            {progressError && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {progressError}
              </div>
            )}
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
            {fromFirestore && (
              <p className={score.passed ? "text-green-600 font-medium" : "text-amber-600"}>
                {score.passed ? "Passed" : "Not passed"} (required: {passingScore}%)
              </p>
            )}
            {savingResult && <p className="text-sm text-foreground/60">Saving result...</p>}
            {progressError && <p className="text-sm text-red-600 mt-2">{progressError}</p>}
            {normalizedType === "final" && score.passed && fromFirestore && course.certificationEnabled && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 mt-2 mb-2 text-green-800 text-sm">
                <strong>Certificate earned.</strong> You’ve passed all required assessments.{" "}
                <button
                  type="button"
                  className="underline font-medium hover:no-underline"
                  onClick={() => navigate("/responder/certifications")}
                >
                  View and download your certificate
                </button>
              </div>
            )}
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
