import { Router } from 'express';
import searchController from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=term
router.get('/', optionalAuth, searchController.globalSearch);

export default router;
