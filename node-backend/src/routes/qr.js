import { Router } from 'express';
import qrController from '../controllers/qrController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/qr/bind — generate or return active QR token for current user
router.post('/bind', authenticate, qrController.bind);

// POST /api/qr/scan — validate a scanned QR token (EDGE device call, X-Edge-Key required)
router.post('/scan', qrController.scan);

// GET /api/qr/user/:userId — get active QR for a specific user (self or admin)
router.get('/user/:userId', authenticate, qrController.getByUser);

// POST /api/qr/regenerate — revoke old tokens, issue fresh one
router.post('/regenerate', authenticate, qrController.regenerate);

// POST /api/qr/status — update QR status (active / inactive)
router.post('/status', authenticate, qrController.updateStatus);

export default router;
