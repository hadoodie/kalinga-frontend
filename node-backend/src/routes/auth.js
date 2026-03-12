import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/record-device — called by frontend after successful login
router.post('/record-device', authenticate, authController.recordDevice);

export default router;
