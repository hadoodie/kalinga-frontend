import { Router } from 'express';
import profileController from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
import activityLogger from '../middleware/activityLogger.js';
import multer from 'multer';

const router = Router();

// Restrict avatar uploads to image MIME types only (prevents script/executable uploads)
const avatarFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(Object.assign(new Error('Only image files are allowed'), { statusCode: 400 }), false);
};
const upload = multer({
  dest: 'uploads/avatars/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: avatarFilter,
});

router.use(authenticate);

// GET  /api/profile
router.get('/', activityLogger('profile_view', 'profile'), profileController.getProfile);

// PUT  /api/profile
router.put('/', activityLogger('profile_update', 'profile'), profileController.updateProfile);

// POST /api/profile/avatar      — multipart file upload
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

// PUT  /api/profile/password
router.put('/password', profileController.changePassword);

export default router;
