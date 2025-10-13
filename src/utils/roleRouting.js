/**
 * Role-based routing utility
 * Provides consistent navigation logic based on user roles across the application
 */

/**
 * Get the default dashboard route for a given user role
 * @param {string} role - User role (admin, logistics, responder, patient, resident)
 * @param {object} user - Full user object (optional, for additional checks)
 * @returns {string} The route path to navigate to
 */
export const getDefaultRouteForRole = (role, user = null) => {
  switch (role) {
    case "admin":
      return "/admin";
    
    case "logistics":
      return "/logistic-dashboard";
    
    case "responder":
      return "/responder";
    
    case "patient":
    case "resident":
      // For patients/residents, check if they need ID verification
      if (user) {
        const needsVerification = 
          user.verification_status === "pending" || 
          user.verification_status === "unverified" ||
          !user.id_image_path;
        
        if (needsVerification) {
          return "/verify-id";
        }
      }
      return "/dashboard";
    
    default:
      return "/dashboard";
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
  
  // Only patients and residents need verification
  if (user.role !== "patient" && user.role !== "resident") {
    return false;
  }
  
  return (
    user.verification_status === "pending" ||
    user.verification_status === "unverified" ||
    !user.id_image_path
  );
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
    case "resident":
      if (needsVerification(user)) {
        return "Please verify your ID to continue.";
      }
      return "Redirecting to your dashboard...";
    
    default:
      return "Redirecting...";
  }
};
