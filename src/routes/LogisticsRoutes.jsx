//src/routes/LogisticsRoutes.jsx

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

const OperationalAssets = lazy(() => import("../components/logistics/registry/overview/MetricCards/OperationalAssets"));
const UnderRepairAssets = lazy(() => import("../components/logistics/registry/overview/MetricCards/UnderRepairAssets"));
const UnassignedAssets = lazy(() => import("../components/logistics/registry/overview/MetricCards/UnassignedAssets"));
const AssetDetailPage = lazy(() => import("../components/logistics/registry/overview/AssetDetailPage"));
const AddAssetPage = lazy(() => import("../components/logistics/registry/overview/AddAssetPage"));


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
      path={ROUTES.LOGISTICS.SETTINGS}
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <SettingsLogistics />
        </ProtectedRoute>
      }
    />
    
    {/* ASSET STATUS PAGES */}
    <Route
      path="/logistics/assets/operational"
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <OperationalAssets />
        </ProtectedRoute>
      }
    />
    <Route
      path="/logistics/assets/under-repair"
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <UnderRepairAssets />
        </ProtectedRoute>
      }
    />
    <Route
      path="/logistics/assets/unassigned"
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <unassignedAssets />
        </ProtectedRoute>
      }
    />

    {/* ASSET DETAIL PAGE */}
    <Route
      path="/logistics/assets/:assetId"
      element={
        <ProtectedRoute allowedRoles={logisticsRoles}>
          <AssetDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
  path="/logistics/assets/add"
  element={
    <ProtectedRoute allowedRoles={logisticsRoles}>
      <AddAssetPage />
    </ProtectedRoute>
  }
/>
  </>
);