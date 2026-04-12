// src/pages/Online/Modules.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/personnel-style.css";
import { useAuth } from "@/context/AuthContext";
import { listCourses, getUserProgress } from "@/services/trainingService";
import {
  FaBriefcaseMedical,
  FaUserNurse,
  FaAmbulance,
  FaCapsules,
  FaHeartbeat,
  FaBrain,
  FaVirus,
  FaSyringe,
  FaMobileAlt,
  FaUsers,
  FaBalanceScale,
  FaCertificate,
  FaDownload,
} from "react-icons/fa";

// Full Category Filters
const FILTERS = [
  "All",
  "Emergency Medicine & Trauma Care",
  "Nursing & Patient Care",
  "Disaster Response & Management",
  "Pharmacology & Medication Management",
  "Basic Life Support (BLS) & Advanced Cardiac Life Support (ACLS)",
  "Mental Health & Psychological First Aid",
  "Infectious Disease Control & Public Health",
  "Surgical & Critical Care Skills",
  "Telemedicine & Digital Health Tools",
  "Community Health & Outreach",
  "Medical Ethics & Legal Standards",
  "Continuing Professional Development & Licensing",
];

// Category → Icon mapping
const CATEGORY_ICONS = {
  "Emergency Medicine & Trauma Care": <FaAmbulance size={28} color="#007bff" />,
  "Nursing & Patient Care": <FaUserNurse size={28} color="#28a745" />,
  "Disaster Response & Management": (
    <FaBriefcaseMedical size={28} color="#dc3545" />
  ),
  "Pharmacology & Medication Management": (
    <FaCapsules size={28} color="#6f42c1" />
  ),
  "Basic Life Support (BLS) & Advanced Cardiac Life Support (ACLS)": (
    <FaHeartbeat size={28} color="#e83e8c" />
  ),
  "Mental Health & Psychological First Aid": (
    <FaBrain size={28} color="#20c997" />
  ),
  "Infectious Disease Control & Public Health": (
    <FaVirus size={28} color="#fd7e14" />
  ),
  "Surgical & Critical Care Skills": <FaSyringe size={28} color="#17a2b8" />,
  "Telemedicine & Digital Health Tools": (
    <FaMobileAlt size={28} color="#343a40" />
  ),
  "Community Health & Outreach": <FaUsers size={28} color="#ffc107" />,
  "Medical Ethics & Legal Standards": (
    <FaBalanceScale size={28} color="#6c757d" />
  ),
  "Continuing Professional Development & Licensing": (
    <FaCertificate size={28} color="#6610f2" />
  ),
};

// Expanded Courses (IDs must match CourseDetails.jsx)
const COURSES = [
  {
    id: 1,
    title: "Barangay First 1000 Days Facilitator's Guide eTraining",
    category: "Recently Viewed Courses",
    type: "Community Health & Outreach",
  },
  {
    id: 2,
    title: "DOH Integrated People-Centered Health Services",
    category: "Recently Viewed Courses",
    type: "Continuing Professional Development & Licensing",
  },
  {
    id: 3,
    title: "Integrated Course on Primary Care",
    category: "Recently Viewed Courses",
    type: "Community Health & Outreach",
  },
  {
    id: 4,
    title:
      "Introduction to Seven Major Recommendations to Prevent Tuberculosis Transmission",
    category: "Recently Viewed Courses",
    type: "Infectious Disease Control & Public Health",
  },
  {
    id: 5,
    title: "Healthy Hearts Technical Package",
    category: "Most Popular Certificates",
    type: "Continuing Professional Development & Licensing",
  },
  {
    id: 6,
    title:
      "Basic Course in Family Planning Final Exam and Certificate of Training",
    category: "Most Popular Certificates",
    type: "Community Health & Outreach",
  },
  {
    id: 7,
    title: "Nutrition Care Process for Clinical Nutritionist Dietitians",
    category: "Most Popular Certificates",
    type: "Community Health & Outreach",
  },
  {
    id: 8,
    title:
      "Basic Life Support Online Training - Didactic [NCMH - 2025 BATCH 10]",
    category: "Most Popular Certificates",
    type: "Basic Life Support (BLS) & Advanced Cardiac Life Support (ACLS)",
  },
  {
    id: 9,
    title:
      "Basic Course on Continuous Quality Improvement for Health Facilities",
    category: "Most Popular Certificates",
    type: "Continuing Professional Development & Licensing",
  },
  {
    id: 10,
    title: "Data to Policy Competency 1 - Problem Statement",
    category: "Most Popular Certificates",
    type: "Continuing Professional Development & Licensing",
  },
  {
    id: 11,
    title:
      "Orientation on Navigating the Continuing Professional Accreditation System (CPDAS)",
    category: "Most Popular Certificates",
    type: "Continuing Professional Development & Licensing",
  },
  {
    id: 12,
    title: "Laboratory Quality Management System Online Training",
    category: "Most Popular Certificates",
    type: "Infectious Disease Control & Public Health",
  },
];

const TABS = ["Courses", "Personal Training Record"];

const Modules = () => {
  const [activeTab, setActiveTab] = useState("Courses");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [courses, setCourses] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCourses()
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id || activeTab !== "Personal Training Record") {
      if (activeTab !== "Personal Training Record") {
        setTrainingProgress([]);
        setProgressError(null);
        setProgressLoading(false);
      }
      return;
    }
    let cancelled = false;
    setProgressLoading(true);
    setProgressError(null);
    getUserProgress(user.id)
      .then((progress) => {
        if (!cancelled) setTrainingProgress(progress);
      })
      .catch((e) => {
        if (!cancelled) setTrainingProgress([]);
        if (!cancelled) setProgressError(e.message || "Failed to load training progress");
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, activeTab]);

  const categories = ["All", ...new Set(courses.map((c) => c.category).filter(Boolean))];
  const filteredCourses =
    selectedFilter === "All"
      ? courses
      : courses.filter((c) => c.category === selectedFilter);

  const getCategoryIcon = (category) => {
    const key = (category || "general").toLowerCase();
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.general;
  };

  return (
    <Layout>
      <div className="content">
        {/* Tabs */}
        <div className="tabs">
          {TABS.map((tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Courses Section */}
        {activeTab === "Courses" && (
          <>
            {/* Filter Dropdown */}
            <div className="filter-dropdown">
              <label>Filter by Category: </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </div>

            {/* Recently Viewed */}
            <div className="section">
              <h3>Recently Viewed Courses</h3>
              <div className="card-grid">
                {filteredCourses
                  .filter((c) => c.category === "Recently Viewed Courses")
                  .map((course) => (
                    <div
                      className="card clickable-card"
                      key={course.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/modules/${course.id}`)} // ✅ linked
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          navigate(`/modules/${course.id}`);
                      }}
                    >
                      <div className="card-icon">
                        {CATEGORY_ICONS[course.type]}
                      </div>
                      <h4>{course.title}</h4>
                      <p>
                        Short description about {course.title} and why it’s
                        useful.
                      </p>

                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.floor(Math.random() * 60) + 20}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most Popular */}
            <div className="section">
              <h3>Most Popular Certificates</h3>
              <div className="card-grid">
                {filteredCourses
                  .filter((c) => c.category === "Most Popular Certificates")
                  .map((course) => (
                    <div
                      className="card clickable-card"
                      key={course.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/modules/${course.id}`)} // ✅ linked
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          navigate(`/modules/${course.id}`);
                      }}
                    >
                      <div className="card-icon">
                        {CATEGORY_ICONS[course.type]}
                      </div>
                      <h4>{course.title}</h4>
                      <p>
                        Enroll now and boost your skills with {course.title}.
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Personal Training Record */}
        {activeTab === "Personal Training Record" && (
          <div className="training-record">
            {/* Pending */}
            <div className="section">
              <h3>Pending Trainings</h3>
              <table className="record-table">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Course</th>
                    <th style={{ width: "15%" }}>Status</th>
                    <th style={{ width: "20%" }}>Due Date</th>
                    <th style={{ width: "20%" }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Disaster Response & Management Essentials</td>
                    <td className="status pending">Pending</td>
                    <td>Oct 30, 2025</td>
                    <td>
                      <div className="progress small">
                        <div
                          className="progress-fill"
                          style={{ width: "50%" }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Pediatric Advanced Life Support (PALS)</td>
                    <td className="status pending">Pending</td>
                    <td>Nov 15, 2025</td>
                    <td>
                      <div className="progress small">
                        <div
                          className="progress-fill"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Available */}
            <div className="section">
              <h3>Available Trainings</h3>
              <table className="record-table">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Course</th>
                    <th style={{ width: "35%" }}>Open Date</th>
                    <th style={{ width: "20%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Emergency Shelter Management</td>
                    <td>Available Now</td>
                    <td>
                      <button className="btn-outline">Start</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Basic First Aid and CPR</td>
                    <td>Available Now</td>
                    <td>
                      <button className="btn-outline">Start</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Completed */}
            <div className="section">
              <h3>Completed Trainings</h3>
              <table className="record-table">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Course</th>
                    <th style={{ width: "35%" }}>Date Completed</th>
                    <th style={{ width: "20%" }}>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Hazardous Materials Awareness</td>
                    <td>Aug 10, 2025</td>
                    <td>
                      <button className="btn-download">
                        <FaDownload /> View Certificate
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Infectious Disease Control Essentials</td>
                    <td>Jul 22, 2025</td>
                    <td>
                      <button className="btn-download">
                        <FaDownload /> View Certificate
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {progressLoading ? (
              <div className="section">
                <div className="flex justify-center py-12">
                  <FaSpinner className="h-8 w-8 animate-spin text-green-700" />
                </div>
              </div>
            ) : progressError ? (
              <div className="section">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {progressError}
                </div>
              </div>
            ) : trainingProgress.length === 0 ? (
              <div className="section">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-600">
                  <FaBookOpen className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                  <p>No training records yet. Complete course content to start tracking progress.</p>
                </div>
              </div>
            ) : (
              <div className="section">
                <h4 className="mb-4">Course Progress</h4>
                <div className="card-grid">
                  {trainingProgress.map((record) => {
                    const course = courses.find((c) => String(c.id) === String(record.courseId));
                    const totalItems = course?.sections?.reduce(
                      (sum, section) => sum + ((section.items || []).length || 0),
                      0
                    );
                    const completedCount = Array.isArray(record.completedContent) ? record.completedContent.length : 0;
                    const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
                    const hasPretest = Array.isArray(course?.assessments?.pretest) && course.assessments.pretest.length > 0;
                    const hasQuiz = Array.isArray(course?.assessments?.quiz) && course.assessments.quiz.length > 0;
                    const hasFinal = Array.isArray(course?.assessments?.final) && course.assessments.final.length > 0;
                    const hasAssessmentTrack = hasPretest || hasQuiz || hasFinal;
                    const pretestPassed = record.assessmentResults?.pretest?.passed === true;
                    const quizPassed = record.assessmentResults?.quiz?.passed === true;
                    const finalPassed = record.assessmentResults?.final?.passed === true;
                    const assessmentsPassed =
                      (!hasPretest || pretestPassed) &&
                      (!hasQuiz || quizPassed) &&
                      (!hasFinal || finalPassed);
                    const completed = !!record.certifiedAt || (hasAssessmentTrack ? assessmentsPassed : progressPct === 100);
                    const pretestGrade = record.assessmentResults?.pretest?.percent;
                    const quizGrade = record.assessmentResults?.quiz?.percent;
                    const finalGrade = record.assessmentResults?.final?.percent;
                    return (
                      <div key={record.progressId} className="card training-record-card">
                        <div className="card-icon">{getCategoryIcon(course?.category)}</div>
                        <h4>{course?.title || `Course ${record.courseId}`}</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {course?.description || "Track your course progress and completion status."}
                        </p>
                        <div className="text-sm text-gray-700 mb-2">
                          Status: <strong>{completed ? "Completed" : "In progress"}</strong>
                        </div>
                        <div className="text-xs text-gray-600 mb-2 space-y-1">
                          {Number.isFinite(Number(pretestGrade)) && <p>Pre-test Grade: {Number(pretestGrade)}%</p>}
                          {Number.isFinite(Number(quizGrade)) && <p>Quiz Grade: {Number(quizGrade)}%</p>}
                          {Number.isFinite(Number(finalGrade)) && <p>Final Grade: {Number(finalGrade)}%</p>}
                          {!Number.isFinite(Number(pretestGrade)) && !Number.isFinite(Number(quizGrade)) && !Number.isFinite(Number(finalGrade)) && (
                            <p>Grade: Not available yet</p>
                          )}
                        </div>
                        {totalItems > 0 && (
                          <div className="progress-bar" style={{ marginBottom: 8 }}>
                            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {completedCount} of {totalItems || "?"} content items completed
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </Layout>
  );
};

export default Modules;
