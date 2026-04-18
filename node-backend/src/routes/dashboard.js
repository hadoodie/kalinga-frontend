import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import dashboardController from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/hospitals          — hospitals with dynamic occupancy calculation
router.get('/hospitals', optionalAuth, dashboardController.getDashboardHospitals);

// GET /api/dashboard/incidents/realtime — active (non-resolved) incidents for the live map/feed
router.get('/incidents/realtime', optionalAuth, dashboardController.getRealtimeIncidents);

export default router;
