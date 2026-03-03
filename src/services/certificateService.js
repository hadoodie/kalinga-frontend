import html2pdf from "html2pdf.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const CERT_GENERATED_PATH = "certificates/generated";

/**
 * Fetch resource and return as data URL (for reliable rendering in html2canvas).
 */
async function toDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) return url;
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch HTML template and CSS, return combined HTML string with embedded assets.
 * @param {string} baseUrl - e.g. window.location.origin + '/certs/'
 */
async function loadTemplateHtml(baseUrl) {
  const [htmlRes, cssRes] = await Promise.all([
    fetch(`${baseUrl}cert-template.html`),
    fetch(`${baseUrl}cert-style.css`),
  ]);
  if (!htmlRes.ok || !cssRes.ok) throw new Error("Certificate template not found");
  let html = await htmlRes.text();
  const css = await cssRes.text();
  html = html.replace(
    /<link rel="stylesheet" href="cert-style\.css">/,
    `<style>${css}</style>`
  );
  const imgSrcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  const dataUrls = await Promise.all(
    imgSrcs.map(async (src) => {
      const full = src.startsWith("http") ? src : `${baseUrl}${src.replace(/^\//, "")}`;
      try {
        return await toDataUrl(full);
      } catch {
        return full;
      }
    })
  );
  imgSrcs.forEach((src, i) => {
    html = html.replace(`src="${src}"`, `src="${dataUrls[i]}"`);
  });
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;
  const styleMatch = html.match(/<style[^>]*>([\s\S]*)<\/style>/i);
  const styleContent = styleMatch ? styleMatch[1] : css;
  return `<style>${styleContent}</style>${bodyContent}`;
}

/**
 * Build signatory HTML items.
 * @param {Array<{ name: string, title: string }>} signatories
 */
function buildSignatoryItems(signatories) {
  if (!Array.isArray(signatories) || signatories.length === 0) {
    return '<div class="sig-item"><div class="sig-name"></div><div class="sig-title"></div></div>';
  }
  return signatories
    .map(
      (s) =>
        `<div class="sig-item">
          <div class="sig-name">${escapeHtml(s.name || "")}</div>
          <div class="sig-title">${escapeHtml(s.title || "")}</div>
        </div>`
    )
    .join("\n");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generate certificate PDF from HTML template.
 * @param {Object} params
 * @param {string} params.recipientName - Responder name
 * @param {string} params.courseTitle - Course/training title
 * @param {string} params.dateStr - Date string (e.g. "Feb 1, 2026")
 * @param {Array<{ name: string, title: string }>} params.signatories - From admin
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateCertificatePdf({ recipientName, courseTitle, dateStr, signatories = [] }) {
  const baseUrl = `${window.location.origin}/certs/`;
  let html = await loadTemplateHtml(baseUrl);

  html = html.replace(/\$DATE/g, escapeHtml(dateStr || ""));
  html = html.replace(/\$NAME/g, escapeHtml(recipientName || ""));
  html = html.replace(/\$COURSE_TITLE/g, escapeHtml(courseTitle || ""));
  html = html.replace(/\$SIGNATORY_ITEMS/g, buildSignatoryItems(signatories));

  const container = document.createElement("div");
  container.innerHTML = html;
  Object.assign(container.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: "1200px",
    minHeight: "600px",
    background: "white",
    pointerEvents: "none",
    overflow: "visible",
  });
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;width:1200px;height:600px;overflow:visible;z-index:-1;";
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    const certEl = container.querySelector(".cert-container");
    if (!certEl) throw new Error("Certificate template structure invalid");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const images = container.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = resolve;
            img.onerror = resolve;
          })
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    const opt = {
      margin: 0,
      filename: "certificate.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: 1200,
        height: 600,
      },
      jsPDF: { unit: "pt", format: [1000, 500], orientation: "landscape" },
    };
    const blob = await html2pdf().set(opt).from(certEl).outputPdf("blob");
    return blob;
  } finally {
    wrapper.parentNode?.removeChild(wrapper);
  }
}

/**
 * Upload certificate PDF to Firebase Storage and return download URL.
 * @param {string} userId
 * @param {string} courseId
 * @param {Blob} pdfBlob
 * @returns {Promise<string>} Download URL
 */
export async function uploadCertificateToStorage(userId, courseId, pdfBlob) {
  const fileName = `${String(userId)}_${String(courseId)}.pdf`;
  const storagePath = `${CERT_GENERATED_PATH}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, pdfBlob, { contentType: "application/pdf" });
  return getDownloadURL(storageRef);
}
