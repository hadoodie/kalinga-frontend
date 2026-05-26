import React, { useEffect, useState } from "react";
import PCRPrintView from "../components/responder/PCRPrintView";
import api from "../services/api";

export default function PatientCareReportPrint() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("pcr:print-preview:v1");
    if (raw) {
      try {
        setData(JSON.parse(raw));
        return;
      } catch (error) {
        console.warn("Failed to parse PCR print preview data", error);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("reportId");
    if (!reportId) {
      return;
    }

    api
      .get(`/patient-care-reports/${reportId}`)
      .then((response) => {
        const report = response.data?.data;
        if (!report) {
          return;
        }

        setData({
          dispatch: {
            caseNo: report.case_no,
            incidentId: report.incident_id,
            mobileUnit: report.mobile_unit,
            date: report.dispatch_date,
            dispatchTime: report.response_times?.dispatch || null,
            arrivalTime: report.response_times?.arrival || null,
            backToBaseTime: report.response_times?.back_to_base || null,
          },
          noiMoi: report.noi_moi || [],
          patient: report.patient_details || {},
          physiological: report.physiological_status || {},
          management: report.management_transport || {},
          waivers: report.waivers || {},
          vitals: (report.vitals || []).map((vital) => ({
            time: vital.recorded_time,
            bp: vital.blood_pressure,
            temp: vital.temperature,
            rr: vital.respiratory_rate,
            spo2: vital.spo2,
            pulse: vital.pulse,
            source: vital.source,
            gcs: {
              eyes: vital.gcs_eyes,
              verbal: vital.gcs_verbal,
              motor: vital.gcs_motor,
            },
          })),
        });
      })
      .catch((error) => {
        console.error("Failed to load saved PCR print data", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-3 flex items-center gap-2 print:hidden">
        <button
          type="button"
          className="rounded border border-slate-800 px-3 py-2 text-sm"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
      <PCRPrintView data={data} />
    </div>
  );
}
