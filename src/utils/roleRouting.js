/**
 * Role-based routing utility
 * Provides consistent navigation logic based on user roles across the application
 */

/**
 * Get the default dashboard route for a given user role
 * @param {string} role - User role (admin, logistics, responder, patient)
 * @param {object} user - Full user object (optional, for additional checks)
 * @returns {string} The route path to navigate to
 */
export const getDefaultRouteForRole = (role, user = null) => {
  switch (role) {
    case "admin":
      return "/admin";

    case "logistics":
      return "/logistics/dashboard";

    case "responder":
      return "/responder";

    case "patient":
      // For patients, check verification status
      if (user) {
        const status = user.verification_status;

        if (status === "verified") {
          // Verified users go to patient dashboard
          return "/patient/dashboard";
        } else if (status === "pending") {
          // Pending users see waiting screen
          return "/verification-pending";
        } else if (status === "rejected") {
          // Rejected users need to resubmit
          return "/verify-id";
        } else {
          // No verification submitted yet (null, undefined, or any other value)
          return "/verify-id";
        }
      }
      return "/verify-id";

    default:
      return "/patient/dashboard";
  }
};

/**
 * Navigate to the appropriate route after authentication
 * @param {object} user - User object with role and other details
 * @param {function} navigate - React Router navigate function
 * @param {object} options - Additional options
 * @param {string} options.from - URL to return to (overrides role-based routing)
 * @param {number} options.delay - Delay in ms before navigation (default: 0)
 */
export const navigateToRoleBasedRoute = (user, navigate, options = {}) => {
  const { from = null, delay = 0 } = options;

  const doNavigation = () => {
    if (from) {
      // If user was trying to access a specific route, go there
      navigate(from, { replace: true });
    } else {
      // Otherwise, go to role-based default route
      const route = getDefaultRouteForRole(user.role, user);
      navigate(route);
    }
  };

  if (delay > 0) {
    setTimeout(doNavigation, delay);
  } else {
    doNavigation();
  }
};

/**
 * Check if a user needs to complete verification
 * @param {object} user - User object
 * @returns {boolean}
 */
export const needsVerification = (user) => {
  if (!user) return false;

  // Only patients need verification
  if (user.role !== "patient") {
    return false;
  }

  // User needs verification if they are NOT verified
  // Status can be: 'pending' (waiting approval), 'rejected' (need to resubmit), or null/undefined (never submitted)
  return user.verification_status !== "verified";
};

/**
 * Get a user-friendly description of what happens after authentication
 * @param {string} role - User role
 * @param {object} user - User object (optional)
 * @returns {string}
 */
export const getPostAuthDescription = (role, user = null) => {
  switch (role) {
    case "admin":
      return "Redirecting to admin panel...";

    case "logistics":
      return "Redirecting to logistics dashboard...";

    case "responder":
      return "Redirecting to responder dashboard...";

    case "patient":
      if (needsVerification(user)) {
        return "Please verify your ID to continue.";
      }
      return "Redirecting to your dashboard...";

    default:
      return "Redirecting...";
  }
};
