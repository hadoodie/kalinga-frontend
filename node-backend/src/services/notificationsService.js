import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const VALID_ORDER_COLUMNS = ['created_at', 'title', 'id'];

const getNotifications = async (userId, query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'created_at';
  const dir = orderDir ? 'ASC' : 'DESC';

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT id, user_id, title, description, read_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY ${col} ${dir}
     LIMIT $2 OFFSET $3`,
    [userId, limit, from]
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getUnreadNotifications = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, user_id, title, description, created_at
     FROM notifications
     WHERE user_id = $1 AND read_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );
  return { data: rows, unread_count: rows.length };
};

const markAsRead = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  if (!rows[0]) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  return rows[0];
};

const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return true;
};

const createNotification = async (payload) => {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, title, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [payload.user_id, payload.title, payload.description || payload.message || '']
  );
  return rows[0];
};

const deleteNotification = async (id, userId) => {
  await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return true;
};

export default {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
};
