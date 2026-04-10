import { Router } from 'express';
import hospitalsController from '../controllers/hospitalsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/hospitals                         — list
router.get('/', optionalAuth, hospitalsController.getAll);

// GET /api/hospitals/patient-distribution    — data for HospitalPatientChart
router.get('/patient-distribution', optionalAuth, hospitalsController.getPatientDistribution);

// GET /api/hospitals/:id
router.get('/:id', optionalAuth, hospitalsController.getById);

// GET /api/hospitals/:id/patients            — patients in a specific hospital
router.get('/:id/patients', optionalAuth, hospitalsController.getHospitalPatients);

export default router;
