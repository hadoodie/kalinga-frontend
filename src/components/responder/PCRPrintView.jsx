import React from "react";
import "../../styles/pcr-print.css";

export default function PCRPrintView({ data }) {
  const vitals = data?.vitals || [];

  return (
    <div className="pcr-print-root">
      <h1 className="pcr-title">MDRRMO Patient Care Report</h1>

      <section className="pcr-section">
        <h2>Dispatch Info</h2>
        <table className="pcr-grid">
          <tbody>
            <tr>
              <td>Case No: {data?.dispatch?.caseNo || "N/A"}</td>
              <td>Mobile Unit: {data?.dispatch?.mobileUnit || "N/A"}</td>
              <td>Date: {data?.dispatch?.date || "N/A"}</td>
            </tr>
            <tr>
              <td>Dispatch: {data?.dispatch?.dispatchTime || "N/A"}</td>
              <td>Arrival: {data?.dispatch?.arrivalTime || "N/A"}</td>
              <td>Back to Base: {data?.dispatch?.backToBaseTime || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="pcr-section">
        <h2>NOI / MOI</h2>
        <p>{(data?.noiMoi || []).join(", ") || "N/A"}</p>
      </section>

      <section className="pcr-section">
        <h2>Patient Details</h2>
        <table className="pcr-grid">
          <tbody>
            <tr>
              <td>Name: {data?.patient?.name || "N/A"}</td>
              <td>Age: {data?.patient?.age || "N/A"}</td>
              <td>Gender: {data?.patient?.gender || "N/A"}</td>
            </tr>
            <tr>
              <td colSpan={2}>Address: {data?.patient?.address || "N/A"}</td>
              <td>Emergency Contact: {data?.patient?.emergencyContact || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="pcr-section pcr-no-split">
        <h2>Vitals and GCS</h2>
        <table className="pcr-grid">
          <thead>
            <tr>
              <th>Time</th>
              <th>BP</th>
              <th>Temp</th>
              <th>RR</th>
              <th>SpO2</th>
              <th>Pulse</th>
              <th>GCS</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {vitals.length ? (
              vitals.map((row, idx) => (
                <tr key={`${row.time || "time"}-${idx}`}>
                  <td>{row.time || ""}</td>
                  <td>{row.bp || ""}</td>
                  <td>{row.temp || ""}</td>
                  <td>{row.rr || ""}</td>
                  <td>{row.spo2 || ""}</td>
                  <td>{row.pulse || ""}</td>
                  <td>
                    {row.gcs?.eyes || ""}/{row.gcs?.verbal || ""}/{row.gcs?.motor || ""}
                  </td>
                  <td>{row.source || "manual"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>No vitals entries.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="pcr-section">
        <h2>Management and Transport</h2>
        <table className="pcr-grid">
          <tbody>
            <tr>
              <td colSpan={3}>Treatment Narrative: {data?.management?.treatmentNarrative || "N/A"}</td>
            </tr>
            <tr>
              <td>Transported To: {data?.management?.transportedTo || "N/A"}</td>
              <td>Admitting Doctor: {data?.management?.admittingDoctor || "N/A"}</td>
              <td>Personnel on Scene: {data?.management?.personnelOnScene || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="pcr-section pcr-no-split">
        <h2>Waivers</h2>
        <table className="pcr-grid">
          <tbody>
            <tr>
              <td>Consent for Treatment: {data?.waivers?.consentForTreatment ? "YES" : "NO"}</td>
              <td>Refusal of Treatment: {data?.waivers?.refusalOfTreatment ? "YES" : "NO"}</td>
              <td>Equipment Liability: {data?.waivers?.equipmentLiabilityAgreement ? "YES" : "NO"}</td>
            </tr>
            <tr>
              <td colSpan={3} className="pcr-signature-line">Signature: {data?.waivers?.signerName || "________________________"}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
