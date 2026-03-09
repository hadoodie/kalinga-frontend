import { Router } from 'express';
import incidentsController from '../controllers/incidentsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// GET    /api/incidents            — paginated + filterable
router.get('/', optionalAuth, incidentsController.getAll);

// GET    /api/incidents/:id
router.get('/:id', optionalAuth, incidentsController.getById);

// POST   /api/incidents
router.post('/', authenticate, incidentsController.create);

// PUT    /api/incidents/:id
router.put('/:id', authenticate, incidentsController.update);

// DELETE /api/incidents/:id        — admin only
router.delete('/:id', authenticate, requireRole(['admin']), incidentsController.remove);

export default router;
