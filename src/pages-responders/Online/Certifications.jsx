// src/pages/Online/Certifications.jsx
import React from "react";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/personnel-style.css";
import {
  FaDownload,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";

const Certifications = () => {
  return (
    <Layout>
      <div className="content">
        <h1 className="page-title">Certifications</h1>

        {/* Medical Licenses */}
        <div className="section">
          <h3>Medical Licenses</h3>
          <div className="card-list">
            <div className="gray-card">
              <p className="title">Registered Nurse (RN) License</p>
              <p className="subtitle">License No. / Expiration</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
            <div className="gray-card">
              <p className="title">Dentist License</p>
              <p className="subtitle">License No. / Expiration</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
            <div className="gray-card">
              <p className="title">Medical Technologist License</p>
              <p className="subtitle">License No./ Expiration</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
            <div className="gray-card">
              <p className="title">Pharmacist License</p>
              <p className="subtitle">License No. / Expiration</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
            <div className="gray-card">
              <p className="title">
                Physical and Occupational Therapist License
              </p>
              <p className="subtitle">License No. / Expiration</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
          </div>
          <button className="btn-outline small">
            <FaPlus /> Add License
          </button>
        </div>

        {/* Advanced Certifications */}
        <div className="section">
          <h3>Advanced Certifications</h3>
          <div className="card-list">
            <div className="gray-card">
              <p className="title">Pediatric Advanced Life Support (PALS)</p>
              <span className="status active">
                <FaCheckCircle /> Active
              </span>
            </div>
            <div className="gray-card">
              <p className="title">Advanced Cardiac Life Support (ACLS)</p>
              <span className="status expired">
                <FaTimesCircle /> Expired
              </span>
            </div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="section">
          <h3>Completed Courses</h3>
          <table className="cert-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Course</th>
                <th style={{ width: "25%" }}>Date Completed</th>
                <th style={{ width: "25%" }}>Certificate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hazardous Materials Awareness Training</td>
                <td>-</td>
                <td>
                  <button className="btn-download">
                    <FaDownload /> Download
                  </button>
                </td>
              </tr>
              <tr>
                <td>Emergency Shelter Management & Logistics</td>
                <td>-</td>
                <td>
                  <button className="btn-download">
                    <FaDownload /> Download
                  </button>
                </td>
              </tr>
              <tr>
                <td>Basic First Aid and CPR Certification</td>
                <td>-</td>
                <td>
                  <button className="btn-download">
                    <FaDownload /> Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Other Certifications */}
        <div className="section">
          <h3>Other Certifications</h3>
          <div className="gray-card clickable">
            <FaPlus /> <span>Add Certification</span>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default Certifications;
