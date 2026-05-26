import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  FileCheck,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

import { useAuth } from "@/context/AuthContext";

// Lazy-loaded admin sections — each chunk is split out of the main bundle
const DashboardSection = lazy(() =>
  import("@/components/admin/sections/DashboardSection").then((m) => ({
    default: m.DashboardSection,
  })),
);
const UserRoleManagement = lazy(() =>
  import("@/components/admin/sections/UserRoleManagement").then((m) => ({
    default: m.UserRoleManagement,
  })),
);
const VerificationRequests = lazy(() =>
  import("@/components/admin/sections/VerificationRequests").then((m) => ({
    default: m.VerificationRequests,
  })),
);
const IncidentHeatMap = lazy(() =>
  import("@/components/admin/sections/IncidentHeatMap").then((m) => ({
    default: m.IncidentHeatMap,
  })),
);
const ResourceManagement = lazy(() =>
  import("@/components/admin/sections/ResourceManagement").then((m) => ({
    default: m.ResourceManagement,
  })),
);
const TrainingSection = lazy(() =>
  import("@/components/admin/sections/TrainingSection").then((m) => ({
    default: m.TrainingSection,
  })),
);
const BroadcastControl = lazy(() =>
  import("@/components/admin/sections/BroadcastControl").then((m) => ({
    default: m.BroadcastControl,
  })),
);
const LogisticsOverview = lazy(() =>
  import("@/components/admin/sections/LogisticsOverview").then((m) => ({
    default: m.LogisticsOverview,
  })),
);
const ResponderOverview = lazy(() =>
  import("@/components/admin/sections/ResponderOverview").then((m) => ({
    default: m.ResponderOverview,
  })),
);
const PatientOverview = lazy(() =>
  import("@/components/admin/sections/PatientOverview").then((m) => ({
    default: m.PatientOverview,
  })),
);
const LogisticsForecastSection = lazy(() =>
  import("@/components/admin/sections/LogisticsForecastSection").then((m) => ({
    default: m.LogisticsForecastSection,
  })),
);

// Section loading spinner
const SectionLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
  </div>
);

/** Badge config for sections that require a visual data-status indicator */
const API_STATUS_CONFIG = {
  live: null, // no badge needed — fully connected
  partial: {
    label: "Partial",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    tooltip: "Some data is live, some falls back to demo/static values",
  },
  demo: {
    label: "Demo",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    tooltip: "This section uses demo / static data",
  },
};

const adminSections = [
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "High-level operational picture and response posture overview.",
    icon: LayoutDashboard,
    component: DashboardSection,
    apiStatus: "live",
  },
  {
    id: "verifications",
    title: "Verification Requests",
    description: "Review and approve pending identity verifications.",
    icon: FileCheck,
    component: VerificationRequests,
  },
  {
    id: "users",
    title: "User & Role Management",
    description:
      "Provision operators, manage access tiers, and coordinate agency collaboration.",
    icon: Users,
    component: UserRoleManagement,
    apiStatus: "live",
  },
  {
    id: "responders",
    title: "Responder Overview",
    description:
      "Monitor responder availability, assignments, and deployment status across all teams.",
    icon: UserCheck,
    component: ResponderOverview,
    apiStatus: "live",
  },
  {
    id: "patients",
    title: "Patient Overview",
    description:
      "Track registered patients, active emergencies, and health metrics across the system.",
    icon: Heart,
    component: PatientOverview,
    apiStatus: "live",
  },
  {
    id: "incidents",
    title: "Incident Logs",
    description:
      "Heat map of active incidents with severity clustering and sensor health.",
    icon: Map,
    component: IncidentHeatMap,
    apiStatus: "live",
  },
  {
    id: "resources",
    title: "Resource Management",
    description:
      "Track logistics pipelines, staging capacity, and resupply cadence.",
    icon: Package,
    component: ResourceManagement,
    apiStatus: "live",
  },
  {
    id: "logistics",
    title: "Logistics Overview",
    description:
      "Monitor supply chain, allocation requests, and shipment tracking.",
    icon: Truck,
    component: LogisticsOverview,
    apiStatus: "live",
  },
  {
    id: "logistics-forecast",
    title: "AI Logistics Forecast",
    description:
      "AI-driven demand forecasting, stockout risk analysis, and executive narrative.",
    icon: TrendingUp,
    component: LogisticsForecastSection,
    apiStatus: "live",
  },
  {
    id: "training",
    title: "Training",
    description: "Partner-led capability building and workshop coordination.",
    icon: GraduationCap,
    component: TrainingSection,
    apiStatus: "live",
  },
  {
    id: "broadcast",
    title: "Broadcast Control",
    description: "City-wide advisories and cross-channel messaging workflows.",
    icon: Megaphone,
    component: BroadcastControl,
    optional: true,
    apiStatus: "live",
  },
];

export const AdminPortal = () => {
  const [activeSection, setActiveSection] = useState(adminSections[0].id);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      window.location.assign("/#hero");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even if logout API fails
      window.location.assign("/#hero");
    }
  };

  const ActiveComponent = useMemo(() => {
    const target =
      adminSections.find((section) => section.id === activeSection) ??
      adminSections[0];
    return target.component;
  }, [activeSection]);

  useEffect(() => {
    if (!location.state?.adminSection) return;
    const sectionId = location.state.adminSection;
    const target = adminSections.find((section) => section.id === sectionId);
    if (target) {
      setActiveSection(target.id);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

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
      apiStatusConfig={API_STATUS_CONFIG}
    >
      <Suspense fallback={<SectionLoader />}>
        <ActiveComponent />
      </Suspense>
    </AdminLayout>
  );
};
