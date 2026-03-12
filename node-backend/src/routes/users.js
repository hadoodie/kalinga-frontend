import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/users/:user_id/devices — list devices with dynamic is_current_device
router.get('/:user_id/devices', authenticate, authController.getUserDevices);

export default router;
