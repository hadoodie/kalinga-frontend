// src/services/maintenanceService.js
// 100% ALIGNED WITH YOUR SCREENSHOT #7 → "Mark Maintenance" button
// Also used by MaintenanceCalendar.jsx, AssetDetailPage.jsx, etc.

import api from './api';

const maintenanceService = {
  // ==================================================================
  // 1. GET ALL MAINTENANCE DATA (Calendar + Dashboard)
  // ==================================================================

  /**
   * Get full maintenance breakdown
   * Used by: MaintenanceCalendar.jsx, AssetDetailPage.jsx, Dashboard KPI cards
   * Returns: { upcoming: [], overdue: [], completed: [], all: [] }
   */
  getMaintenanceData: async () => {
    const response = await api.get('/maintenance');
    return response.data;
  },

  /**
   * Same as above – kept for backward compatibility with existing code
   */
  getMaintenanceOverview: async () => {
    const response = await api.get('/maintenance');
    return response.data;
  },

  // ==================================================================
  // 2. SCHEDULE NEW MAINTENANCE (FROM ASSET ROW)
  // ==================================================================

  /**
   * Full manual scheduling
   * Used by: Maintenance modal (full form)
   */
  scheduleMaintenance: async (data) => {
    // data: { asset_id, scheduled_date, description, priority, technician?, cost? }
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  /**
   * QUICK ACTION – Used by "Mark Maintenance" button in AssetTable.jsx
   * One-click → schedules routine maintenance in +7 days
   */
  quickMarkForMaintenance: async (assetId) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const response = await api.post('/maintenance', {
      asset_id: assetId,
      scheduled_date: sevenDaysFromNow.toISOString().split('T')[0],
      description: 'Routine Preventive Maintenance',
      priority: 'medium',
    });

    return response.data;
  },

  // ==================================================================
  // 3. RESCHEDULE & COMPLETE
  // ==================================================================

  /**
   * Reschedule an existing maintenance
   * Used by: Drag-and-drop calendar or edit modal
   */
  rescheduleMaintenance: async (maintenanceId, newDate) => {
    const response = await api.post(`/maintenance/${maintenanceId}/reschedule`, {
      newDate: newDate // YYYY-MM-DD string
    });
    return response.data;
  },

  /**
   * Mark maintenance as completed
   * Used by: "Complete" button in maintenance row/card
   * Automatically sets asset.status = 'available'
   */
  completeMaintenance: async (maintenanceId, notes = null) => {
    const response = await api.post(`/maintenance/${maintenanceId}/complete`, {
      notes
    });
    return response.data;
  },

  /**
   * Generic status update (future-proof)
   * Currently only supports 'completed' via dedicated endpoint
   */
  updateMaintenanceStatus: async (maintenanceId, status, notes = null) => {
    if (status === 'completed') {
      return await maintenanceService.completeMaintenance(maintenanceId, notes);
    }
    throw new Error(`Status "${status}" not implemented yet`);
  },
};

export default maintenanceService;