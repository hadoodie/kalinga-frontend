import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Map,
  Megaphone,
  Package,
  Server,
  Shield,
  Truck,
  UserCheck,
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
import { LogisticsOverview } from "@/components/admin/sections/LogisticsOverview";
import { ResponderOverview } from "@/components/admin/sections/ResponderOverview";
import { PatientOverview } from "@/components/admin/sections/PatientOverview";
import { useAuth } from "@/context/AuthContext";

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
    id: "responders",
    title: "Responder Overview",
    description:
      "Monitor responder availability, assignments, and deployment status across all teams.",
    icon: UserCheck,
    component: ResponderOverview,
  },
  {
    id: "patients",
    title: "Patient Overview",
    description:
      "Track registered patients, active emergencies, and health metrics across the system.",
    icon: Heart,
    component: PatientOverview,
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
    id: "logistics",
    title: "Logistics Overview",
    description:
      "Monitor supply chain, allocation requests, and shipment tracking.",
    icon: Truck,
    component: LogisticsOverview,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Helper function to get user initials
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper function to format role for display
  const formatRole = (role) => {
    if (!role) return "Administrator";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even if logout API fails
      navigate("/login");
    }
  };

  const ActiveComponent = useMemo(() => {
    const target =
      adminSections.find((section) => section.id === activeSection) ??
      adminSections[0];
    return target.component;
  }, [activeSection]);

  // Show loading state while checking authentication
  if (!user) {
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

  // Check if user has admin role
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="max-w-lg rounded-3xl border border-border/60 bg-card/80 p-10 text-left shadow-lg">
          <h1 className="text-2xl font-semibold text-foreground">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            This console is reserved for authorized administrators of Kalinga
            Command. You are currently logged in as <strong>{user.name}</strong>{" "}
            with role <strong>{formatRole(user.role)}</strong>. Please contact
            the operations lead to elevate your access.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              Go to home
            </Link>
            <button
              onClick={() => handleLogout()}
              className="inline-flex items-center justify-center rounded-full border border-border/60 px-5 py-2 font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              Sign out
            </button>
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
      onLogout={handleLogout}
      personaInitials={getInitials(user.name)}
      personaName={user.name}
      personaRole={formatRole(user.role)}
      personaEmail={user.email}
    >
      <ActiveComponent />
    </AdminLayout>
  );
};
