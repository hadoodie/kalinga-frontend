import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, FileSignature, XCircle } from "lucide-react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import ToggleChipGroup from "../components/responder/pcr/ToggleChipGroup";
import StickyVitalsBar from "../components/responder/pcr/StickyVitalsBar";
import SignaturePadField from "../components/responder/pcr/SignaturePadField";
import TimeLogButton from "../components/responder/pcr/TimeLogButton";
import VitalsEntry from "../components/responder/pcr/VitalsEntry";
import PCRPrintView from "../components/responder/PCRPrintView";
import { useVitalsSync } from "../hooks/useVitalsSync";
import {
  clearPcrDraft,
  flushPcrQueue,
  generatePcrSoftCopy,
  getPcrDraft,
  getQueuedCount,
  savePcrDraft,
  submitPcr,
} from "../services/pcrService";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "../config/routes";

const NOI_MOI_OPTIONS = [
  "Cardiac Arrest",
  "Vehicular Crash",
  "Fall",
  "Stroke",
  "Respiratory Distress",
  "Seizure",
  "Burn Injury",
  "Trauma",
  "Allergic Reaction",
  "Others",
];

const PERSONNEL_OPTIONS = [
  "Fireman",
  "Police",
  "Traffic Enforcer",
  "Relative",
  "Bystander",
  "Others",
];

const PMH_OPTIONS = [
  "Allergies",
  "Hypertension",
  "Asthma",
  "Diabetic",
  "Surgery",
  "Stroke",
  "Seizure",
  "Cardiac",
  "Others",
];

const CONSCIOUSNESS_OPTIONS = [
  "Alert",
  "Verbal",
  "Pain",
  "Unresponsive",
  "Conscious",
  "Unconscious",
];

const defaultValues = {
  meta: {
    clientSubmissionId: crypto.randomUUID(),
    reportId: "",
  },
  dispatch: {
    caseNo: "",
    incidentId: "",
    mobileUnit: "",
    date: "",
    dispatchTime: "",
    arrivalTime: "",
    backToBaseTime: "",
  },
  noiMoi: [],
  noiMoiOther: "",
  patient: {
    patientUserId: "",
    name: "",
    age: "",
    gender: "",
    address: "",
    emergencyContact: "",
  },
  physiological: {
    levelOfConsciousness: "Alert",
    chiefComplaint: "",
    painLocation: "",
    pmh: [],
    pmhOther: "",
  },
  vitals: [
    {
      time: "",
      bp: "",
      temp: "",
      rr: "",
      spo2: "",
      pulse: "",
      gcs: { eyes: 4, verbal: 5, motor: 6 },
      source: "manual",
    },
  ],
  management: {
    treatmentNarrative: "",
    transportedTo: "",
    admittingDoctor: "",
    personnelOnScene: "",
    personnelOnSceneChips: [],
    personnelOnSceneOther: "",
  },
  waivers: {
    consentForTreatment: false,
    refusalOfTreatment: false,
    equipmentLiabilityAgreement: false,
    signerName: "",

    consentSignerName: "",
    consentPatientName: "",
    consentRelation: "",
    consentSignatureData: null,

    refusalSignatureData: null,
    refusalWitnesses: "",

    equipmentBorrowerName: "",
    equipmentSignatureData: null,
    equipmentContactNumber: "",
  },
  edgeMeta: {
    source: "manual",
    lastIngestedAt: null,
    sensor: null,
    nodeEventId: null,
  },
};

const SectionCard = React.memo(function SectionCard({
  title,
  active,
  onClick,
  complete,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-emerald-600 bg-emerald-50 text-emerald-900"
          : "border-slate-200 bg-white hover:border-emerald-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        {complete ? (
          <span className="text-xs font-semibold text-emerald-700">Done</span>
        ) : null}
      </div>
    </button>
  );
});

const fieldLockPath = (index, key) => `vitals.${index}.${key}`;

export default function PatientCareReport() {
  const [activeSection, setActiveSection] = useState(0);
  const [edgeStatus, setEdgeStatus] = useState("waiting");
  const [queueCount, setQueueCount] = useState(0);
  const [lockedFieldPath, setLockedFieldPath] = useState(null);
  const [latestPayload, setLatestPayload] = useState(null);
  const [showWaivers, setShowWaivers] = useState(false);
  const [activeWaiver, setActiveWaiver] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const { toast } = useToast();

  const savedDraft = useMemo(() => getPcrDraft(), []);
  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: savedDraft || defaultValues,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "vitals",
  });

  const formValues = watch();

  useEffect(() => {
    const timer = setTimeout(() => {
      savePcrDraft(formValues);
    }, 250);
    return () => clearTimeout(timer);
  }, [formValues]);

  useEffect(() => {
    const updateQueueCount = async () => {
      setQueueCount(await getQueuedCount());
    };

    const sync = async () => {
      const result = await flushPcrQueue();
      setQueueCount(result.remaining);
      if (result.sent > 0 || result.conflicted > 0) {
        toast({
          title: "PCR Sync Completed",
          description: `${result.sent} synced, ${result.conflicted} conflicted, ${result.remaining} pending.`,
        });
      }
    };

    const handleOffline = () => {
      toast({
        title: "Offline / Manual Mode",
        description: "Live sync paused. Entries are being queued locally.",
        variant: "destructive",
      });
    };

    updateQueueCount();
    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    if (edgeStatus === "connected") {
      toast({
        title: "Online / Live Sensor Mode",
        description: "Realtime sensor updates are active.",
      });
    }

    if (edgeStatus === "waiting") {
      toast({
        title: "Offline / Manual Mode",
        description: "Sensor feed disconnected. Continue with manual vitals entry.",
        variant: "destructive",
      });
    }
  }, [edgeStatus, toast]);

  const isVitalsFieldLocked = useCallback(
    (path) => lockedFieldPath === path,
    [lockedFieldPath]
  );

  useVitalsSync({
    getValues,
    setValue,
    caseNo: formValues.dispatch?.caseNo,
    patientUuid: null,
    isFieldLocked: isVitalsFieldLocked,
    onStatusChange: setEdgeStatus,
    onPayload: setLatestPayload,
  });

  const completion = useMemo(() => {
    const dispatchComplete = Boolean(
      formValues.dispatch?.caseNo && formValues.dispatch?.mobileUnit
    );
    const patientComplete = Boolean(
      formValues.patient?.name && formValues.patient?.age
    );
    const physioComplete = Boolean(formValues.physiological?.chiefComplaint);
    const pmhComplete = Boolean(formValues.physiological?.pmh?.length > 0);
    const vitalsComplete = Boolean(
      formValues.vitals?.length > 0 &&
        formValues.vitals.some(
          (row) =>
            row.time || row.bp || row.temp || row.rr || row.spo2 || row.pulse
        )
    );
    const transportComplete = Boolean(formValues.management?.transportedTo);

    return [
      dispatchComplete,
      formValues.noiMoi?.length > 0,
      patientComplete,
      physioComplete,
      pmhComplete,
      vitalsComplete,
      transportComplete,
      showWaivers,
    ];
  }, [formValues, showWaivers]);

  const getLatestResponseTimeStep = () => {
    const dispatch = formValues.dispatch || {};
    if (dispatch.backToBaseTime) return "dispatch.backToBaseTime";
    if (dispatch.arrivalTime) return "dispatch.arrivalTime";
    if (dispatch.dispatchTime) return "dispatch.dispatchTime";
    return null;
  };

  const latestResponseTimeStep = getLatestResponseTimeStep();

  const logNow = (path) => {
    setValue(path, new Date().toISOString(), { shouldDirty: true });
  };

  const clearTime = (path) => {
    setValue(path, "", { shouldDirty: true });
  };

  const handleWaiverSign = (waiverType, signatureData, metadata) => {
    const timestamp = new Date().toISOString();
    setValue(`waivers.${waiverType}.is_signed`, true, { shouldDirty: true });
    setValue(`waivers.${waiverType}.signature_base64`, signatureData, {
      shouldDirty: true,
    });
    setValue(`waivers.${waiverType}.signed_at`, timestamp, { shouldDirty: true });
    Object.keys(metadata).forEach((key) => {
      setValue(`waivers.${waiverType}.${key}`, metadata[key], { shouldDirty: true });
    });
    toast({
      title: `${waiverType} Signed`,
      description: `Waiver signed successfully at ${new Date(timestamp).toLocaleString()}.`,
    });
  };

  const handleWaiversToggle = (enabled) => {
    setShowWaivers(enabled);
    if (!enabled) {
      setActiveWaiver(null);
      ["consentForTreatment", "refusalOfTreatment", "equipmentLiabilityAgreement"].forEach(
        (waiverType) => {
          setValue(`waivers.${waiverType}`, {
            is_signed: false,
            signature_base64: null,
            signed_at: null,
            signer_name: "",
            patient_name: "",
            relation: "",
            witness_name: "",
            contact_number: "",
          }, { shouldDirty: true });
        }
      );
    }
  };

  const snapshotLiveVitals = () => {
    if (!latestPayload?.reading) {
      toast({
        title: "No Live Payload",
        description: "Waiting for sensor data from edge scanner.",
        variant: "destructive",
      });
      return;
    }

    const row = {
      time:
        latestPayload.reading.time || new Date().toISOString().slice(11, 16),
      bp: latestPayload.reading.bp ?? "",
      temp: latestPayload.reading.temperature ?? "",
      rr: latestPayload.reading.rr ?? "",
      spo2: latestPayload.reading.spo2 ?? "",
      pulse: latestPayload.reading.pulse ?? "",
      gcs: { eyes: 4, verbal: 5, motor: 6 },
      source: "edge",
    };

    append(row);
    toast({
      title: "Vitals Snapshot Added",
      description: "Live values were copied to the vitals grid.",
    });
  };

  const submit = async (values, isDraft) => {
    try {
      const result = await submitPcr(values, { isDraft });
      if (result.clientSubmissionId) {
        setValue("meta.clientSubmissionId", result.clientSubmissionId, {
          shouldDirty: false,
        });
      }

      if (result.queued) {
        setQueueCount(await getQueuedCount());
        toast({
          title: "Saved Offline",
          description:
            "No network. PCR was queued in IndexedDB and will auto-sync.",
          variant: "destructive",
        });
        return;
      }

      const reportId = result.data?.data?.id;
      if (reportId) {
        setValue("meta.reportId", reportId, { shouldDirty: false });
      }
      if (!isDraft && reportId) {
        await generatePcrSoftCopy(reportId);
      }

      // Remove draft from localStorage on successful submission
      localStorage.removeItem("pcr_draft");

      toast({
        title: isDraft ? "Draft Saved" : "PCR Submitted",
        description: isDraft
          ? "Draft persisted to server."
          : "PCR submitted and soft copy generated.",
      });
    } catch (error) {
      toast({
        title: "PCR Save Failed",
        description:
          error?.response?.data?.message || "Unable to save report. Please retry.",
        variant: "destructive",
      });
    }
  };

  const onFinalSubmit = handleSubmit((values) => submit(values, false));
  const onDraftSubmit = handleSubmit((values) => submit(values, true));

  const togglePrintPreview = () => {
    setShowPrintPreview((prev) => !prev);
  };

  const openPrintView = () => {
    const values = getValues();
    localStorage.setItem("pcr:print-preview:v1", JSON.stringify(values));
    const reportId = values.meta?.reportId;
    const url = reportId
      ? `${ROUTES.RESPONDER.PATIENT_CARE_REPORT_PRINT}?reportId=${reportId}`
      : ROUTES.RESPONDER.PATIENT_CARE_REPORT_PRINT;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resetFormState = () => {
    const shouldReset = window.confirm(
      "Clear all current PCR entries and start a new form?"
    );
    if (!shouldReset) return;

    clearPcrDraft();
    reset(defaultValues);
    setLatestPayload(null);
    setLockedFieldPath(null);
    handleWaiversToggle(false);

    // Remove draft from localStorage
    localStorage.removeItem("pcr_draft");

    toast({
      title: "Form Reset",
      description: "PCR form has been cleared and draft cache removed.",
    });
  };

  const simulateFormFill = () => {
    const dummyData = {
      dispatch: {
        caseNo: "CASE12345",
        incidentId: "INCIDENT67890",
        mobileUnit: "Unit 42",
        date: new Date().toISOString(),
        dispatchTime: new Date().toISOString(),
        arrivalTime: new Date(new Date().getTime() + 5 * 60000).toISOString(),
        backToBaseTime: new Date(new Date().getTime() + 30 * 60000).toISOString(),
      },
      patient: {
        patientUserId: "1",
        name: "John Doe",
        age: "35",
        gender: "Male",
        address: "123 Main St, Springfield",
        emergencyContact: "Jane Doe - 555-1234",
      },
      vitals: [
        {
          time: new Date().toISOString(),
          bp: "120/80",
          temp: 36.5,
          rr: 16,
          spo2: 98,
          pulse: 72,
          gcs: { eyes: 4, verbal: 5, motor: 6 },
          source: "manual",
        },
      ],
      waivers: {
        consentForTreatment: true,
        refusalOfTreatment: false,
        equipmentLiabilityAgreement: true,
        consentSignatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
        signed_at: new Date().toISOString(),
        signer_name: "John Doe",
      },
    };

    reset(dummyData);
    toast({
      title: "Form Simulated",
      description: "The form has been populated with dummy data.",
    });
  };

  const Section = ({ index, children }) =>
    activeSection === index ? (
      <div className="rounded-2xl bg-white p-4 shadow">{children}</div>
    ) : null;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-4 text-white">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Patient Care Report</h1>
            <p className="text-xs text-emerald-50 md:text-sm">
              Mobile-first rapid entry for high-stress response scenes
            </p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/20 px-3 py-1">
              Edge: {edgeStatus}
            </span>
            <button
              type="button"
              onClick={togglePrintPreview}
              className="rounded-full bg-white/20 px-3 py-1"
            >
              {showPrintPreview ? "Close Print Preview" : "Preview Print View"}
            </button>
          </div>
        </div>

        {showPrintPreview && (
          <div className="print-preview">
            <PCRPrintView data={getValues()} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
          <div className="space-y-2">
            {[
              "Dispatch Info",
              "NOI / MOI",
              "Patient Details",
              "Physiological Status",
              "Past Medical History",
              "Vitals and GCS",
              "Management and Transport",
              "Waivers",
            ].map((title, idx) => (
              <SectionCard
                key={title}
                title={title}
                active={activeSection === idx}
                complete={completion[idx]}
                onClick={() => setActiveSection(idx)}
              />
            ))}
          </div>

          <form className="space-y-4" onSubmit={onFinalSubmit}>
            <Section index={0}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border p-3"
                  placeholder="Case No"
                  {...register("dispatch.caseNo")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Incident ID (optional)"
                  {...register("dispatch.incidentId")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Mobile Unit"
                  {...register("dispatch.mobileUnit")}
                />
                <input
                  type="date"
                  className="rounded-lg border p-3"
                  {...register("dispatch.date")}
                />
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <TimeLogButton
                  label="Log Dispatch"
                  isoValue={formValues.dispatch?.dispatchTime}
                  onLogNow={() => logNow("dispatch.dispatchTime")}
                  onUndo={() => clearTime("dispatch.dispatchTime")}
                  isUndoable={latestResponseTimeStep === "dispatch.dispatchTime"}
                />
                {formValues.dispatch?.dispatchTime ? (
                  <TimeLogButton
                    label="Arrival on Scene"
                    isoValue={formValues.dispatch?.arrivalTime}
                    onLogNow={() => logNow("dispatch.arrivalTime")}
                    onUndo={() => clearTime("dispatch.arrivalTime")}
                    isUndoable={latestResponseTimeStep === "dispatch.arrivalTime"}
                  />
                ) : null}
                {formValues.dispatch?.arrivalTime ? (
                  <TimeLogButton
                    label="Back to Base"
                    isoValue={formValues.dispatch?.backToBaseTime}
                    onLogNow={() => logNow("dispatch.backToBaseTime")}
                    onUndo={() => clearTime("dispatch.backToBaseTime")}
                    isUndoable={latestResponseTimeStep === "dispatch.backToBaseTime"}
                  />
                ) : null}
              </div>
            </Section>

            <Section index={1}>
              <ToggleChipGroup
                label="Nature of Illness / Mechanism of Injury"
                options={NOI_MOI_OPTIONS}
                value={formValues.noiMoi}
                onChange={(next) =>
                  setValue("noiMoi", next, { shouldDirty: true })
                }
                otherInputValue={formValues.noiMoiOther}
                onOtherInputChange={(value) =>
                  setValue("noiMoiOther", value, { shouldDirty: true })
                }
                otherPlaceholder="Describe the other mechanism or illness"
                multiple
              />
            </Section>

            <Section index={2}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border p-3"
                  placeholder="Patient User ID (optional)"
                  {...register("patient.patientUserId")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Patient Name"
                  {...register("patient.name")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Age"
                  {...register("patient.age")}
                />
                <select
                  className="rounded-lg border p-3"
                  {...register("patient.gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  className="rounded-lg border p-3"
                  placeholder="Emergency Contact"
                  {...register("patient.emergencyContact")}
                />
                <input
                  className="rounded-lg border p-3 md:col-span-2"
                  placeholder="Address"
                  {...register("patient.address")}
                />
              </div>
            </Section>

            <Section index={3}>
              <div className="space-y-3">
                <ToggleChipGroup
                  label="Level of Consciousness"
                  options={CONSCIOUSNESS_OPTIONS}
                  value={formValues.physiological?.levelOfConsciousness}
                  onChange={(value) =>
                    setValue("physiological.levelOfConsciousness", value, {
                      shouldDirty: true,
                    })
                  }
                />

                <input
                  className="w-full rounded-lg border p-3"
                  placeholder="Chief Complaint"
                  {...register("physiological.chiefComplaint")}
                />
                <input
                  className="w-full rounded-lg border p-3"
                  placeholder="Location of Pain"
                  {...register("physiological.painLocation")}
                />
              </div>
            </Section>

            <Section index={4}>
              <ToggleChipGroup
                label="Past Medical History"
                options={PMH_OPTIONS}
                value={formValues.physiological?.pmh}
                onChange={(next) =>
                  setValue("physiological.pmh", next, { shouldDirty: true })
                }
                otherInputValue={formValues.physiological?.pmhOther}
                onOtherInputChange={(value) =>
                  setValue("physiological.pmhOther", value, { shouldDirty: true })
                }
                otherPlaceholder="Enter additional medical history"
                multiple
              />
            </Section>

            <Section index={5}>
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <VitalsEntry
                    key={field.id}
                    index={idx}
                    value={formValues.vitals?.[idx]}
                    onChange={(next) =>
                      setValue(`vitals.${idx}`, next, { shouldDirty: true })
                    }
                    onRemove={fields.length > 1 ? () => remove(idx) : undefined}
                    onFieldFocus={(path) => setLockedFieldPath(path)}
                    onFieldBlur={() => setLockedFieldPath(null)}
                  />
                ))}

                <button
                  type="button"
                  className="mt-3 min-h-[48px] rounded-2xl border border-emerald-700 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  onClick={() =>
                    append({
                      time: "",
                      bp: "",
                      temp: "",
                      rr: "",
                      spo2: "",
                      pulse: "",
                      gcs: { eyes: 4, verbal: 5, motor: 6 },
                      source: "manual",
                    })
                  }
                >
                  Add Vitals Row
                </button>
              </div>
            </Section>

            <Section index={6}>
              <div className="grid gap-3">
                <textarea
                  className="min-h-24 rounded-lg border p-3"
                  placeholder="Treatment Narrative"
                  {...register("management.treatmentNarrative")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Transported To"
                  {...register("management.transportedTo")}
                />
                <input
                  className="rounded-lg border p-3"
                  placeholder="Admitting Doctor"
                  {...register("management.admittingDoctor")}
                />
                <ToggleChipGroup
                  label="Personnel on Scene"
                  options={PERSONNEL_OPTIONS}
                  value={formValues.management?.personnelOnSceneChips || []}
                  onChange={(next) =>
                    setValue("management.personnelOnSceneChips", next, {
                      shouldDirty: true,
                    })
                  }
                  otherInputValue={formValues.management?.personnelOnSceneOther}
                  onOtherInputChange={(value) =>
                    setValue("management.personnelOnSceneOther", value, {
                      shouldDirty: true,
                    })
                  }
                  otherPlaceholder="Describe other personnel"
                  multiple
                />
              </div>
            </Section>

            <Section index={7}>
              <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Require Patient / Equipment Waiver?
                    </p>
                    <p className="text-xs text-amber-700">
                      Turn on access to waiver actions and signature capture.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={showWaivers}
                      onChange={(event) => handleWaiversToggle(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Enable
                  </label>
                </div>

                {showWaivers ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      className="flex min-h-[84px] flex-col items-start justify-center gap-2 rounded-3xl border border-emerald-700 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm"
                      onClick={() => {
                        setShowWaivers(true);
                        setActiveWaiver("consent");
                        setValue("waivers.consentForTreatment", true, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <FileSignature size={24} className="text-emerald-700" />
                      <span>Consent for Treatment</span>
                    </button>

                    <button
                      type="button"
                      className="flex min-h-[84px] flex-col items-start justify-center gap-2 rounded-3xl border border-amber-700 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm"
                      onClick={() => {
                        setShowWaivers(true);
                        setActiveWaiver("refusal");
                        setValue("waivers.refusalOfTreatment", true, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <XCircle size={24} className="text-amber-700" />
                      <span>Refusal of Treatment</span>
                    </button>

                    <button
                      type="button"
                      className="flex min-h-[84px] flex-col items-start justify-center gap-2 rounded-3xl border border-slate-700 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm"
                      onClick={() => {
                        setShowWaivers(true);
                        setActiveWaiver("equipment");
                        setValue("waivers.equipmentLiabilityAgreement", true, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <ShieldCheck size={24} className="text-slate-700" />
                      <span>Equipment Liability</span>
                    </button>
                  </div>
                ) : null}

                {activeWaiver ? (
                  <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
                    <div className="mx-auto max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {activeWaiver === "consent" && "Consent for Treatment"}
                            {activeWaiver === "refusal" && "Refusal of Treatment"}
                            {activeWaiver === "equipment" && "Equipment Liability"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Enter waiver details and capture the required signature.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveWaiver(null)}
                          className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                        >
                          Close
                        </button>
                      </div>

                      {activeWaiver === "consent" ? (
                        <div className="space-y-4">
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Pangalan ng Pumipirma"
                            {...register("waivers.consentSignerName")}
                          />
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Pangalan ng Pasyente/Biktima"
                            {...register("waivers.consentPatientName")}
                          />
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Relasyon sa Pasyente"
                            {...register("waivers.consentRelation")}
                          />
                          <SignaturePadField
                            label="Lagda"
                            value={formValues.waivers?.consentSignatureData}
                            onChange={(value) =>
                              setValue("waivers.consentSignatureData", value, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      ) : null}

                      {activeWaiver === "refusal" ? (
                        <div className="space-y-4">
                          <p className="text-sm leading-relaxed text-slate-700">
                            Ako, na nasa wastong gulang at isip, ay tumatanggi sa
                            ano mang paraan ng pagbibigay ng lunas o pagdala sa
                            akin/pasyente sa ospital o pagamutan.
                          </p>
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Mga Saksi"
                            {...register("waivers.refusalWitnesses")}
                          />
                          <SignaturePadField
                            label="Lagda"
                            value={formValues.waivers?.refusalSignatureData}
                            onChange={(value) =>
                              setValue("waivers.refusalSignatureData", value, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      ) : null}

                      {activeWaiver === "equipment" ? (
                        <div className="space-y-4">
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Pangalan ng Nanghihiram"
                            {...register("waivers.equipmentBorrowerName")}
                          />
                          <input
                            className="w-full rounded-lg border p-3"
                            placeholder="Contact Number"
                            {...register("waivers.equipmentContactNumber")}
                          />
                          <SignaturePadField
                            label="Lagda"
                            value={formValues.waivers?.equipmentSignatureData}
                            onChange={(value) =>
                              setValue("waivers.equipmentSignatureData", value, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </Section>

            <StickyVitalsBar
              payload={latestPayload}
              onSnapshot={snapshotLiveVitals}
              disabled={!latestPayload?.reading}
            />

            <div className="sticky bottom-3 flex flex-wrap gap-2 rounded-xl border bg-white p-3 shadow">
              <button
                type="button"
                onClick={openPrintView}
                className="min-h-12 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-700"
              >
                Print View
              </button>
              <button
                type="button"
                onClick={resetFormState}
                className="min-h-12 rounded-lg border border-rose-600 px-4 py-2 font-semibold text-rose-700"
              >
                Reset Form
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onDraftSubmit}
                className="min-h-12 rounded-lg border border-emerald-700 px-4 py-2 font-semibold text-emerald-700"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"
              >
                Finalize PCR
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
