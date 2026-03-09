import { Router } from 'express';
import systemController from '../controllers/systemController.js';

const router = Router();

// GET /api/system/status — public health-check endpoint
router.get('/status', systemController.getStatus);

export default router;
