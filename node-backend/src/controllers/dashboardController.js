import dashboardService from '../services/dashboardService.js';
import response from '../utils/response.js';

/**
 * GET /api/dashboard/hospitals
 * Returns hospitals with computed occupancy_pct and priority tag.
 */
const getDashboardHospitals = async (req, res, next) => {
  try {
    const data = await dashboardService.getHospitalsWithOccupancy();
    return response.success(res, data);
  } catch (err) { next(err); }
};

/**
 * GET /api/dashboard/incidents/realtime
 * Returns active (non-resolved) incidents for real-time tracking.
 */
const getRealtimeIncidents = async (req, res, next) => {
  try {
    const data = await dashboardService.getRealtimeIncidents();
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { getDashboardHospitals, getRealtimeIncidents };
