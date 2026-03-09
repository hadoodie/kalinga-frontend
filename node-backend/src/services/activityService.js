import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const getActivity = async (userId, query = {}) => {
  const { from, limit, page } = parsePagination(query);

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM responder_activity WHERE responder_id = $1',
    [userId]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT id, action, description, incident_id, points, created_at
     FROM responder_activity
     WHERE responder_id = $1
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
