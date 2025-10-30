// src/pages/Online/InfoPage.jsx
import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/infoPage.css";

export default function InfoPage() {
  const { id, topicSlug } = useParams();
  const navigate = useNavigate();
  const formattedTitle = topicSlug.replace(/-/g, " ");

  // Define all sections and their topics
  const sections = {
    generalInformation: [
      "welcome-message",
      "course-overview-objectives",
      "training-flow-requirements",
      "facilitators-guide-outline",
    ],
    helpfulMaterials: [
      "reference-materials",
      "nutrition-policy-documents",
      "community-tools-templates",
      "sample-session-plans",
    ],
  };

  const allTopics = [
    ...sections.generalInformation,
    ...sections.helpfulMaterials,
  ];
  const currentSection = sections.generalInformation.includes(topicSlug)
    ? "generalInformation"
    : "helpfulMaterials";

  const currentTopics = sections[currentSection];
  const currentIndex = currentTopics.indexOf(topicSlug);

  // Save progress and unlock Helpful Materials
  useEffect(() => {
    const key = `completed_${id}`;
    const viewed = JSON.parse(localStorage.getItem(key)) || [];

    if (!viewed.includes(topicSlug)) {
      viewed.push(topicSlug);
      localStorage.setItem(key, JSON.stringify(viewed));
    }

    const allGeneralViewed = sections.generalInformation.every((t) =>
      viewed.includes(t)
    );
    if (allGeneralViewed) {
      localStorage.setItem(`unlocked_helpful_${id}`, "true");
    }
  }, [id, topicSlug]);

  // Navigation logic
  const handleBack = () => navigate(-1);

  const handleNext = () => {
    if (currentIndex < currentTopics.length - 1) {
      // Next topic in the same section
      const nextTopic = currentTopics[currentIndex + 1];
      navigate(`/modules/${id}/info/${nextTopic}`); // ✅ Fixed path
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Finished a section
      if (currentSection === "generalInformation") {
        localStorage.setItem(`unlocked_helpful_${id}`, "true");
        alert(
          "✅ You’ve completed the General Information section! Helpful Materials are now unlocked."
        );
        navigate(`/modules/${id}/info/reference-materials`); // ✅ Fixed path
      } else {
        alert("🎉 You’ve completed all topics in this section!");
      }
    }
  };

  // --- Content per topic ---
  let content;
  switch (topicSlug) {
    case "welcome-message":
      content = (
        <>
          <p>
            Welcome to the{" "}
            <strong>
              Barangay First 1000 Days Facilitator’s Guide eTraining
            </strong>
            ! This program equips community facilitators, health workers, and
            local leaders with the knowledge and skills needed to promote proper
            nutrition and care during the first 1000 days of life—from
            conception to a child’s second birthday.
          </p>
          <p>
            Through this training, you will strengthen your ability to guide
            families in implementing nutrition-sensitive and nutrition-specific
            programs in your barangay.
          </p>
        </>
      );
      break;

    case "course-overview-objectives":
      content = (
        <>
          <h4>Course Overview & Objectives</h4>
          <p>
            The course highlights the national strategies supporting the First
            1000 Days Program and empowers facilitators to lead effective local
            initiatives.
          </p>
          <ul>
            <li>
              Understand the key concepts and importance of the First 1000 Days.
            </li>
            <li>
              Identify the roles of barangay facilitators in program
              implementation.
            </li>
            <li>Learn facilitation techniques for community-based sessions.</li>
            <li>
              Access reference tools and templates to support facilitation.
            </li>
          </ul>
        </>
      );
      break;

    case "training-flow-requirements":
      content = (
        <>
          <h4>Training Flow & Requirements</h4>
          <p>
            The eTraining is divided into three main sections:{" "}
            <strong>General Information</strong>,
            <strong> Helpful Materials</strong>, and{" "}
            <strong>Training Modules</strong>. You must complete all topics in
            each section to unlock the next one.
          </p>
          <h5>Training Flow:</h5>
          <ol>
            <li>
              Start with <strong>General Information</strong> for course
              orientation.
            </li>
            <li>
              Proceed to <strong>Helpful Materials</strong> for reference tools
              and policies.
            </li>
            <li>
              Complete <strong>Training Modules</strong> with guided readings
              and assessments.
            </li>
          </ol>
          <h5>Requirements:</h5>
          <ul>
            <li>Stable internet connection and access to the platform.</li>
            <li>Completion of all required readings and quizzes.</li>
            <li>Submission of evaluation and feedback form.</li>
          </ul>
        </>
      );
      break;

    case "facilitators-guide-outline":
      content = (
        <>
          <h4>Facilitator’s Guide Outline</h4>
          <p>
            This guide provides structured content for conducting sessions and
            implementing activities under the First 1000 Days Program.
          </p>
          <ul>
            <li>Part I – Overview of the First 1000 Days Program</li>
            <li>Part II – Roles of Barangay Nutrition Committees</li>
            <li>Part III – Conducting Community Sessions</li>
            <li>Part IV – Monitoring and Evaluation</li>
            <li>Part V – Reference Tools and Support Materials</li>
          </ul>
        </>
      );
      break;

    // === HELPFUL MATERIALS ===
    case "reference-materials":
      content = (
        <>
          <h4>Reference Materials</h4>
          <p>
            This section includes reading materials, manuals, and resources that
            support facilitators in implementing nutrition-related activities in
            their communities.
          </p>
        </>
      );
      break;

    case "nutrition-policy-documents":
      content = (
        <>
          <h4>Nutrition Policy Documents</h4>
          <p>
            Access official policy guidelines, executive orders, and government
            memoranda relevant to nutrition and child development programs.
          </p>
        </>
      );
      break;

    case "community-tools-templates":
      content = (
        <>
          <h4>Community Tools & Templates</h4>
          <p>
            Download practical forms, templates, and community tracking tools to
            help monitor progress and facilitate barangay nutrition sessions.
          </p>
        </>
      );
      break;

    case "sample-session-plans":
      content = (
        <>
          <h4>Sample Session Plans</h4>
          <p>
            Explore ready-made session plans you can adapt for your barangay’s
            nutrition education activities.
          </p>
        </>
      );
      break;

    default:
      content = <p>Content not found for this topic.</p>;
  }

  return (
    <Layout>
      <div className="info-page">
        <div className="breadcrumbs">
          <Link to="/modules">Home</Link> /{" "}
          <Link to={`/modules/${id}`}>Module</Link> /{" "}
          <span>{formattedTitle}</span>
        </div>

        <h1 className="info-title">{formattedTitle}</h1>
        <div className="info-content">{content}</div>

        <div className="button-group">
          <button onClick={handleBack} className="btn btn-outline">
            Back to Course
          </button>
          <button onClick={handleNext} className="btn btn-primary short">
            Next
          </button>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
