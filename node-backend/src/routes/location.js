import { Router } from 'express';
import locationController from '../controllers/locationController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET  /api/location/areas     — list regions/areas (public dropdown data)
router.get('/areas', optionalAuth, locationController.getAreas);

// GET  /api/location/current   — current user location (user-specific)
router.get('/current', authenticate, locationController.getCurrentLocation);

// POST /api/location/current   — upsert current user location (user-specific)
router.post('/current', authenticate, locationController.updateLocation);

export default router;
