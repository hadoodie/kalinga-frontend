import React, { useEffect, useState } from "react";
import Layout from "../../layouts/Layout";
import Footer from "../../components/responder/Footer";
import "../../styles/personnel-style.css";
import {
  FaDownload,
  FaPlus,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { getCertifications, getCourse } from "@/services/trainingService";
import { generateCertificatePdf, uploadCertificateToStorage } from "@/services/certificateService";
import { useAuth } from "@/context/AuthContext";

const Certifications = () => {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCertifications(user.id)
      .then((list) => {
        if (!cancelled) setCertifications(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load certifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const [downloadingId, setDownloadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshList = () => {
    if (!user?.id) return;
    setRefreshing(true);
    getCertifications(user.id)
      .then(setCertifications)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setRefreshing(false));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (timestamp.seconds != null) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return "-";
  };

  const handleDownload = async (courseTitle, courseId, certifiedAt) => {
    const dateStr = formatDate(certifiedAt);
    const recipientName = user?.name || "Participant";
    setDownloadingId(courseId);
    try {
      const course = await getCourse(courseId);
      const signatories = Array.isArray(course?.signatories) ? course.signatories : [];
      const pdfBlob = await generateCertificatePdf({
        recipientName,
        courseTitle,
        dateStr,
        signatories,
      });
      await uploadCertificateToStorage(user.id, courseId, pdfBlob);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${(courseId || "course").replace(/\s/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Certificate generation failed", e);
      setError(e.message || "Failed to generate certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Layout>
      <div className="content">
        <h1 className="page-title">Certifications</h1>

        <div className="section">
          <h3>Completed Courses (Certificates)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Courses where you passed all assessments (pre-test, quiz, final) at the passing score set by the admin.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-gray-600">
              <FaSpinner className="h-5 w-5 animate-spin" />
              <span>Loading certifications...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : certifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-600">
              <FaCheckCircle className="mx-auto mb-2 h-10 w-10 text-gray-400" />
              <p>No certificates yet.</p>
              <p className="text-sm mt-1">
                Complete a course and pass all its assessments (pre-test, quiz, final) at the required score to earn a certificate.
              </p>
              <button
                type="button"
                onClick={refreshList}
                disabled={refreshing}
                className="mt-3 px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-70"
              >
                {refreshing ? <><FaSpinner className="animate-spin inline mr-2" /> Refreshing…</> : "Refresh list"}
              </button>
            </div>
          ) : (
            <table className="cert-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Course</th>
                  <th style={{ width: "25%" }}>Date Completed</th>
                  <th style={{ width: "25%" }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map((cert) => (
                  <tr key={cert.courseId}>
                    <td>{cert.courseTitle}</td>
                    <td>{formatDate(cert.certifiedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-download"
                        disabled={downloadingId === cert.courseId}
                        onClick={() =>
                          handleDownload(
                            cert.courseTitle,
                            cert.courseId,
                            cert.certifiedAt
                          )
                        }
                      >
                        {downloadingId === cert.courseId ? (
                          <><FaSpinner className="animate-spin inline mr-1" /> Generating…
                          </>
                        ) : (
                          <><FaDownload /> Download PDF</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
