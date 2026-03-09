import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Actual status values from DB CHECK constraint
const ON_DUTY_VALUE = 'On Duty';
const STANDBY_VALUES = ['Available'];
const OFF_DUTY_VALUES = ['Off Duty', 'On Leave', 'Suspended'];

const VALID_ORDER_COLUMNS = ['full_name', 'status', 'created_at', 'id'];

const getAll = async (query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'full_name';
  const dir = orderDir ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (query.status) {
    params.push(query.status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`r.full_name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM responders r ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT r.id, r.responder_code, r.user_id, r.full_name, r.status,
            r.created_at, u.email, u.phone
     FROM responders r
     LEFT JOIN users u ON u.id = r.user_id
     ${where}
     ORDER BY r.${col} ${dir}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getActive = async () => {
  const { rows } = await pool.query(
    `SELECT id, responder_code, full_name, status, user_id
     FROM responders
     WHERE status IN ('On Duty', 'Available')
     ORDER BY full_name`
  );
  return { data: rows, total: rows.length };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.email, u.phone, u.name AS user_name
     FROM responders r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.id = $1`,
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Responder not found'), { statusCode: 404 });
  return rows[0];
};

const create = async (payload) => {
  const { rows } = await pool.query(
    `INSERT INTO responders (responder_code, user_id, full_name, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [payload.responder_code, payload.user_id, payload.full_name, payload.status || 'Available']
  );
  return rows[0];
};

const update = async (id, payload) => {
  const fields = [];
  const params = [];

  if (payload.full_name !== undefined) {
    params.push(payload.full_name);
    fields.push(`full_name = $${params.length}`);
  }
  if (payload.status !== undefined) {
    params.push(payload.status);
    fields.push(`status = $${params.length}`);
  }
  params.push(new Date().toISOString());
  fields.push(`updated_at = $${params.length}`);
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE responders SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('Responder not found'), { statusCode: 404 });
  return rows[0];
};

const getStats = async () => {
  const { rows } = await pool.query('SELECT status FROM responders');

  const stats = (rows || []).reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === ON_DUTY_VALUE) acc.on_duty++;
      else if (STANDBY_VALUES.includes(r.status)) acc.standby++;
      else acc.off_duty++;
      return acc;
    },
    { total: 0, on_duty: 0, standby: 0, off_duty: 0 }
  );

  return stats;
};

export default { getAll, getActive, getById, create, update, getStats };
