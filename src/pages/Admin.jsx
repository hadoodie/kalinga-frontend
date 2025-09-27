import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Map,
  Megaphone,
  Package,
  Server,
  Shield,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardSection } from "@/components/admin/sections/DashboardSection";
import { UserRoleManagement } from "@/components/admin/sections/UserRoleManagement";
import { IncidentHeatMap } from "@/components/admin/sections/IncidentHeatMap";
import { ResourceManagement } from "@/components/admin/sections/ResourceManagement";
import { TrainingSection } from "@/components/admin/sections/TrainingSection";
import { ConnectivityMonitoring } from "@/components/admin/sections/ConnectivityMonitoring";
import { MonitoringSecurity } from "@/components/admin/sections/MonitoringSecurity";
import { BroadcastControl } from "@/components/admin/sections/BroadcastControl";

const adminSections = [
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "High-level operational picture and response posture overview.",
    icon: LayoutDashboard,
    component: DashboardSection,
  },
  {
    id: "users",
    title: "User & Role Management",
    description:
      "Provision operators, manage access tiers, and coordinate agency collaboration.",
    icon: Users,
    component: UserRoleManagement,
  },
  {
    id: "incidents",
    title: "Incident Logs",
    description:
      "Heat map of active incidents with severity clustering and sensor health.",
    icon: Map,
    component: IncidentHeatMap,
  },
  {
    id: "resources",
    title: "Resource Management",
    description:
      "Track logistics pipelines, staging capacity, and resupply cadence.",
    icon: Package,
    component: ResourceManagement,
  },
  {
    id: "training",
    title: "Training",
    description: "Partner-led capability building and workshop coordination.",
    icon: GraduationCap,
    component: TrainingSection,
  },
  {
    id: "connectivity",
    title: "Connectivity Monitoring",
    description:
      "Network uptime, throughput, and connected population metrics.",
    icon: Server,
    component: ConnectivityMonitoring,
  },
  {
    id: "security",
    title: "Monitoring & Security",
    description:
      "Physical and cyber telemetry from the command center perimeter.",
    icon: Shield,
    component: MonitoringSecurity,
  },
  {
    id: "broadcast",
    title: "Broadcast Control",
    description: "City-wide advisories and cross-channel messaging workflows.",
    icon: Megaphone,
    component: BroadcastControl,
    optional: true,
  },
];

export const AdminPortal = () => {
  const [activeSection, setActiveSection] = useState(adminSections[0].id);
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("userRole");
    setHasAccess(role === "admin");
  }, []);

  const handleGrantAccess = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userRole", "admin");
    setHasAccess(true);
  };

  const ActiveComponent = useMemo(() => {
    const target =
      adminSections.find((section) => section.id === activeSection) ??
      adminSections[0];
    return target.component;
  }, [activeSection]);

  if (hasAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground/60">
            Validating admin session…
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
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            This console is reserved for authorized administrators of Kalinga
            Command. Please sign in with an admin account or contact the
            operations lead to elevate your access.
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
              Demo as admin
            </button>
            <span className="text-xs text-foreground/40">
              (Adds <code>userRole="admin"</code> to localStorage)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      sections={adminSections}
      activeSectionId={activeSection}
      onSectionChange={setActiveSection}
    >
      <ActiveComponent />
    </AdminLayout>
  );
};
