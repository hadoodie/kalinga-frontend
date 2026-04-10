import { Router } from 'express';
import reportsController from '../controllers/reportsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// GET    /api/reports
router.get('/', optionalAuth, reportsController.getAll);

// GET    /api/reports/:id
router.get('/:id', optionalAuth, reportsController.getById);

// POST   /api/reports
router.post('/', authenticate, requireRole(['admin', 'doh_officer', 'responder']), reportsController.create);

// PUT    /api/reports/:id
router.put('/:id', authenticate, requireRole(['admin', 'doh_officer']), reportsController.update);

// DELETE /api/reports/:id
router.delete('/:id', authenticate, requireRole(['admin']), reportsController.remove);

export default router;
