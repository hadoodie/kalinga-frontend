// src/pages/Grades.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/grades.css";
import {
  FaGraduationCap,
  FaAward,
  FaCertificate,
  FaChartLine,
  FaDownload,
  FaLock,
  FaLockOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
  FaFilter,
  FaSearch,
} from "react-icons/fa";

const Grades = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [certificates, setCertificates] = useState({});

  // Course data with categories
  const courses = [
    {
      id: 1,
      title: "Professional Development Training Certificate (PDTC)",
      category: "Professional Development",
      duration: "40 hours",
    },
    {
      id: 2,
      title: "Emergency Management Certificate Program",
      category: "Emergency Response",
      duration: "32 hours",
    },
    {
      id: 3,
      title: "Basic Life Support/Emergency Medical Responder (EMR)",
      category: "Medical",
      duration: "24 hours",
    },
    {
      id: 4,
      title: "Psychological First Aid Basics",
      category: "Mental Health",
      duration: "16 hours",
    },
    {
      id: 5,
      title: "Hazardous Materials Awareness Training",
      category: "Safety",
      duration: "20 hours",
    },
    {
      id: 6,
      title: "Emergency Shelter Management & Logistics",
      category: "Emergency Response",
      duration: "28 hours",
    },
    {
      id: 7,
      title: "First Aid and CPR Certification",
      category: "Medical",
      duration: "18 hours",
    },
    {
      id: 8,
      title: "Pediatric Advanced Life Support (PALS)",
      category: "Medical",
      duration: "24 hours",
    },
    {
      id: 9,
      title: "Infections Disease Control Essentials",
      category: "Medical",
      duration: "20 hours",
    },
    {
      id: 10,
      title: "Telemedicine Practices in Modern Healthcare",
      category: "Technology",
      duration: "16 hours",
    },
    {
      id: 11,
      title: "Nursing Care for Post-Operative Patients",
      category: "Medical",
      duration: "32 hours",
    },
    {
      id: 12,
      title: "Ethics & Legal Issues in Clinical Practice",
      category: "Professional Development",
      duration: "12 hours",
    },
  ];

  // Mock grades with unlocked status
  const mockGrades = {
    1: { pretest: 85, quiz: 90, final: 88, unlocked: true },
    2: { pretest: 78, quiz: 82, final: 80, unlocked: true },
    3: { pretest: 92, quiz: 89, final: 94, unlocked: true },
    4: { pretest: 75, quiz: 81, final: 79, unlocked: true },
    5: { pretest: 88, quiz: 85, final: 90, unlocked: true },
    6: { pretest: 83, quiz: 87, final: 85, unlocked: true },
    7: { pretest: 90, quiz: 92, final: 93, unlocked: true },
    8: { pretest: 84, quiz: 80, final: 86, unlocked: true },
    9: { pretest: 79, quiz: 82, final: 81, unlocked: false },
    10: { pretest: null, quiz: null, final: null, unlocked: false },
    11: { pretest: 77, quiz: 80, final: null, unlocked: true },
    12: { pretest: 85, quiz: 88, final: 87, unlocked: true },
  };

  const computeOverall = (grades) => {
    const scores = [grades.pretest, grades.quiz, grades.final].filter(
      (s) => s !== null
    );
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getStatusColor = (overall) => {
    if (overall === null) return "muted";
    if (overall >= 80) return "green";
    if (overall >= 60) return "orange";
    return "red";
  };

  const claimCertificate = (courseId) => {
    setCertificates((prev) => ({ ...prev, [courseId]: true }));
  };

  const revokeCertificate = (courseId) => {
    setCertificates((prev) => {
      const updated = { ...prev };
      delete updated[courseId];
      return updated;
    });
  };

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const grades = mockGrades[course.id];
      const overall = computeOverall(grades);
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "passed")
        return matchesSearch && overall !== null && overall >= 80;
      if (filterStatus === "inprogress")
        return matchesSearch && overall !== null && overall < 80;
      if (filterStatus === "notstarted")
        return matchesSearch && overall === null;
      if (filterStatus === "certified")
        return matchesSearch && certificates[course.id];
      return matchesSearch;
    });
  }, [searchTerm, filterStatus, certificates]);

  // Stats calculation
  const stats = useMemo(() => {
    let completed = 0,
      passed = 0,
      inProgress = 0,
      certified = 0;
    courses.forEach((course) => {
      const grades = mockGrades[course.id];
      const overall = computeOverall(grades);
      if (overall !== null) {
        completed++;
        if (overall >= 80) passed++;
        else inProgress++;
      }
      if (certificates[course.id]) certified++;
    });
    return { completed, passed, inProgress, certified, total: courses.length };
  }, [certificates]);

  return (
    <Layout>
      <div className="grades-container">
        <div className="grades-content">
          {/* Header */}
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
                  Track your assessment results across all training courses.
                  Green = passed (≥80%), Orange = borderline (60-79%), Red =
                  below 60%.
                </p>
              </div>
            </div>
            <button
              className="refresh-btn"
              onClick={() => window.location.reload()}
            >
              <FaSyncAlt /> Refresh
            </button>
          </motion.div>

          {/* Stats Cards */}
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
                <p>Courses Completed</p>
              </div>
            </div>
            <div className="stat-card passed">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <h4>{stats.passed}</h4>
                <p>Passed (≥80%)</p>
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
                <p>Certificates Claimed</p>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
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
                <option value="passed">Passed Only</option>
                <option value="inprogress">In Progress</option>
                <option value="notstarted">Not Started</option>
                <option value="certified">Certified</option>
              </select>
            </div>
          </motion.div>

          {/* Grades Grid */}
          <div className="grades-grid">
            <AnimatePresence>
              {filteredCourses.map((course, index) => {
                const grades = mockGrades[course.id] || {
                  pretest: null,
                  quiz: null,
                  final: null,
                  unlocked: false,
                };
                const overall = computeOverall(grades);
                const statusColor = getStatusColor(overall);
                const finalPassed = grades.final !== null && grades.final >= 80;
                const certClaimed = certificates[course.id];

                return (
                  <motion.div
                    key={course.id}
                    className={`grade-card status-${statusColor}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <div className="grade-card-header">
                      <div className="course-meta">
                        <span className="category-badge">
                          {course.category}
                        </span>
                        <span className="duration-badge">
                          {course.duration}
                        </span>
                      </div>
                      <div className="status-badges">
                        <span
                          className={`badge ${
                            grades.unlocked ? "badge-unlocked" : "badge-locked"
                          }`}
                        >
                          {grades.unlocked ? (
                            <>
                              <FaLockOpen /> Unlocked
                            </>
                          ) : (
                            <>
                              <FaLock /> Locked
                            </>
                          )}
                        </span>
                        {finalPassed && (
                          <span className="badge badge-passed">
                            <FaCheckCircle /> Passed
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="course-title">{course.title}</h3>

                    <div className="grades-list">
                      <div className="grade-row">
                        <span className="label">Pre-Test:</span>
                        <span className="value">
                          {grades.pretest !== null ? `${grades.pretest}%` : "—"}
                        </span>
                      </div>
                      <div className="grade-row">
                        <span className="label">Quiz:</span>
                        <span className="value">
                          {grades.quiz !== null ? `${grades.quiz}%` : "—"}
                        </span>
                      </div>
                      <div className="grade-row">
                        <span className="label">Final Exam:</span>
                        <span className="value">
                          {grades.final !== null ? `${grades.final}%` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="overall-section">
                      <div className="overall-row">
                        <span className="label">Overall:</span>
                        <span className={`overall-value ${statusColor}`}>
                          {overall !== null ? `${overall}%` : "—"}
                        </span>
                      </div>
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <motion.div
                            className={`progress-fill ${statusColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${overall || 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <span className="progress-percent">
                          {overall || 0}%
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {finalPassed && !certClaimed && (
                        <button
                          className="btn btn-primary"
                          onClick={() => claimCertificate(course.id)}
                        >
                          <FaAward /> Claim Certificate
                        </button>
                      )}
                      {certClaimed && (
                        <>
                          <button className="btn btn-success">
                            <FaDownload /> Download
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => revokeCertificate(course.id)}
                          >
                            Revoke
                          </button>
                        </>
                      )}
                      {!finalPassed && overall !== null && (
                        <button className="btn btn-light">
                          <FaTimesCircle /> Needs Final ≥80%
                        </button>
                      )}
                      {overall === null && (
                        <button className="btn btn-light">Not Started</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredCourses.length === 0 && (
            <div className="empty-state">
              <FaGraduationCap />
              <h3>No courses found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </Layout>
  );
};

export default Grades;
