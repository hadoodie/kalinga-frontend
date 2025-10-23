import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Lazy load account creation flow pages
const VerifyIDs = lazy(() => import("../pages-account/VerifyID"));
const UploadIDs = lazy(() => import("../pages-account/UploadID"));
const FillInformation = lazy(() => import("../pages-account/FillInformation"));
const VerificationPending = lazy(() =>
  import("../pages-resident/99_VerificationPending")
);

export const AccountRoutes = () => (
  <>
    <Route
      path={ROUTES.VERIFY_ID}
      element={
        <ProtectedRoute>
          <VerifyIDs />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.UPLOAD_ID}
      element={
        <ProtectedRoute>
          <UploadIDs />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.FILL_INFO}
      element={
        <ProtectedRoute>
          <FillInformation />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.VERIFICATION_PENDING}
      element={
        <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
          <VerificationPending />
        </ProtectedRoute>
      }
    />
  </>
);
