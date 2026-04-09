import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import {
  FaInfoCircle,
  FaBook,
  FaClipboardList,
  FaPlayCircle,
  FaLock,
} from "react-icons/fa";
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

const markLessonComplete = (section, lessonId, setProgress) => {
  const progress = getProgress();
  if (!progress[section].includes(lessonId)) {
    progress[section].push(lessonId);
    localStorage.setItem("courseProgress", JSON.stringify(progress));
    setProgress({ ...progress });
  }
};

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ----------------------
// 🔹 Courses Data
// ----------------------
const allCourses = {
  "1": {
    title: "Barangay First 1000 Days Facilitator's Guide eTraining",
    sections: [
      {
        heading: "General Information",
        items: [
          "Welcome Message",
          "Program Overview",
          "Objectives",
          "Implementation Strategies",
        ],
      },
      {
        heading: "Helpful Materials",
        items: [
          "Community Guidelines",
          "Frequently Asked Questions (FAQs)",
          "Technical Assistance Contacts",
        ],
      },
      {
        heading: "Training Material",
        items: [
          "Pre-Test",
          "Module 1: Understanding the First 1000 Days",
          "Lesson 1: Importance of Early Nutrition",
          "Lesson 2: Maternal and Child Health Integration",
          "Lesson 3: Key Nutrition Interventions",
          "Quiz",
          "Activity 1: Apply Your Knowledge",
          "Module 2: Community Mobilization Strategies",
          "Lesson 4: Engaging Stakeholders",
          "Lesson 5: Conducting Barangay Sessions",
          "Lesson 6: Monitoring and Evaluation Tools",
          "Lesson 7: Success Stories and Case Studies",
          "Final Assessment",
        ],
      },
    ],
  },
};

// ----------------------
// 🔹 Component
// ----------------------
const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const getIcon = (heading) => {
    if (heading.includes("General"))
      return <FaInfoCircle className="text-green-700 text-2xl" />;
    if (heading.includes("Helpful"))
      return <FaBook className="text-green-700 text-2xl" />;
    if (heading.includes("Training"))
      return <FaPlayCircle className="text-green-700 text-2xl" />;
    return <FaClipboardList className="text-green-700 text-2xl" />;
  };

  if (!id) {
    return (
      <Layout>
        <div className="course-wrapper">
          <h1 className="course-title">Professional Development Courses</h1>
          <p className="text-gray-600 mb-6">
            Select a course below to begin your eTraining.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(allCourses).map(([courseId, course]) => (
              <div
                key={courseId}
                className="p-5 bg-white border border-green-700 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-semibold text-green-800 text-lg mb-2">
                  {course.title}
                </h3>
                <button
                  onClick={() => navigate(`/modules/${courseId}`)}
                  className="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm"
                >
                  Open Course
                </button>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const course = allCourses[id];
  if (!course)
    return (
      <Layout>
        <p className="p-6 text-red-500">Course not found.</p>
        <Footer />
      </Layout>
    );

  // -------------------------
  // 🔹 Section Unlock
  // -------------------------
  const totalLessons = {
    generalInfo: course.sections[0]?.items.length || 0,
    helpfulMaterials: course.sections[1]?.items.length || 0,
    trainingMaterials: course.sections[2]?.items.length || 0,
  };

  const generalDone = progress.generalInfo.length >= totalLessons.generalInfo;
  const helpfulDone =
    progress.helpfulMaterials.length >= totalLessons.helpfulMaterials;

  const sectionUnlocked = (heading) => {
    if (heading.includes("General")) return true;
    if (heading.includes("Helpful")) return generalDone;
    if (heading.includes("Training")) return generalDone && helpfulDone;
    return false;
  };

  // -------------------------
  // 🔹 Item Unlock
  // -------------------------
  const itemUnlocked = (section, itemIndex) => {
    const sectionKey = section.heading.includes("General")
      ? "generalInfo"
      : section.heading.includes("Helpful")
      ? "helpfulMaterials"
      : "trainingMaterials";

    const completedItems = progress[sectionKey];
    return (
      itemIndex === 0 ||
      completedItems.includes(section.items[itemIndex - 1])
    );
  };

  // -------------------------
  // 🔹 Navigation
  // -------------------------
  const handleItemClick = (section, item, index) => {
    if (!sectionUnlocked(section.heading)) {
      alert("Please complete the previous section first.");
      return;
    }

    if (!itemUnlocked(section, index)) {
      alert("Please complete the previous lesson before proceeding.");
      return;
    }

    const slug = slugify(item);

    // Redirect logic for Training Material
    if (section.heading.includes("Training")) {
      switch (item) {
        case "Pre-Test":
          navigate(`/modules/${id}/assessment/pre-test`);
          break;
        case "Quiz":
          navigate(`/modules/${id}/assessment/quiz`);
          break;
        case "Final Assessment":
          navigate(`/modules/${id}/assessment/final-assessment`);
          break;
        case "Activity 1: Apply Your Knowledge":
          navigate(`/modules/${id}/activity/activity-1-apply-your-knowledge`);
          break;
        case "Module 1: Understanding the First 1000 Days":
          navigate(`/modules/${id}/module-1`);
          break;
        case "Lesson 1: Importance of Early Nutrition":
          navigate(`/modules/${id}/lesson-1`); 
          break;
        case "Lesson 2: Maternal and Child Health Integration":
          navigate(`/modules/${id}/lesson-2`); 
          break;
        case "Lesson 3: Key Nutrition Interventions":
          navigate(`/modules/${id}/lesson-3`); 
          break;
        case "Module 2: Community Mobilization Strategies":
          navigate(`/modules/${id}/module-2`); 
          break;
        case "Lesson 4: Engaging Stakeholders":
          navigate(`/modules/${id}/lesson-4`); 
          break;
        case "Lesson 5: Conducting Barangay Sessions":
          navigate(`/modules/${id}/lesson-5`); 
          break;
        case "Lesson 6: Monitoring and Evaluation Tools":
          navigate(`/modules/${id}/lesson-6`); 
          break;
        case "Lesson 7: Success Stories and Case Studies":
          navigate(`/modules/${id}/lesson-7`); 
          break;
        default:
          navigate(`/modules/${id}/activity/${slug}`);
          break;
      }
      markLessonComplete("trainingMaterials", item, setProgress);
    } else if (section.heading.includes("General")) {
      navigate(`/modules/${id}/info/${slug}`);
      markLessonComplete("generalInfo", item, setProgress);
    } else if (section.heading.includes("Helpful")) {
      navigate(`/modules/${id}/info/${slug}`);
      markLessonComplete("helpfulMaterials", item, setProgress);
    }
  };

  // -------------------------
  // 🔹 Render
  // -------------------------
  return (
    <Layout>
      <div className="course-wrapper">
        <h1 className="course-title">{course.title}</h1>

        {/* Breadcrumbs */}
        <div className="course-breadcrumb">
          <Link to="/responder/online-training"> Home </Link>
          <span>/</span>

          <Link to="/responder/modules" > Modules </Link>
          <span>/</span>

          <span className="text-green-700 font-semibold"> {course.title} </span>
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
          {course.sections.map((section, idx) => {
            const unlocked = sectionUnlocked(section.heading);

            return (
              <div
                key={idx}
                className={`course-card open ${
                  unlocked ? "" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3 p-5 bg-white shadow-md rounded-lg border border-green-700">
                  {getIcon(section.heading)}
                  <span className="course-heading-text">
                    {section.heading}
                    {!unlocked && (
                      <span className="ml-2 flex items-center text-sm text-gray-500">
                        <FaLock className="mr-1" /> Locked
                      </span>
                    )}
                  </span>
                </div>

                {unlocked && (
                  <div className="course-items">
                    {section.items.map((item, i) => {
                      const completed =
                        progress.generalInfo.includes(item) ||
                        progress.helpfulMaterials.includes(item) ||
                        progress.trainingMaterials.includes(item);

                      const canAccess = itemUnlocked(section, i);

                      return (
                        <div
                          key={i}
                          className={`course-subitem flex justify-between items-center font-semibold ${
                            canAccess
                              ? "text-green-700 cursor-pointer hover:underline"
                              : "text-gray-400 cursor-not-allowed"
                          } ${completed ? "text-green-500" : ""}`}
                          onClick={() =>
                            canAccess && handleItemClick(section, item, i)
                          }
                        >
                          <span>{item}</span>
                          {completed && <span>✓</span>}
                          {!completed && !canAccess && (
                            <FaLock className="text-gray-400 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default CourseDetails;
