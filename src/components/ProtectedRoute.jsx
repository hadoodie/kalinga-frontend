import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { needsVerification } from "../utils/roleRouting";

export const ProtectedRoute = ({ children, allowedRoles = [], requireVerification = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-12 w-12 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      admin: "/admin",
      logistics: "/logistic-dashboard",
      responder: "/responder",
      patient: "/dashboard",
      resident: "/dashboard",
    };
    return <Navigate to={roleRedirects[user?.role] || "/dashboard"} replace />;
  }

  // Check if patient/resident needs verification (but allow access to verification pages)
  const verificationPages = ["/verify-id", "/upload-id", "/fill-info", "/verification-pending"];
  const isVerificationPage = verificationPages.includes(location.pathname);
  
  if (!isVerificationPage && needsVerification(user)) {
    // User needs verification and is trying to access a protected page
    console.log("User needs verification, redirecting to appropriate page");
    
    // Determine where to send them based on their verification status
    if (user.verification_status === "pending") {
      return <Navigate to="/verification-pending" replace />;
    } else if (user.verification_status === "rejected") {
      return <Navigate to="/verify-id" replace />;
    } else {
      return <Navigate to="/verify-id" replace />;
    }
  }

  return children;
};
