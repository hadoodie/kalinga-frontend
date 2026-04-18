import { Router } from 'express';
import triageController from '../controllers/triageController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// GET  /api/triage               — triage cases by hospital
router.get('/', optionalAuth, triageController.getAll);

// GET  /api/triage/stats         — aggregate counts per level
router.get('/stats', optionalAuth, triageController.getStats);

// GET  /api/triage/patients      — patients currently in triage
router.get('/patients', optionalAuth, triageController.getPatients);

// POST /api/triage/patient       — admit new patient to triage
router.post('/patient', authenticate, requireRole(['admin', 'doh_officer', 'responder']), triageController.addPatient);

// PUT  /api/triage/patient/:id   — update triage status
router.put('/patient/:id', authenticate, requireRole(['admin', 'doh_officer', 'responder']), triageController.updatePatient);

// GET  /api/triage/:id           — triage summary for a specific hospital
router.get('/:id', optionalAuth, triageController.getById);

// POST /api/triage               — create triage case
router.post('/', authenticate, requireRole(['admin', 'doh_officer', 'responder']), triageController.createCase);

// PUT  /api/triage/:id           — update triage case
router.put('/:id', authenticate, requireRole(['admin', 'doh_officer', 'responder']), triageController.updateCase);

export default router;
