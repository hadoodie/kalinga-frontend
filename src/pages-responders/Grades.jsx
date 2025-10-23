// src/pages/Grades.jsx
import React from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/grades.css";

const Grades = () => {
  // ✅ Exact 12 courses
  const courses = [
    "Professional Development Training Certificate (PDTC)",
    "Emergency Management Certificate Program",
    "Basic Life Support/Emergency Medical Responder (EMR)",
    "Psychological First Aid Basics",
    "Hazardous Materials Awareness Training",
    "Emergency Shelter Management & Logistics",
    "First Aid and CPR Certification",
    "Pediatric Advanced Life Support (PALS)",
    "Infections Disease Control Essentials",
    "Telemedicine Practices in Modern Healthcare",
    "Nursing Care for Post-Operative Patients",
    "Ethics & Legal Issues in Clinical Practice",
  ];

  // ✅ Mock grades (sample only, can later be dynamic)
  const mockGrades = {
    0: { pretest: 85, quiz: 90, final: 88 },
    1: { pretest: 78, quiz: 82, final: 80 },
    2: { pretest: 92, quiz: 89, final: 94 },
    3: { pretest: 75, quiz: 81, final: 79 },
    4: { pretest: 88, quiz: 85, final: 90 },
    5: { pretest: 83, quiz: 87, final: 85 },
    6: { pretest: 90, quiz: 92, final: 93 },
    7: { pretest: 84, quiz: 80, final: 86 },
    8: { pretest: 79, quiz: 82, final: 81 },
    9: { pretest: 91, quiz: 89, final: 92 },
    10: { pretest: 77, quiz: 80, final: 79 },
    11: { pretest: 85, quiz: 88, final: 87 },
  };

  return (
    <Layout>
      <div className="grades-container">
        <h1 className="grades-title">📊  Grades</h1>
        <p className="grades-subtitle">
          Here are your assessment results across all 12 training courses.
        </p>

        <div className="grades-grid">
          {courses.map((title, index) => {
            const grades = mockGrades[index] || { pretest: "-", quiz: "-", final: "-" };

            const overall =
              grades.pretest !== "-" && grades.quiz !== "-" && grades.final !== "-"
                ? Math.round((grades.pretest + grades.quiz + grades.final) / 3)
                : "-";

            return (
              <div key={index} className="grade-card">
                <h3 className="course-title">{title}</h3>
                <div className="grades-list">
                  <p>
                    <span className="label">Pre-Test:</span>{" "}
                    <span className="value">{grades.pretest}</span>
                  </p>
                  <p>
                    <span className="label">Quiz:</span>{" "}
                    <span className="value">{grades.quiz}</span>
                  </p>
                  <p>
                    <span className="label">Final Exam:</span>{" "}
                    <span className="value">{grades.final}</span>
                  </p>
                  <p className="overall">
                    <span className="label">Overall:</span>{" "}
                    <span className="overall-value">{overall}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default Grades;
