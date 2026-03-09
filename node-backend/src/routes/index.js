import { Router } from 'express';
import notificationsRouter from './notifications.js';
import searchRouter from './search.js';
import locationRouter from './location.js';
import respondersRouter from './responders.js';
import hospitalsRouter from './hospitals.js';
import reportsRouter from './reports.js';
import triageRouter from './triage.js';
import resourcesRouter from './resources.js';
import systemRouter from './system.js';
import incidentsRouter from './incidents.js';
import profileRouter from './profile.js';
import activityRouter from './activity.js';
import trainingRouter from './training.js';
import settingsRouter from './settings.js';
import accountRouter from './account.js';

const router = Router();

router.use('/notifications', notificationsRouter);
router.use('/search', searchRouter);
router.use('/location', locationRouter);
router.use('/responders', respondersRouter);
router.use('/hospitals', hospitalsRouter);
router.use('/reports', reportsRouter);
router.use('/triage', triageRouter);
router.use('/resources', resourcesRouter);
router.use('/system', systemRouter);
router.use('/incidents', incidentsRouter);
router.use('/profile', profileRouter);
router.use('/activity', activityRouter);
router.use('/training', trainingRouter);
router.use('/settings', settingsRouter);
router.use('/account', accountRouter);

export default router;
