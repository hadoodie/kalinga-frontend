import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

/**
 * Write an entry to activity_logs.
 * Designed to be fire-and-forget — callers should .catch(() => {}) so logging
 * failures never break the main request flow.
 */
const writeLog = async (userId, action, options = {}) => {
  const { entityType = null, entityId = null, metadata = null, ipAddress = null } = options;
  const { rows } = await pool.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      action,
      entityType,
      entityId || null,
      metadata ? JSON.stringify(metadata) : null,
      ipAddress || null,
    ]
  );
  return rows[0];
};

/**
 * Return paginated activity_logs for a specific user.
 */
const getLogsByUser = async (userId, query = {}) => {
  const { from, limit, page } = parsePagination(query);

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at
     FROM activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, from]
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export default { writeLog, getLogsByUser };
