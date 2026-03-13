// src/pages/Online/ActivityPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/activityPage.css";

export default function ActivityPage() {
  const { id, slug } = useParams();
  const navigate = useNavigate();

  const activityKey = `module-${id}-activity-${slug}`;
  const [file, setFile] = useState(null);
  const [savedFile, setSavedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Activity content based on slug
  const activityContent = {
    "activity-1-apply-your-knowledge": {
      title: "Activity 1: Apply Your Knowledge",
      instructions:
        "Based on what you learned in Module 1 about the First 1000 Days, create a simple nutrition education material or poster that can be used in your barangay. Your output should include key messages about early nutrition and its importance.",
      allowedFormats: "PDF, JPG, PNG, DOCX",
    },
  };

  const currentActivity = activityContent[slug] || {
    title: "Module Activity",
    instructions:
      "Complete the required task for this module and upload your output.",
    allowedFormats: "PDF, JPG, PNG, MP4, DOCX",
  };

  useEffect(() => {
    const stored = localStorage.getItem(activityKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSavedFile(parsed);
      setIsSubmitted(true);
    }
  }, [activityKey]);

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0];
    setFile(uploaded);
  };

  const handleSubmit = () => {
    if (!file) return alert("Please upload a file before submitting.");

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "video/mp4",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a PDF, JPG, PNG, MP4, or DOCX file.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return alert("File size too large. Maximum size is 10MB.");

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataURL: reader.result,
        submittedAt: new Date().toISOString(),
      };

      localStorage.setItem(activityKey, JSON.stringify(fileData));
      setSavedFile(fileData);
      setIsSubmitted(true);

      const progress = JSON.parse(localStorage.getItem("courseProgress")) || {
        generalInfo: [],
        helpfulMaterials: [],
        trainingMaterials: [],
      };

      const activityTitle = currentActivity.title;
      if (!progress.trainingMaterials.includes(activityTitle)) {
        progress.trainingMaterials.push(activityTitle);
        localStorage.setItem("courseProgress", JSON.stringify(progress));
      }

      alert("✅ Activity submitted successfully!");

      setTimeout(() => navigate(`/modules/${id}`), 800);
    };

    reader.readAsDataURL(file);
  };

  const handleResubmit = () => {
    setIsSubmitted(false);
    setFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Layout>
      <div className="activity-page-wrapper">
        {/* Hero Section */}
        <div className="activity-hero">
          <div className="activity-hero-content">
            <div className="activity-breadcrumbs">
              <Link to="/responder/modules" className="breadcrumb-link">Modules</Link>
              <span className="breadcrumb-separator">›</span>
              <Link to={`/modules/${id}`} className="breadcrumb-link">
                Barangay First 1000 Days Facilitator's Guide eTraining
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Activity</span>
            </div>

            <div className="activity-title-section">
              <div className="activity-badge">
                <span className="badge-icon">✏️</span>
                <span>Practical Activity</span>
              </div>
              <h1>{currentActivity.title}</h1>
              <p>Apply what you've learned by completing this hands-on activity</p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="activity-content-wrapper">
          {/* Instructions Card */}
          <div className="activity-instructions-card">
            <div className="instructions-header">
              <span className="instructions-icon">📋</span>
              <div>
                <h2>What You Need to Do</h2>
                <p>Follow these instructions carefully</p>
              </div>
            </div>

            <p className="instructions-text">{currentActivity.instructions}</p>

            <div className="instructions-specs">
              <div className="spec-item">
                <strong>Accepted Formats:</strong>
                <p>{currentActivity.allowedFormats}</p>
              </div>
              <div className="spec-item">
                <strong>File Size Limit:</strong>
                <p>10MB</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {!isSubmitted ? (
            <div className="activity-upload-card">
              <h3>Submit Your Work</h3>
              <p>Upload your completed activity file below</p>

              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.mp4,.doc,.docx"
                onChange={handleFileChange}
                className="file-input-hidden"
              />

              <label htmlFor="file-upload" className="file-upload-label">
                <span>📤</span>
                <p><strong>Click to upload</strong> or drag and drop</p>
              </label>

              {file && (
                <div className="selected-file-preview">
                  <div>
                    <p>{file.name}</p>
                    <p>{formatFileSize(file.size)}</p>
                  </div>
                  <button onClick={() => setFile(null)}>✕</button>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!file}>
                Submit Activity →
              </button>
            </div>
          ) : (
            <div className="activity-success-card">
              <div className="success-checkmark">✓</div>

              <h3>Activity Submitted!</h3>
              <p>Your submission has been recorded successfully.</p>

              {savedFile && (
                <div className="submitted-file-info">
                  <p>{savedFile.name}</p>
                  <p>{formatFileSize(savedFile.size)}</p>

                  <a href={savedFile.dataURL} download={savedFile.name}>
                    ⬇ Download File
                  </a>
                </div>
              )}

              <button onClick={() => navigate(`/modules/${id}`)}>
                Continue → 
              </button>
              <button onClick={handleResubmit}>Submit Different File</button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
