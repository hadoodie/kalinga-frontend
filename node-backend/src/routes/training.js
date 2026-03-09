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

export default router;
