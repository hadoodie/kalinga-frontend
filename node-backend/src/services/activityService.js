import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Human-readable labels for activity_logs actions
const ACTION_LABELS = {
  qr_scan:          'QR scanned at Raspberry Pi',
  qr_bind:          'QR code bound to profile',
  qr_regenerate:    'QR code regenerated',
  qr_status_update: 'QR status updated',
  login:            'Logged in',
  logout:           'Logged out',
  training_update:  'Training record updated',
  profile_update:   'Profile updated',
};

const getActivity = async (userId, query = {}) => {
  const { from, limit, page } = parsePagination(query);

  // Count rows from both tables without modifying them
  const [raCount, alCount] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM responder_activity WHERE responder_id = $1', [userId]),
    pool.query('SELECT COUNT(*) FROM activity_logs WHERE user_id = $1', [userId]),
  ]);
  const total =
    parseInt(raCount.rows[0].count, 10) +
    parseInt(alCount.rows[0].count, 10);

  // UNION both tables with a stable composite key and normalised description
  const { rows } = await pool.query(
    `SELECT 'ra_' || id::text AS id,
            action,
            COALESCE(description, action) AS description,
            created_at,
            'responder_activity' AS source
     FROM responder_activity
     WHERE responder_id = $1

     UNION ALL

     SELECT 'al_' || id::text AS id,
            action,
            CASE action
              WHEN 'qr_scan'          THEN 'QR scanned at Raspberry Pi'
              WHEN 'qr_bind'          THEN 'QR code bound to profile'
              WHEN 'qr_regenerate'    THEN 'QR code regenerated'
              WHEN 'qr_status_update' THEN 'QR status updated'
              WHEN 'login'            THEN 'Logged in'
              WHEN 'logout'           THEN 'Logged out'
              WHEN 'training_update'  THEN 'Training record updated'
              WHEN 'profile_update'   THEN 'Profile updated'
              ELSE action
            END AS description,
            created_at,
            'activity_logs' AS source
     FROM activity_logs
     WHERE user_id = $1

     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, from]
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const logActivity = async (userId, payload) => {
  const { rows } = await pool.query(
    `INSERT INTO responder_activity (responder_id, action, description, incident_id, points)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      payload.action,
      payload.description || null,
      payload.incident_id || null,
      payload.points || 0,
    ]
  );
  return rows[0];
};

export default { getActivity, logActivity };
