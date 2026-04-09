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
  FaSpinner,
  FaBookOpen,
} from "react-icons/fa";

const CATEGORY_ICONS = {
  general: <FaBookOpen size={28} color="#6b7280" />,
  medical: <FaBriefcaseMedical size={28} color="#dc3545" />,
  emergency: <FaAmbulance size={28} color="#007bff" />,
  nursing: <FaUserNurse size={28} color="#28a745" />,
  pharmacology: <FaCapsules size={28} color="#6f42c1" />,
  bls: <FaHeartbeat size={28} color="#e83e8c" />,
  mental: <FaBrain size={28} color="#20c997" />,
  professional: <FaBookOpen size={28} color="#6610f2" />,
  community: <FaBookOpen size={28} color="#ffc107" />,
  compliance: <FaBookOpen size={28} color="#17a2b8" />,
};

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

        {activeTab === "Courses" && (
          <>
            <div className="filter-dropdown">
              <label>Filter by Category: </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="section">
                <div className="flex justify-center py-12">
                  <FaSpinner className="h-8 w-8 animate-spin text-green-700" />
                </div>
              </div>
            ) : error ? (
              <div className="section">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="section">
                <h3>Courses</h3>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-600">
                  <FaBookOpen className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                  <p>No courses available yet. Check back later.</p>
                </div>
              </div>
            ) : (
              <div className="section">
                <h3>Training Courses</h3>
                <div className="card-grid">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="card clickable-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/responder/modules/${course.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(`/responder/modules/${course.id}`);
                      }}
                    >
                      <div className="card-icon">
                        {getCategoryIcon(course.category)}
                      </div>
                      <h4>{course.title}</h4>
                      <p>
                        {course.description ||
                          "Training course for responders. Open to view sections and materials."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "Personal Training Record" && (
          <div className="training-record">
            <div className="section">
              <h3>Personal Training Record</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete courses from the Courses tab. Your progress is tracked per course.
              </p>
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
                    const finalPassed = record.assessmentResults?.final?.passed === true;
                    const completed = !!record.certifiedAt || finalPassed || progressPct === 100;
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
