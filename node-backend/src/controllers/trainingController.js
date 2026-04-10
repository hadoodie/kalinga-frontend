import trainingService from '../services/trainingService.js';
import logsService from '../services/logsService.js';
import response from '../utils/response.js';

const getProgress = async (req, res, next) => {
  try {
    const data = await trainingService.getProgress(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const updateProgress = async (req, res, next) => {
  try {
    const data = await trainingService.updateProgress(req.dbUser.id, req.params.courseId, req.body);

    logsService.writeLog(req.dbUser.id, 'training_update', {
      entityType: 'training_records',
      metadata: { course_id: req.params.courseId, status: req.body.status },
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, 'Progress updated');
  } catch (err) { next(err); }
};

const getCertifications = async (req, res, next) => {
  try {
    const data = await trainingService.getCertifications(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

/**
 * GET /api/training/:userId
 * Fetch training progress for a specific user (admin/doh_officer or self).
 */
const getProgressByUserId = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.userId, 10);
    if (!targetId) return response.error(res, 'Invalid userId', 400);

    const role = req.dbUser.role;
    if (String(req.dbUser.id) !== String(targetId) && !['admin', 'doh_officer'].includes(role)) {
      return response.error(res, 'Forbidden', 403);
    }

    const data = await trainingService.getProgress(targetId);
    return response.success(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/training/update
 * Body: { course_id, status, score?, progress_percent? }
 * Convenience alias for PUT /progress/:courseId (used by EDGE or batch clients).
 */
const updateViaPost = async (req, res, next) => {
  try {
    const { course_id, ...payload } = req.body;
    if (!course_id) return response.error(res, 'course_id is required', 400);

    const data = await trainingService.updateProgress(req.dbUser.id, course_id, payload);

    logsService.writeLog(req.dbUser.id, 'training_update', {
      entityType: 'training_records',
      metadata: { course_id, status: payload.status },
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, 'Progress updated');
  } catch (err) { next(err); }
};

export default { getProgress, updateProgress, getCertifications, getProgressByUserId, updateViaPost };
