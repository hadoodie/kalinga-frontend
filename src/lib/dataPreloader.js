/**
 * Data Preloader - Prefetch critical data on app initialization
 *
 * This module preloads frequently accessed data into cache before the user
 * navigates to pages that need it, significantly reducing perceived load times.
 */

import hospitalService from "../services/hospitalService";
import blockadeService from "../services/blockadeService";
import chatService from "../services/chatService";
import { preloadIncidents } from "../services/incidents";

let preloadStarted = false;
let preloadPromise = null;

/**
 * Preload all critical data for authenticated users.
 * Safe to call multiple times - will only execute once.
 *
 * @param {Object} options
 * @param {string} options.userRole - User role (patient, responder, admin)
 * @param {boolean} options.force - Force preload even if already started
 */
export const preloadCriticalData = async (options = {}) => {
  const { userRole = null, force = false } = options;

  if (preloadStarted && !force) {
    return preloadPromise;
  }

  preloadStarted = true;

  preloadPromise = (async () => {
    const startTime = performance.now();

    try {
      // Always preload hospitals (used by all roles)
      hospitalService.preload();

      // Preload based on user role
      if (userRole === "responder" || userRole === "admin") {
        // Responders and admins need incidents and blockades
        preloadIncidents({ include_resolved: true });
        blockadeService.preload();
      }

      if (userRole === "patient" || userRole === "responder") {
        // Users who chat need conversations preloaded
        chatService.preloadConversations();
      }

      const elapsed = performance.now() - startTime;
      console.debug(
        `[Preloader] Initiated cache preload in ${elapsed.toFixed(1)}ms`
      );
    } catch (error) {
      console.warn("[Preloader] Some preloads failed:", error.message);
    }
  })();

  return preloadPromise;
};

/**
 * Preload data for a specific page/route before navigation
 *
 * @param {string} route - Target route
 */
export const preloadForRoute = (route) => {
  // Responder routes
  if (route.includes("/responder/map") || route.includes("/pathfinding")) {
    preloadIncidents({ include_resolved: false });
    blockadeService.preload();
    hospitalService.preload();
  }

  if (
    route.includes("/responder/messages") ||
    route.includes("/patient/messages")
  ) {
    chatService.preloadConversations();
  }

  if (route.includes("/response-mode")) {
    hospitalService.preload();
  }

  // Admin routes
  if (route.includes("/admin/dashboard")) {
    preloadIncidents({ include_resolved: true });
    hospitalService.preload();
  }
};

/**
 * Reset preloader state (for testing or logout)
 */
export const resetPreloader = () => {
  preloadStarted = false;
  preloadPromise = null;
};

export default {
  preloadCriticalData,
  preloadForRoute,
  resetPreloader,
};
