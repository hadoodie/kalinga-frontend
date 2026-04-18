import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/grades.css";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress, listCourses } from "@/services/trainingService";
import {
  FaGraduationCap,
  FaCertificate,
  FaChartLine,
  FaFilter,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const Grades = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [courses, setCourses] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!user?.id) {
        setCourses([]);
        setProgressRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [courseList, progressList] = await Promise.all([
          listCourses(),
          getUserProgress(user.id),
        ]);
        if (cancelled) return;
        setCourses(Array.isArray(courseList) ? courseList : []);
        setProgressRows(Array.isArray(progressList) ? progressList : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load grades");
          setCourses([]);
          setProgressRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const rows = useMemo(() => {
    return progressRows.map((record) => {
      const course = courses.find((c) => String(c.id) === String(record.courseId));
      const pretest = Number(record?.assessmentResults?.pretest?.percent);
      const quiz = Number(record?.assessmentResults?.quiz?.percent);
      const final = Number(record?.assessmentResults?.final?.percent);
      const available = [pretest, quiz, final].filter((v) => Number.isFinite(v));
      const overall = available.length ? Math.round(available.reduce((a, b) => a + b, 0) / available.length) : null;
      const finalPassed = record?.assessmentResults?.final?.passed === true;
      const certified = Boolean(record?.certifiedAt);

      return {
        id: record.progressId,
        courseId: record.courseId,
        title: course?.title || `Course ${record.courseId}`,
        category: course?.category || "General",
        pretest: Number.isFinite(pretest) ? pretest : null,
        quiz: Number.isFinite(quiz) ? quiz : null,
        final: Number.isFinite(final) ? final : null,
        overall,
        finalPassed,
        certified,
      };
    });
  }, [courses, progressRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterStatus === "all") return true;
      if (filterStatus === "passed") return row.finalPassed;
      if (filterStatus === "inprogress") return row.overall !== null && !row.finalPassed;
      if (filterStatus === "notstarted") return row.overall === null;
      if (filterStatus === "certified") return row.certified;
      return true;
    });
  }, [rows, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.overall !== null).length;
    const passed = rows.filter((r) => r.finalPassed).length;
    const inProgress = rows.filter((r) => r.overall !== null && !r.finalPassed).length;
    const certified = rows.filter((r) => r.certified).length;
    return { completed, passed, inProgress, certified, total: rows.length };
  }, [rows]);

  const getStatusColor = (overall) => {
    if (overall === null) return "muted";
    if (overall >= 80) return "green";
    if (overall >= 60) return "orange";
    return "red";
  };

  return (
    <Layout>
      <div className="grades-container">
        <div className="grades-content">
          <motion.div
            className="grades-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="header-title">
              <FaGraduationCap className="header-icon" />
              <div>
                <h1 className="grades-title">My Grades & Certificates</h1>
                <p className="grades-subtitle">
                  Live grades from completed assessments. Final assessment pass remains the certification gate.
                </p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="empty-state">
              <FaSpinner className="animate-spin" />
              <h3>Loading grades</h3>
            </div>
          ) : error ? (
            <div className="empty-state">
              <FaTimesCircle />
              <h3>Unable to load grades</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <motion.div
                className="grades-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="stat-card total">
                  <div className="stat-icon">
                    <FaChartLine />
                  </div>
                  <div className="stat-info">
                    <h4>
                      {stats.completed}/{stats.total}
                    </h4>
                    <p>Courses With Grades</p>
                  </div>
                </div>
                <div className="stat-card passed">
                  <div className="stat-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <h4>{stats.passed}</h4>
                    <p>Final Passed</p>
                  </div>
                </div>
                <div className="stat-card inprogress">
                  <div className="stat-icon">
                    <FaChartLine />
                  </div>
                  <div className="stat-info">
                    <h4>{stats.inProgress}</h4>
                    <p>In Progress</p>
                  </div>
                </div>
                <div className="stat-card certified">
                  <div className="stat-icon">
                    <FaCertificate />
                  </div>
                  <div className="stat-info">
                    <h4>{stats.certified}</h4>
                    <p>Certified</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="grades-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <FaFilter className="filter-icon" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Courses</option>
                    <option value="passed">Passed Final</option>
                    <option value="inprogress">In Progress</option>
                    <option value="notstarted">Not Started</option>
                    <option value="certified">Certified</option>
                  </select>
                </div>
              </motion.div>

              <div className="grades-grid">
                <AnimatePresence>
                  {filteredRows.map((row, index) => {
                    const statusColor = getStatusColor(row.overall);
                    return (
                      <motion.div
                        key={row.id}
                        className={`grade-card status-${statusColor}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.04 }}
                        layout
                      >
                        <div className="grade-card-header">
                          <div className="course-meta">
                            <span className="category-badge">{row.category}</span>
                          </div>
                          <div className="status-badges">
                            {row.finalPassed ? (
                              <span className="badge badge-passed">
                                <FaCheckCircle /> Passed
                              </span>
                            ) : (
                              <span className="badge badge-locked">
                                <FaTimesCircle /> Pending
                              </span>
                            )}
                            {row.certified && (
                              <span className="badge badge-unlocked">
                                <FaCertificate /> Certified
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="course-title">{row.title}</h3>

                        <div className="grades-list">
                          <div className="grade-row">
                            <span className="label">Pre-Test:</span>
                            <span className="value">{row.pretest !== null ? `${row.pretest}%` : "-"}</span>
                          </div>
                          <div className="grade-row">
                            <span className="label">Quiz:</span>
                            <span className="value">{row.quiz !== null ? `${row.quiz}%` : "-"}</span>
                          </div>
                          <div className="grade-row">
                            <span className="label">Final:</span>
                            <span className="value">{row.final !== null ? `${row.final}%` : "-"}</span>
                          </div>
                        </div>

                        <div className="overall-section">
                          <div className="overall-row">
                            <span className="label">Overall:</span>
                            <span className={`overall-value ${statusColor}`}>
                              {row.overall !== null ? `${row.overall}%` : "-"}
                            </span>
                          </div>
                          <div className="progress-wrapper">
                            <div className="progress-bar">
                              <motion.div
                                className={`progress-fill ${statusColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${row.overall || 0}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                              />
                            </div>
                            <span className="progress-percent">{row.overall || 0}%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredRows.length === 0 && (
                <div className="empty-state">
                  <FaGraduationCap />
                  <h3>No grades found</h3>
                  <p>Complete assessments to populate this dashboard.</p>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </Layout>
  );
};

export default Grades;
