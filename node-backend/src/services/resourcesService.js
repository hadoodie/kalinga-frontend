import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const VALID_ORDER_COLUMNS = ['name', 'category', 'status', 'quantity', 'created_at', 'id'];

const getAll = async (query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'created_at';
  const dir = orderDir ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (query.category) {
    params.push(query.category);
    conditions.push(`r.category = $${params.length}`);
  }
  if (query.hospital_id) {
    params.push(query.hospital_id);
    conditions.push(`r.hospital_id = $${params.length}`);
  }
  if (query.status) {
    params.push(query.status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`r.name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM resources r ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.category, r.quantity, r.unit, r.hospital_id, r.status,
            r.expiry_date, r.created_at, r.updated_at,
            h.name AS hospital_name
     FROM resources r
     LEFT JOIN hospitals h ON h.id = r.hospital_id
     ${where}
     ORDER BY r.${col} ${dir}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getSummary = async () => {
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.category, r.quantity, r.unit, r.status,
            r.hospital_id, h.name AS hospital_name
     FROM resources r
     LEFT JOIN hospitals h ON h.id = r.hospital_id
     ORDER BY h.name, r.category`
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT r.*, h.name AS hospital_name
     FROM resources r
     LEFT JOIN hospitals h ON h.id = r.hospital_id
     WHERE r.id = $1`,
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Resource not found'), { statusCode: 404 });
  return rows[0];
};

const create = async (payload) => {
  const { rows } = await pool.query(
    `INSERT INTO resources (name, category, quantity, unit, status, hospital_id, expiry_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      payload.name,
      payload.category,
      payload.quantity,
      payload.unit || null,
      payload.status || 'High',
      payload.hospital_id || null,
      payload.expiry_date || null,
    ]
  );
  return rows[0];
};

const update = async (id, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['name', 'category', 'quantity', 'unit', 'status', 'hospital_id', 'expiry_date'];

  allowed.forEach((k) => {
    if (payload[k] !== undefined) {
      params.push(payload[k]);
      fields.push(`${k} = $${params.length}`);
    }
  });
  params.push(new Date().toISOString());
  fields.push(`updated_at = $${params.length}`);
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE resources SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('Resource not found'), { statusCode: 404 });
  return rows[0];
};

const remove = async (id) => {
  await pool.query('DELETE FROM resources WHERE id = $1', [id]);
  return true;
};

export default { getAll, getSummary, getById, create, update, remove };
