import { Router } from 'express';
import notificationsController from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications          — paginated list for current user
router.get('/', notificationsController.getNotifications);

// GET /api/notifications/unread   — unread count + list
router.get('/unread', notificationsController.getUnread);

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', notificationsController.markAsRead);

// POST /api/notifications         — create (admin/doh_officer only)
router.post('/', requireRole(['admin', 'doh_officer']), notificationsController.createNotification);

// DELETE /api/notifications/:id
router.delete('/:id', notificationsController.deleteNotification);

export default router;
