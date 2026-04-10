import { Router } from 'express';
import trainingController from '../controllers/trainingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/training/progress                      — all module progress
router.get('/progress', trainingController.getProgress);

// PUT /api/training/progress/:courseId            — update single module
router.put('/progress/:courseId', trainingController.updateProgress);

// GET /api/training/certifications                — earned certificates
router.get('/certifications', trainingController.getCertifications);

// POST /api/training/update — body-based update (convenience alias for PUT /progress/:courseId)
// Body: { course_id, status, score?, progress_percent? }
router.post('/update', trainingController.updateViaPost);

// GET /api/training/:userId — fetch training for a specific user (admin or self)
// Must be after all static paths to avoid capturing /progress, /certifications, etc.
router.get('/:userId', trainingController.getProgressByUserId);

export default router;
