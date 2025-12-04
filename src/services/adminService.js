// src/services/adminService.js
import api from "./api";

/**
 * Admin Service - Backend API integration for admin panel
 * Provides endpoints for user management, incidents overview, resources, responders, patients, and logistics
 */
const adminService = {
  // =====================
  // USER MANAGEMENT
  // =====================

  /**
   * Get all users with optional filters
   * @param {Object} params - { role, verification_status, page, per_page }
   */
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get("/admin/users", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  /**
   * Activate a user account
   * @param {number} userId
   */
  activateUser: async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      console.error("Error activating user:", error);
      throw error;
    }
  },

  /**
   * Deactivate a user account
   * @param {number} userId
   */
  deactivateUser: async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  },

  /**
   * Register a new user (admin can create any role)
   * @param {Object} userData - { name, email, password, role, phone }
   */
  createUser: async (userData) => {
    try {
      const response = await api.post("/register", {
        ...userData,
        password_confirmation: userData.password,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Get user counts by role
   */
  getUserStats: async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { per_page: 1000 },
      });
      const users = response.data.data || [];

      const stats = {
        total: users.length,
        byRole: {
          admin: users.filter((u) => u.role === "admin").length,
          responder: users.filter((u) => u.role === "responder").length,
          patient: users.filter((u) => u.role === "patient").length,
          logistics: users.filter((u) => u.role === "logistics").length,
        },
        active: users.filter((u) => u.is_active).length,
        inactive: users.filter((u) => !u.is_active).length,
        pendingVerification: users.filter(
          (u) => u.verification_status === "pending"
        ).length,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  // =====================
  // INCIDENTS OVERVIEW
  // =====================

  /**
   * Get all incidents with optional status filter
   * @param {Object} params - { status, per_page, include_resolved, include_cancelled }
   */
  getIncidents: async (params = {}) => {
    try {
      const response = await api.get("/incidents", { params });
      // Response can be paginated or direct array
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching incidents:", error);
      throw error;
    }
  },

  /**
   * Get incident statistics
   */
  getIncidentStats: async () => {
    try {
      const response = await api.get("/incidents", {
        params: { include_resolved: true, include_cancelled: true },
      });
      const incidents = response.data?.data || response.data || [];

      const stats = {
        total: incidents.length,
        byStatus: {
          reported: incidents.filter((i) => i.status === "reported").length,
          acknowledged: incidents.filter((i) => i.status === "acknowledged")
            .length,
          en_route: incidents.filter((i) => i.status === "en_route").length,
          on_scene: incidents.filter((i) => i.status === "on_scene").length,
          resolved: incidents.filter((i) => i.status === "resolved").length,
          cancelled: incidents.filter((i) => i.status === "cancelled").length,
        },
        active: incidents.filter(
          (i) => !["resolved", "cancelled"].includes(i.status)
        ).length,
        todayCount: incidents.filter((i) => {
          const created = new Date(i.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching incident stats:", error);
      throw error;
    }
  },

  /**
   * Get a single incident with details
   * @param {number} incidentId
   */
  getIncident: async (incidentId) => {
    try {
      const response = await api.get(`/incidents/${incidentId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error fetching incident:", error);
      throw error;
    }
  },

  // =====================
  // RESOURCES OVERVIEW
  // =====================

  /**
   * Get all resources with optional filters
   * @param {Object} params - { location, category, status, search }
   */
  getResources: async (params = {}) => {
    try {
      const response = await api.get("/resources", {
        params: { ...params, all: true },
      });
      return response.data?.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  /**
   * Get low stock resources
   */
  getLowStockResources: async () => {
    try {
      const response = await api.get("/resources/low-stock");
      return response.data?.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching low stock resources:", error);
      throw error;
    }
  },

  /**
   * Get critical resources
   */
  getCriticalResources: async () => {
    try {
      const response = await api.get("/resources/critical");
      return response.data?.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching critical resources:", error);
      throw error;
    }
  },

  /**
   * Get expiring resources
   * @param {number} days - number of days to check for expiration
   */
  getExpiringResources: async (days = 30) => {
    // Suppress repeated warnings after first failure
    if (adminService._expiringEndpointFailed) {
      const fallback = [];
      fallback.__partial = true;
      return fallback;
    }

    try {
      const response = await api.get("/resources/expiring", {
        params: { days },
      });
      return response.data?.resources || response.data || [];
    } catch (error) {
      const status = error?.response?.status;
      // The backend endpoint is still stabilizing, so degrade gracefully on server failures
      if (status === 404 || status === 500) {
        if (!adminService._expiringEndpointFailed) {
          console.warn("Expiring resources endpoint unavailable (will suppress further warnings):", error?.message || error);
          adminService._expiringEndpointFailed = true;
        }
        const fallback = [];
        fallback.__partial = true;
        return fallback;
      }
      console.error("Error fetching expiring resources:", error);
      throw error;
    }
  },

  /**
   * Get resource statistics
   */
  getResourceStats: async () => {
    try {
      const [all, lowStock, critical, expiring] = await Promise.all([
        adminService.getResources(),
        adminService.getLowStockResources(),
        adminService.getCriticalResources(),
        adminService.getExpiringResources(30).catch((error) => {
          console.warn("Expiring resources unavailable, continuing without them", error);
          return [];
        }),
      ]);

      // Group by category
      const byCategory = {};
      all.forEach((r) => {
        const cat = r.category || "Other";
        if (!byCategory[cat]) byCategory[cat] = 0;
        byCategory[cat]++;
      });

      // Group by location
      const byLocation = {};
      all.forEach((r) => {
        const loc = r.location || "Unknown";
        if (!byLocation[loc]) byLocation[loc] = { count: 0, quantity: 0 };
        byLocation[loc].count++;
        byLocation[loc].quantity += r.quantity || 0;
      });

      return {
        total: all.length,
        totalQuantity: all.reduce((sum, r) => sum + (r.quantity || 0), 0),
        lowStock: lowStock.length,
        critical: critical.length,
        expiring: expiring.length,
        byCategory,
        byLocation,
      };
    } catch (error) {
      console.error("Error fetching resource stats:", error);
      throw error;
    }
  },

  /**
   * Get stock movements for audit trail
   * @param {Object} params - { resource_id, movement_type, start_date, end_date }
   */
  getStockMovements: async (params = {}) => {
    try {
      const response = await api.get("/resources/stock-movements", { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      throw error;
    }
  },

  // =====================
  // ALLOCATION / LOGISTICS
  // =====================

  /**
   * Get incoming allocation requests
   */
  getIncomingAllocations: async () => {
    try {
      const response = await api.get("/incoming-requests");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching incoming allocations:", error);
      throw error;
    }
  },

  /**
   * Get outgoing allocation requests
   */
  getOutgoingAllocations: async () => {
    try {
      const response = await api.get("/outgoing-requests");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching outgoing allocations:", error);
      throw error;
    }
  },

  /**
   * Get allocation history
   */
  getAllocationHistory: async () => {
    try {
      const response = await api.get("/allocation-history");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching allocation history:", error);
      throw error;
    }
  },

  /**
   * Get active supply tracking
   */
  getSupplyTracking: async () => {
    try {
      const response = await api.get("/supply-tracking");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching supply tracking:", error);
      throw error;
    }
  },

  /**
   * Get logistics statistics
   */
  getLogisticsStats: async () => {
    try {
      const [incoming, outgoing, history, tracking] = await Promise.all([
        adminService.getIncomingAllocations().catch(() => []),
        adminService.getOutgoingAllocations().catch(() => []),
        adminService.getAllocationHistory().catch(() => []),
        adminService.getSupplyTracking().catch(() => []),
      ]);

      return {
        pendingRequests: incoming.filter((r) => r.status === "Pending").length,
        inTransit: tracking.filter((t) =>
          ["Shipped", "On-the-Way"].includes(t.status)
        ).length,
        delivered: history.filter((h) => h.status === "Delivered").length,
        totalRequests: incoming.length + outgoing.length,
        incoming,
        outgoing,
        tracking,
      };
    } catch (error) {
      console.error("Error fetching logistics stats:", error);
      throw error;
    }
  },

  // =====================
  // HOSPITALS
  // =====================

  /**
   * Get all hospitals
   */
  getHospitals: async () => {
    try {
      const response = await api.get("/hospitals");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      throw error;
    }
  },

  // =====================
  // RESPONDER TRACKING
  // =====================

  /**
   * Get responders (users with role 'responder')
   */
  getResponders: async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "responder", per_page: 1000 },
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching responders:", error);
      throw error;
    }
  },

  /**
   * Get responder statistics with active assignments
   */
  getResponderStats: async () => {
    try {
      const [responders, incidents] = await Promise.all([
        adminService.getResponders(),
        adminService.getIncidents({ include_resolved: false }),
      ]);

      // Count assignments per responder
      const assignmentCounts = {};
      incidents.forEach((incident) => {
        const assignments = incident.assignments || [];
        assignments.forEach((a) => {
          const responderId = a?.responder_id || a?.responder?.id;
          if (!responderId) return;
          if (!["completed", "cancelled"].includes(a.status)) {
            assignmentCounts[responderId] =
              (assignmentCounts[responderId] || 0) + 1;
          }
        });
      });

      const activeResponders = responders.filter((r) => r.is_active);
      const availableResponders = activeResponders.filter(
        (r) => !assignmentCounts[r.id]
      );
      const busyResponders = activeResponders.filter(
        (r) => assignmentCounts[r.id]
      );

      return {
        total: responders.length,
        active: activeResponders.length,
        available: availableResponders.length,
        busy: busyResponders.length,
        responders: responders.map((r) => ({
          ...r,
          activeAssignments: assignmentCounts[r.id] || 0,
        })),
      };
    } catch (error) {
      console.error("Error fetching responder stats:", error);
      throw error;
    }
  },

  // =====================
  // PATIENT MANAGEMENT
  // =====================

  /**
   * Get patients (users with role 'patient')
   */
  getPatients: async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "patient", per_page: 1000 },
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching patients:", error);
      throw error;
    }
  },

  /**
   * Get patient statistics
   */
  getPatientStats: async () => {
    try {
      const [patients, incidents] = await Promise.all([
        adminService.getPatients(),
        adminService.getIncidents({ include_resolved: true }),
      ]);

      // Count incidents per patient
      const incidentCounts = {};
      incidents.forEach((incident) => {
        const userId = incident.user_id;
        if (userId) {
          incidentCounts[userId] = (incidentCounts[userId] || 0) + 1;
        }
      });

      // Find patients with active incidents
      const activeIncidentPatients = new Set();
      incidents
        .filter((i) => !["resolved", "cancelled"].includes(i.status))
        .forEach((i) => i.user_id && activeIncidentPatients.add(i.user_id));

      return {
        total: patients.length,
        verified: patients.filter((p) => p.verification_status === "verified")
          .length,
        pending: patients.filter((p) => p.verification_status === "pending")
          .length,
        active: patients.filter((p) => p.is_active).length,
        withActiveIncident: activeIncidentPatients.size,
        patients: patients.map((p) => ({
          ...p,
          incidentCount: incidentCounts[p.id] || 0,
          hasActiveIncident: activeIncidentPatients.has(p.id),
        })),
      };
    } catch (error) {
      console.error("Error fetching patient stats:", error);
      throw error;
    }
  },

  // =====================
  // NOTIFICATIONS
  // =====================

  /**
   * Get all notifications
   */
  getNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * Create a broadcast notification
   * @param {Object} data - { title, message, type, user_id? }
   */
  createNotification: async (data) => {
    try {
      const response = await api.post("/notifications", data);
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  // =====================
  // ROUTE LOGS (Historical Routes)
  // =====================

  /**
   * Get historical route logs from responders
   * @param {Object} params - { days, user_id, per_page }
   */
  getRouteLogs: async (params = {}) => {
    try {
      const response = await api.get("/route-logs", { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching route logs:", error);
      throw error;
    }
  },

  // =====================
  // DASHBOARD AGGREGATES
  // =====================

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const [userStats, incidentStats, resourceStats, responderStats] =
        await Promise.all([
          adminService.getUserStats().catch(() => null),
          adminService.getIncidentStats().catch(() => null),
          adminService.getResourceStats().catch(() => null),
          adminService.getResponderStats().catch(() => null),
        ]);

      return {
        users: userStats,
        incidents: incidentStats,
        resources: resourceStats,
        responders: responderStats,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },
};

export default adminService;
