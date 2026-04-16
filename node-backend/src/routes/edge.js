import { Router } from 'express';
import edgeController from '../controllers/edgeController.js';

const router = Router();

// POST /api/edge/pcr-ingest - receives QR/vitals payload from edge scanner and broadcasts to PCR form clients.
router.post('/pcr-ingest', edgeController.ingestPcrPayload);

export default router;
