import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  FileText,
  HeartPulse,
  Hospital,
  Map,
  MapPin,
  Package,
  Radio,
} from "lucide-react";
import { ResponderLayout } from "@/components/responder/ResponderLayout";
import { IncidentAssignments } from "@/components/responder/sections/IncidentAssignments";
import { IncidentMap } from "@/components/responder/sections/IncidentMap";
import { ResponderStatus } from "@/components/responder/sections/ResponderStatus";
import { PatientInformation } from "@/components/responder/sections/PatientInformation";
import { CommunicationTools } from "@/components/responder/sections/CommunicationTools";
import { ResourceChecklist } from "@/components/responder/sections/ResourceChecklist";
import { SafetyTracking } from "@/components/responder/sections/SafetyTracking";
import { ResponderReporting } from "@/components/responder/sections/ResponderReporting";
import { HospitalMap } from "@/components/responder/sections/HospitalMap";

const responderSections = [
  {
    id: "assignments",
    title: "Incident Assignments",
    description: "Dispatch queue, ETA, and team commitments for this shift.",
    icon: ClipboardList,
    component: IncidentAssignments,
  },
  {
    id: "incident-map",
    title: "Incident Map",
    description: "Mapped view of live reports and committed responder teams.",
    icon: Map,
    component: IncidentMap,
  },
  {
    id: "status",
    title: "Responder Status",
    description:
      "Vitals, partner pairing, and fatigue resets across the roster.",
    icon: Activity,
    component: ResponderStatus,
  },
  {
    id: "hospital-map",
    title: "Hospitals & Treatment",
    description: "Receiving facilities, available beds, and hand-off contacts.",
    icon: Hospital,
    component: HospitalMap,
  },
  {
    id: "patients",
    title: "Patient Information",
    description: "Bedside updates and triage details synced with command.",
    icon: HeartPulse,
    component: PatientInformation,
  },
  {
    id: "comms",
    title: "Communication Tools",
    description: "Cross-team radio nets, signal boosts, and escalation log.",
    icon: Radio,
    component: CommunicationTools,
  },
  {
    id: "resources",
    title: "Resource Checklist",
    description: "Gear status, resupply cadence, and readiness checklists.",
    icon: Package,
    component: ResourceChecklist,
  },
  {
    id: "safety",
    title: "Safety & Tracking",
    description:
      "Geo-fence monitoring, hazard alerts, and team location pings.",
    icon: MapPin,
    component: SafetyTracking,
  },
  {
    id: "reporting",
    title: "Responder Reporting",
    description:
      "Shift wrap-ups and incident summaries routed back to command.",
    icon: FileText,
    component: ResponderReporting,
  },
];

export const ResponderPortal = () => {
  const [activeSection, setActiveSection] = useState(responderSections[0].id);
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("userRole");
    setHasAccess(role === "responder" || role === "admin");
  }, []);

  const handleGrantAccess = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userRole", "responder");
    setHasAccess(true);
  };

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("userRole");
    setHasAccess(false);
    setActiveSection(responderSections[0].id);
  };

  const ActiveComponent = useMemo(() => {
    const target =
      responderSections.find((section) => section.id === activeSection) ??
      responderSections[0];
    return target.component;
  }, [activeSection]);

  if (hasAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground/60">
            Checking responder credentials…
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="max-w-lg rounded-3xl border border-border/60 bg-card/80 p-10 text-left shadow-lg">
          <h1 className="text-2xl font-semibold text-foreground">
            Responder access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            The responder console is reserved for deployed field units. Sign in
            with a responder profile or request the operations desk to grant you
            temporary access for demo mode.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              Go to login
            </Link>
            <button
              onClick={handleGrantAccess}
              className="inline-flex items-center justify-center rounded-full border border-border/60 px-5 py-2 font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              Demo as responder
            </button>
            <span className="text-xs text-foreground/40">
              (Adds <code>userRole="responder"</code> to localStorage)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponderLayout
      sections={responderSections}
      activeSectionId={activeSection}
      onSectionChange={setActiveSection}
      onLogout={handleLogout}
    >
      <ActiveComponent />
    </ResponderLayout>
  );
};
