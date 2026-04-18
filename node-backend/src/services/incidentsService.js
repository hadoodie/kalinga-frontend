import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Status values used in the live DB
const VALID_STATUSES = [
  'reported', 'acknowledged', 'en_route', 'on_scene',
  'transporting', 'hospital_transfer', 'resolved', 'cancelled',
];

const VALID_ORDER_COLUMNS = ['created_at', 'type', 'status', 'location', 'id'];

const getAll = async (query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'created_at';
  const dir = orderDir ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (query.status && VALID_STATUSES.includes(query.status)) {
    params.push(query.status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (query.type) {
    params.push(query.type);
    conditions.push(`i.type = $${params.length}`);
  }
  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`(i.type ILIKE $${params.length} OR i.description ILIKE $${params.length} OR i.location ILIKE $${params.length})`);
  }
  if (query.date_from) {
    params.push(query.date_from);
    conditions.push(`i.created_at >= $${params.length}`);
  }
  if (query.date_to) {
    params.push(query.date_to);
    conditions.push(`i.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM incidents i ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT i.id, i.type, i.status, i.description, i.location, i.latlng,
            i.user_id, i.assigned_responder_id, i.responders_required,
            i.created_at, i.updated_at,
            u.name AS reporter_name, u.role AS reporter_role,
            ua.name AS assigned_responder_name
     FROM incidents i
     LEFT JOIN users u ON u.id = i.user_id
     LEFT JOIN users ua ON ua.id = i.assigned_responder_id
     ${where}
     ORDER BY i.${col} ${dir}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.*, u.name AS reporter_name, u.role AS reporter_role,
            u.phone AS reporter_phone, ua.name AS assigned_responder_name
     FROM incidents i
     LEFT JOIN users u ON u.id = i.user_id
     LEFT JOIN users ua ON ua.id = i.assigned_responder_id
     WHERE i.id = $1`,
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Incident not found'), { statusCode: 404 });
  return rows[0];
};

const create = async (payload, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO incidents (type, location, latlng, description, user_id, status)
     VALUES ($1, $2, $3, $4, $5, 'reported')
     RETURNING *`,
    [
      payload.type || 'general',
      payload.location || null,
      payload.latlng || null,
      payload.description || null,
      userId,
    ]
  );
  return rows[0];
};

const update = async (id, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['type', 'location', 'latlng', 'description', 'status', 'assigned_responder_id'];

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
    `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('Incident not found'), { statusCode: 404 });
  return rows[0];
};

const remove = async (id) => {
  await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
  return true;
};

export default { getAll, getById, create, update, remove };
