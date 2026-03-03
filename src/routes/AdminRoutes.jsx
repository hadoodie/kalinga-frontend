import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Lazy load admin pages
const AdminPortal = lazy(() =>
  import("../pages-admin/Admin").then((module) => ({
    default: module.AdminPortal,
  }))
);

const adminRoles = [ROLES.ADMIN];

export const AdminRoutes = () => (
  <>
    <Route
      path={ROUTES.ADMIN.ROOT}
      element={
        <ProtectedRoute allowedRoles={adminRoles}>
          <AdminPortal />
        </ProtectedRoute>
      }
    />
  </>
);
