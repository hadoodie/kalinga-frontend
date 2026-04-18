import { Router } from 'express';
import resourcesController from '../controllers/resourcesController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// GET    /api/resources           — paginated (supports ?category= &hospital_id=)
router.get('/', optionalAuth, resourcesController.getAll);

// GET    /api/resources/summary   — aggregated data for ResourcesCard pie chart
router.get('/summary', optionalAuth, resourcesController.getSummary);

// GET    /api/resources/:id
router.get('/:id', optionalAuth, resourcesController.getById);

// POST   /api/resources
router.post('/', authenticate, requireRole(['admin', 'doh_officer']), resourcesController.create);

// PUT    /api/resources/:id
router.put('/:id', authenticate, requireRole(['admin', 'doh_officer']), resourcesController.update);

// DELETE /api/resources/:id
router.delete('/:id', authenticate, requireRole(['admin']), resourcesController.remove);

export default router;
