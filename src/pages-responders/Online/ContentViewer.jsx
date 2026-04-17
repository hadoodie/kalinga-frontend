import React from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/lessonDetails.css";
import { getCourse, markContentComplete } from "@/services/trainingService";
import { useAuth } from "@/context/AuthContext";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ContentViewer() {
  const { id, contentSlug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const contentItem = React.useMemo(() => {
    if (!course?.sections) return null;
    for (const section of course.sections) {
      const items = section.items || [];
      for (const item of items) {
        if (slugify(item.title) === contentSlug) return { ...item, sectionHeading: section.heading };
      }
    }
    return null;
  }, [course, contentSlug]);

  React.useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }
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

  React.useEffect(() => {
    if (!user?.id || !id || !contentSlug) return;
    markContentComplete(user.id, id, contentSlug).catch(() => {});
  }, [user?.id, id, contentSlug]);

  if (loading) {
    return (
      <Layout>
        <div className="lesson-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="lesson-center">
          <h2>Course not found</h2>
          <p>{error || "We could not load this course."}</p>
          <Link to="/responder/modules" className="btn btn-outline mt-4">
            Back to Modules
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  if (!contentItem) {
    return (
      <Layout>
        <div className="lesson-center">
          <h2>Content not found</h2>
          <p>This item may have been removed.</p>
          <Link to={`/responder/modules/${id}`} className="btn btn-outline mt-4">
            Back to Course
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  const { title, type, downloadURL, sectionHeading } = contentItem;
  const isVideo = type === "video";
  const isPdf = type === "pdf" || (downloadURL && downloadURL.toLowerCase().endsWith(".pdf"));

  return (
    <Layout>
      <div className="lesson-layout">
        <div className="lesson-page">
          <div className="lesson-breadcrumbs">
            <Link to="/responder/online-training">Home</Link>
            <span> / </span>
            <Link to="/responder/modules">Modules</Link>
            <span> / </span>
            <Link to={`/responder/modules/${id}`}>{course.title}</Link>
            <span> / </span>
            <span className="muted">{title}</span>
          </div>

          <div className="lesson-header">
            <h1 className="lesson-course-title">{course.title}</h1>
            <h3 className="lesson-activity-title">{title}</h3>
            {sectionHeading && (
              <p className="text-sm text-gray-500 mt-1">{sectionHeading}</p>
            )}
          </div>

          {!downloadURL ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <p>No file linked for this item yet.</p>
              <Link to={`/responder/modules/${id}`} className="btn btn-outline mt-2 inline-block">
                Back to Course
              </Link>
            </div>
          ) : isVideo ? (
            <div className="video-wrapper">
              <video
                src={downloadURL}
                className="video-player"
                controls
                controlsList="nodownload"
              />
            </div>
          ) : isPdf ? (
            <div className="pdf-wrapper" style={{ minHeight: "70vh" }}>
              <iframe
                title={title}
                src={downloadURL}
                className="w-full border rounded-lg"
                style={{ minHeight: "70vh" }}
              />
            </div>
          ) : (
            <div className="pdf-fallback">
              <a
                href={downloadURL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                Open in new tab
              </a>
            </div>
          )}

          <div className="completion-wrapper mt-6">
            <Link to={`/responder/modules/${id}`} className="btn btn-light">
              Back to Course
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
