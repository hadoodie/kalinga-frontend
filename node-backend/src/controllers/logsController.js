import logsService from '../services/logsService.js';
import response from '../utils/response.js';

/**
 * POST /api/logs
 * Write a manual activity log entry for the authenticated user.
 * Body: { action, entity_type?, entity_id?, metadata? }
 */
const create = async (req, res, next) => {
  try {
    const { action, entity_type, entity_id, metadata } = req.body;

    if (!action || typeof action !== 'string' || action.trim().length === 0) {
      return response.error(res, 'action is required', 400);
    }

    const data = await logsService.writeLog(req.dbUser.id, action.trim(), {
      entityType: entity_type || null,
      entityId: entity_id || null,
      metadata: metadata || null,
      ipAddress: req.ip,
    });

    return response.created(res, data, 'Log entry created');
  } catch (err) { next(err); }
};

/**
 * GET /api/logs/:userId
 * Return paginated activity_logs for a user (self or admin/doh_officer).
 */
const getByUser = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.userId, 10);
    if (!targetId) {
      return response.error(res, 'Invalid userId', 400);
    }

    const role = req.dbUser.role;
    if (String(req.dbUser.id) !== String(targetId) && !['admin', 'doh_officer'].includes(role)) {
      return response.error(res, 'Forbidden', 403);
    }

    const result = await logsService.getLogsByUser(targetId, req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

export default { create, getByUser };
