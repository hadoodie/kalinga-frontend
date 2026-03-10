import { Router } from 'express';
import logsController from '../controllers/logsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /api/logs — write a log entry for the current user
router.post('/', logsController.create);

// GET /api/logs/:userId — fetch logs for a user (self or admin)
router.get('/:userId', logsController.getByUser);

export default router;
