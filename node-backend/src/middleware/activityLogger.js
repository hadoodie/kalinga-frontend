import logsService from '../services/logsService.js';

/**
 * activityLogger(action, entityType?)
 *
 * Returns an Express middleware that writes an activity_logs entry after the
 * response is sent. The write is fire-and-forget — failures are swallowed so
 * they never affect the main request.
 *
 * Usage:
 *   router.get('/profile', authenticate, activityLogger('profile_view'), profileController.getProfile);
 *
 * @param {string} action      - e.g. 'profile_view', 'training_view', 'qr_scan'
 * @param {string} [entityType] - e.g. 'profile', 'training_records', 'qr_codes'
 */
const activityLogger = (action, entityType = null) => (req, res, next) => {
  res.on('finish', () => {
    // Only log successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.dbUser?.id) {
      logsService.writeLog(req.dbUser.id, action, {
        entityType,
        ipAddress: req.ip,
        metadata: {
          method: req.method,
          path: req.path,
          status_code: res.statusCode,
        },
      }).catch(() => {});
    }
  });
  next();
};

export default activityLogger;
