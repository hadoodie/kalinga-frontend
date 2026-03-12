import pool from '../config/db.js';
import response from '../utils/response.js';

/** Normalise IP so ::1, ::ffff:127.0.0.1 and 127.0.0.1 all become 127.0.0.1 */
function normalizeIp(ip) {
  if (!ip) return '127.0.0.1';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

/**
 * Parse user-agent string into a human-readable device name.
 */
function parseDeviceName(ua) {
  if (!ua) return 'Unknown Device';

  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android[^;]*;\s*([^;)]+)/);
    return m ? m[1].trim() : 'Android Device';
  }

  // Desktop – browser + OS
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = '';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return os ? `${browser} on ${os}` : browser;
}

/**
 * POST /api/auth/record-device
 * Called by the frontend right after a successful login.
 * UPSERTs the device row so repeat logins from the same device just
 * bump `last_active` instead of creating duplicates.
 */
const recordDevice = async (req, res, next) => {
  try {
    const userId = req.dbUser.id;
    const deviceName = parseDeviceName(req.headers['user-agent']);
    const ipAddress = normalizeIp(req.ip);
    const location = req.body.location || 'Unknown';

    await pool.query(
      `INSERT INTO active_devices (user_id, device_name, location, ip_address, last_active)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, device_name, ip_address)
       DO UPDATE SET last_active = CURRENT_TIMESTAMP`,
      [userId, deviceName, location, ipAddress]
    );

    return response.success(res, null, 'Device recorded');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:user_id/devices
 * Returns all devices for a user, sorted by last_active DESC.
 * `is_current_device` is computed dynamically by comparing each row's
 * device_name + ip_address against the incoming request.
 */
const getUserDevices = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.user_id, 10);

    // Users can only view their own devices
    if (String(userId) !== String(req.dbUser.id)) {
      return response.error(res, 'Forbidden', 403);
    }

    const { rows } = await pool.query(
      `SELECT id, device_name, device_type, location, ip_address, last_active
       FROM active_devices
       WHERE user_id = $1
       ORDER BY last_active DESC`,
      [userId]
    );

    const reqDeviceName = parseDeviceName(req.headers['user-agent']);
    const reqIp = normalizeIp(req.ip);

    const devices = rows.map((row) => ({
      ...row,
      is_current_device: row.device_name === reqDeviceName && row.ip_address === reqIp,
    }));

    return response.success(res, devices);
  } catch (err) {
    next(err);
  }
};

export default { recordDevice, getUserDevices };
