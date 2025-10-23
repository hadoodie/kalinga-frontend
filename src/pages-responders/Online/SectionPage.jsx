// src/pages/Online/SectionPage.jsx
import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import courseContent from "../../data/courseContent"; // your existing data file
import { markViewed, getProgress } from "../../lib/progress";

export default function SectionPage({ sectionType }) {
  const { id, slug } = useParams();
  const course = courseContent[id];
  if (!course) return <Layout><div className="p-6 text-red-500">Course not found.</div><Footer/></Layout>;

  const list = (course.sections && course.sections[sectionType]) || [];
  const item = list.find(s => s.slug === slug);
  if (!item) return <Layout><div className="p-6 text-red-500">Section not found.</div><Footer/></Layout>;

  useEffect(() => {
    // mark as viewed when user opens the page (you can change to require clicking "Mark complete")
    markViewed(id, sectionType, slug, course.sections);
  }, [id, sectionType, slug, course.sections]);

  // find next element in same section
  const idx = list.findIndex(s => s.slug === slug);
  const next = list[idx + 1];

  // compute next URL if last in section
  const nextUrlIfLast = sectionType === "general"
    ? `/modules/${id}/helpful/${(course.sections.helpful && course.sections.helpful[0] && course.sections.helpful[0].slug) || ""}`
    : sectionType === "helpful"
      ? `/modules/${id}/training/${(course.sections.training && course.sections.training[0] && course.sections.training[0].slug) || ""}`
      : `/modules/${id}`;

  const progress = getProgress(id);

  return (
    <Layout>
      <div className="course-wrapper">
        <h1 className="course-title">{course.title}</h1>
        <p className="course-breadcrumb"><Link to={`/modules/${id}`}>Back to course</Link></p>

        <div className="course-card">
          <h2>{item.title}</h2>
          <div className="course-section-content" dangerouslySetInnerHTML={{ __html: item.content || "<p>No content yet.</p>" }} />
        </div>

        <div style={{display:'flex', justifyContent:'space-between', marginTop: 16}}>
          <Link to={`/modules/${id}`} className="btn btn-outline">Back</Link>

          {next ? (
            <Link to={`/modules/${id}/${sectionType}/${next.slug}`} className="btn btn-primary">Next</Link>
          ) : (
            // if last in section, go to next section start (but respect locks)
            <Link to={nextUrlIfLast} className="btn btn-primary">Go to next section</Link>
          )}
        </div>

      </div>
      <Footer />
    </Layout>
  );
}
