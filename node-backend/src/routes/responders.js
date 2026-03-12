import { Router } from 'express';
import respondersController from '../controllers/respondersController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// GET  /api/responders          — paginated list
router.get('/', optionalAuth, respondersController.getAll);

// GET  /api/responders/active   — only active/on-duty
router.get('/active', optionalAuth, respondersController.getActive);

// GET  /api/responders/stats    — on-duty / standby counts (for HealthRespondersCard)
router.get('/stats', optionalAuth, respondersController.getStats);

// GET  /api/responders/:id
router.get('/:id', optionalAuth, respondersController.getById);

// POST /api/responders          — admin only
router.post('/', authenticate, requireRole(['admin', 'doh_officer']), respondersController.create);

// PUT  /api/responders/:id/status — update duty status by user_id
router.put('/:id/status', authenticate, respondersController.updateStatus);

// PUT  /api/responders/:id      — admin or self
router.put('/:id', authenticate, respondersController.update);

export default router;
