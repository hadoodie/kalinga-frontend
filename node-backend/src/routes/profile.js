import { Router } from 'express';
import profileController from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/avatars/', limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

// GET  /api/profile
router.get('/', profileController.getProfile);

// PUT  /api/profile
router.put('/', profileController.updateProfile);

// POST /api/profile/avatar      — multipart file upload
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

// PUT  /api/profile/password
router.put('/password', profileController.changePassword);

export default router;
