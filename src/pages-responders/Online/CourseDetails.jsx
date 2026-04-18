import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import {
  FaInfoCircle,
  FaBook,
  FaPlayCircle,
  FaClipboardList,
  FaSpinner,
  FaFilePdf,
  FaFileVideo,
  FaFileAlt,
  FaClipboardCheck,
} from "react-icons/fa";
import { getCourse, getProgress } from "@/services/trainingService";
import { useAuth } from "@/context/AuthContext";
import "../../styles/courseDetails.css";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toFriendlyFirebaseError = (err) => {
    const code = err?.code ? String(err.code) : "unknown";
    if (code.includes("permission-denied")) {
      return "Training progression is unavailable due to Firestore permissions (permission-denied).";
    }
    return err?.message || "Unable to load training progression.";
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCourse(id)
      .then((data) => {
        if (!cancelled) setCourse(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load course");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user?.id || !id) return;
    let cancelled = false;
    setProgressError("");
    getProgress(user.id, id)
      .then((p) => { if (!cancelled) setProgress(p); })
      .catch((e) => {
        if (!cancelled) {
          setProgress(null);
          setProgressError(toFriendlyFirebaseError(e));
        }
      });
    return () => { cancelled = true; };
  }, [user?.id, id]);

  const getIcon = (heading) => {
    if (heading?.includes("General")) return <FaInfoCircle className="text-green-700 text-2xl" />;
    if (heading?.includes("Helpful")) return <FaBook className="text-green-700 text-2xl" />;
    if (heading?.includes("Training")) return <FaPlayCircle className="text-green-700 text-2xl" />;
    return <FaClipboardList className="text-green-700 text-2xl" />;
  };

  const getItemIcon = (item) => {
    const t = (item.type || "").toLowerCase();
    if (t === "video") return <FaFileVideo className="text-green-700 mr-2" />;
    if (t === "pdf") return <FaFilePdf className="text-green-700 mr-2" />;
    return <FaFileAlt className="text-green-700 mr-2" />;
  };

  if (!id) {
    return (
      <Layout>
        <div className="course-wrapper">
          <h1 className="course-title">Professional Development Courses</h1>
          <p className="text-gray-600 mb-6">
            Select a course from the Modules page to begin.
          </p>
          <Link to="/responder/modules" className="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm inline-block">
            Browse Modules
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="course-wrapper flex justify-center items-center py-12">
          <FaSpinner className="h-8 w-8 animate-spin text-green-700" />
        </div>
        <Footer />
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="course-wrapper">
          <p className="p-6 text-red-500">{error || "Course not found."}</p>
          <Link to="/responder/modules" className="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm inline-block">
            Back to Modules
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  const sections = course.sections || [];

  return (
    <Layout>
      <div className="course-wrapper">
        <h1 className="course-title">{course.title}</h1>

        <div className="course-breadcrumb">
          <Link to="/responder/online-training">Home</Link>
          <span> / </span>
          <Link to="/responder/modules">Modules</Link>
          <span> / </span>
          <span className="text-green-700 font-semibold">{course.title}</span>
        </div>

        {course.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{course.description}</p>
        )}

        {progressError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {progressError}
          </div>
        )}

        {course.certificationEnabled && (course.assessments || course.assessmentType === "Practical Test" || course.assessmentType === "Simulation" || course.assessmentType === "Evaluation Form") && (
          <div className="mb-6 rounded-xl border border-green-700 bg-green-50/50 p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <FaClipboardCheck /> Assessments (required for certification)
            </h3>
            {(course.assessmentType === "Practical Test" || course.assessmentType === "Simulation") && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a video of your {course.assessmentType === "Simulation" ? "simulation" : "practical task"}. An admin will review and mark your result.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/responder/modules/${id}/assessment/final-assessment`)}
                    className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800"
                  >
                    {progress?.videoSubmission ? "View submission" : "Submit video"}
                  </button>
                </div>
              </>
            )}
            {course.assessmentType === "Evaluation Form" && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Complete the evaluation form. An admin will review your responses.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/responder/modules/${id}/assessment/final-assessment`)}
                    className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800"
                  >
                    {progress?.evalFormSubmission && Object.keys(progress.evalFormSubmission).length > 0 ? "View submission" : "Complete evaluation form"}
                  </button>
                </div>
              </>
            )}
            {course.assessmentType !== "Practical Test" && course.assessmentType !== "Simulation" && course.assessmentType !== "Evaluation Form" && course.assessments && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Take Pre-test first, then Quiz (pass 70% to unlock Final), then Final (pass 70% and complete all content to earn the certificate).
                </p>
                <div className="flex flex-wrap gap-2">
                  {course.assessments.pretest?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/responder/modules/${id}/assessment/pre-test`)}
                      className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800"
                    >
                      Pre-Test
                    </button>
                  )}
                  {course.assessments.quiz?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/responder/modules/${id}/assessment/quiz`)}
                      disabled={!progress?.assessmentResults?.pretest}
                      title={!progress?.assessmentResults?.pretest ? "Complete Pre-test first" : ""}
                      className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Quiz {!progress?.assessmentResults?.pretest ? "(complete Pre-test first)" : ""}
                    </button>
                  )}
                  {course.assessments.final?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/responder/modules/${id}/assessment/final-assessment`)}
                      disabled={!(progress?.assessmentResults?.quiz?.passed)}
                      title={!(progress?.assessmentResults?.quiz?.passed) ? "Pass Quiz (70%) to unlock Final" : ""}
                      className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Final Assessment {!(progress?.assessmentResults?.quiz?.passed) ? "(pass Quiz first)" : ""}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-600">
              <p>No sections or materials have been added to this course yet.</p>
              <Link to="/responder/modules" className="mt-2 inline-block text-green-700 font-medium">
                Back to Modules
              </Link>
            </div>
          ) : (
            sections.map((section, idx) => (
              <div key={idx} className="course-card open">
                <div className="flex items-center gap-3 p-5 bg-white shadow-md rounded-lg border border-green-700">
                  {getIcon(section.heading)}
                  <span className="course-heading-text">{section.heading}</span>
                </div>

                <div className="course-items">
                  {(section.items || []).map((item, i) => {
                    const slug = slugify(item.title);
                    const hasContent = !!item.downloadURL;
                    return (
                      <div
                        key={i}
                        className="course-subitem flex justify-between items-center font-semibold text-green-700 cursor-pointer hover:underline"
                        onClick={() =>
                          navigate(`/responder/modules/${id}/content/${slug}`)
                        }
                      >
                        <span className="flex items-center">
                          {getItemIcon(item)}
                          {item.title}
                          {!hasContent && (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (no file)
                            </span>
                          )}
                        </span>
                        <span>Open</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
