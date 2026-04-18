import qrService from '../services/qrService.js';
import logsService from '../services/logsService.js';
import response from '../utils/response.js';

/**
 * POST /api/qr/bind
 * Bind a QR to a user.  Body: { user_id, qr_uid? }
 * If qr_uid is omitted the server generates a UUID.
 * If the user already has an active QR it is returned unchanged.
 */
const bind = async (req, res, next) => {
  try {
    const userId = req.body.user_id || req.dbUser.id;
    const qrUid = req.body.qr_uid || null;

    if (!userId) {
      return response.error(res, 'user_id is required', 400);
    }

    // Only self or admin/doh_officer may bind for another user
    if (String(req.dbUser.id) !== String(userId) && !['admin', 'doh_officer'].includes(req.dbUser.role)) {
      return response.error(res, 'Forbidden', 403);
    }

    const data = await qrService.bindQr(userId, qrUid);

    logsService.writeLog(userId, 'qr_bind', {
      entityType: 'qr_codes',
      entityId: data.id,
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, 'QR bound successfully');
  } catch (err) {
    // Handle unique constraint violation for duplicate qr_uid
    if (err.code === '23505') {
      return response.error(res, 'Duplicate QR UID — already bound', 409);
    }
    next(err);
  }
};

/**
 * GET /api/qr/user/:userId
 * Return the active QR record for a given user (admin or self).
 */
const getByUser = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.userId, 10);
    if (!targetId) {
      return response.error(res, 'Invalid userId', 400);
    }

    // Users may only fetch their own QR unless they are admin/doh_officer
    const role = req.dbUser.role;
    if (String(req.dbUser.id) !== String(targetId) && !['admin', 'doh_officer'].includes(role)) {
      return response.error(res, 'Forbidden', 403);
    }

    const data = await qrService.getQrByUser(targetId);
    if (!data) {
      return response.success(res, null, 'No active QR found');
    }
    return response.success(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/qr/scan
 * Validate a scanned QR token (called by the EDGE Flask scanner).
 * Requires X-Edge-Key header matching EDGE_DEVICE_API_KEY env var.
 */
const scan = async (req, res, next) => {
  try {
    const deviceKey = req.headers['x-edge-key'];
    if (!process.env.EDGE_DEVICE_API_KEY || deviceKey !== process.env.EDGE_DEVICE_API_KEY) {
      return response.error(res, 'Unauthorized device', 401);
    }

    const { qr_uid } = req.body;
    if (!qr_uid || typeof qr_uid !== 'string' || qr_uid.trim().length === 0) {
      return response.error(res, 'qr_uid is required', 400);
    }

    const data = await qrService.scanQr(qr_uid.trim());

    // Log the scan
    logsService.writeLog(data.user_id, 'qr_scan', {
      entityType: 'qr_codes',
      entityId: data.qr_id,
      metadata: { scanned_qr_uid: qr_uid, device_ip: req.ip },
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, 'QR scan validated');
  } catch (err) { next(err); }
};

/**
 * POST /api/qr/regenerate
 * Revoke all existing tokens and issue a new one for the authenticated user.
 */
const regenerate = async (req, res, next) => {
  try {
    const userId = req.dbUser.id;
    const data = await qrService.regenerateQr(userId);

    logsService.writeLog(userId, 'qr_regenerate', {
      entityType: 'qr_codes',
      entityId: data.id,
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, 'New QR issued');
  } catch (err) { next(err); }
};

/**
 * POST /api/qr/status
 * Update QR status.  Body: { qr_uid, status }
 * status must be 'active' or 'inactive'.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { qr_uid, status } = req.body;

    if (!qr_uid || typeof qr_uid !== 'string') {
      return response.error(res, 'qr_uid is required', 400);
    }
    if (!['active', 'inactive'].includes(status)) {
      return response.error(res, 'status must be active or inactive', 400);
    }

    const data = await qrService.updateStatus(qr_uid.trim(), status);

    logsService.writeLog(req.dbUser.id, 'qr_status_update', {
      entityType: 'qr_codes',
      entityId: data.id,
      metadata: { qr_uid, new_status: status },
      ipAddress: req.ip,
    }).catch(() => {});

    return response.success(res, data, `QR status updated to ${status}`);
  } catch (err) { next(err); }
};

export default { bind, getByUser, scan, regenerate, updateStatus };
