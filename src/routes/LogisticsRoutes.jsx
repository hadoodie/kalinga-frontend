import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Lazy load logistics pages
const DashboardLogistics = lazy(() =>
  import("../pages-logistics/Dashboard").then((module) => ({
    default: module.DashboardLogistics,
  }))
);
const ResourceManagement = lazy(() =>
  import("../pages-logistics/ResourceManagement").then((module) => ({
    default: module.ResourceManagement,
  }))
);
const AssetRegistry = lazy(() =>
  import("../pages-logistics/AssetRegistry").then((module) => ({
    default: module.AssetRegistry,
  }))
);
const SupplyTracking = lazy(() =>
  import("../pages-logistics/Supply").then((module) => ({
    default: module.SupplyTracking,
  }))
);
const RequestAllocation = lazy(() =>
  import("../pages-logistics/Request").then((module) => ({
    default: module.RequestAllocation,
  }))
);
const SettingsLogistics = lazy(() =>
  import("../pages-logistics/Settings").then((module) => ({
    default: module.SettingsLogistics,
  }))
);

const NotificationsLogistics = lazy(() =>
  import("../pages-logistics/Notifications").then((module) => ({
    default: module.NotificationsLogistics,
  }))
);

const LiveMapPage = lazy(() =>
  import("../pages-logistics/LiveMapPage").then((module) => ({
    default: module.LiveMapPage,
  }))
);

const ProfileLogistics = lazy(() =>
  import("../pages-logistics/Profile").then((module) => ({
    default: module.ProfileLogistics,
  }))
);

const logisticsRoles = [ROLES.LOGISTICS, ROLES.ADMIN];

export const LogisticsRoutes = () => (
  <>
    {/* Redirect root to dashboard */}
    <Route
      path={ROUTES.LOGISTICS.ROOT}
      element={<Navigate to={ROUTES.LOGISTICS.DASHBOARD} replace />}
    />

    <Route
      path={ROUTES.LOGISTICS.DASHBOARD}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <DashboardLogistics />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.RESOURCE_MANAGEMENT}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <ResourceManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.ASSET_REGISTRY}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <AssetRegistry />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.SUPPLY_TRACKING}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <SupplyTracking />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.REQUESTED_ALLOCATION}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <RequestAllocation />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.HOSPITAL_SAFETY_INDEX}
      element={
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
          <Navigate
            to={ROUTES.ADMIN.ROOT}
            replace
            state={{ adminSection: "hospital-safety" }}
          />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.SETTINGS}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <SettingsLogistics />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.NOTIFICATIONS}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <NotificationsLogistics />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.LIVE_MAP}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <LiveMapPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.LOGISTICS.PROFILE}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <ProfileLogistics />
        </ProtectedRoute>
      }
    />
  </>
);
