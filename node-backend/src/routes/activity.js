import { Router } from 'express';
import activityController from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/activity    — paginated activity log for current user
router.get('/', activityController.getActivity);

export default router;
