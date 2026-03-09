import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const VALID_ORDER_COLUMNS = ['created_at', 'severity', 'title', 'id'];

const getAll = async (query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'created_at';
  const dir = orderDir ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (query.severity) {
    params.push(query.severity);
    conditions.push(`severity = $${params.length}`);
  }
  if (query.type) {
    params.push(query.type);
    conditions.push(`type = $${params.length}`);
  }
  if (query.hospital) {
    params.push(`%${query.hospital}%`);
    conditions.push(`hospital_name ILIKE $${params.length}`);
  }
  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM hospital_reports ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT id, title, hospital_name, message, action, severity, occupancy,
            type, status, reporter_id, created_at, updated_at
     FROM hospital_reports
     ${where}
     ORDER BY ${col} ${dir}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM hospital_reports WHERE id = $1',
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  return rows[0];
};

const create = async (payload, reporterId) => {
  const { rows } = await pool.query(
    `INSERT INTO hospital_reports
       (title, hospital_name, message, action, severity, occupancy, type, status, reporter_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      payload.title,
      payload.hospital_name,
      payload.message || null,
      payload.action || null,
      payload.severity || 'medium',
      payload.occupancy || null,
      payload.type || 'capacity',
      payload.status || 'active',
      reporterId,
    ]
  );
  return rows[0];
};

const update = async (id, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['title', 'hospital_name', 'message', 'action', 'severity', 'occupancy', 'type', 'status'];

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
    `UPDATE hospital_reports SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  return rows[0];
};

const remove = async (id) => {
  await pool.query('DELETE FROM hospital_reports WHERE id = $1', [id]);
  return true;
};

export default { getAll, getById, create, update, remove };
