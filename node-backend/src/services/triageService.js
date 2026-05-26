import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { isSchemaMismatchError, logFallback } from '../utils/dbFallback.js';

const getTriageByHospital = async (query = {}) => {
  const { from, limit, page } = parsePagination(query);

  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM triage_cases');
    const total = parseInt(countRes.rows[0].count, 10);

    const { rows } = await pool.query(
      `SELECT tc.id, tc.hospital_id, tc.patient_id, tc.triage_level, tc.status,
              tc.presenting_complaint, tc.vitals, tc.notes, tc.assigned_to,
              tc.created_at, tc.updated_at,
              h.name AS hospital_name,
              p.full_name AS patient_name, p.age AS patient_age, p.gender AS patient_gender
       FROM triage_cases tc
       LEFT JOIN hospitals h ON h.id = tc.hospital_id
       LEFT JOIN patients p ON p.id = tc.patient_id
       ORDER BY tc.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, from]
    );

    return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
  } catch (err) {
    if (isSchemaMismatchError(err)) {
      logFallback('triage.getTriageByHospital', err);
      return { data: [], pagination: buildPaginationMeta(0, page, limit) };
    }
    throw err;
  }
};

const getTriagePatients = async (query = {}) => {
  const { from, limit, page } = parsePagination(query);

  const conditions = ['triage_level IS NOT NULL'];
  const params = [];

  if (query.triage_level) {
    params.push(query.triage_level);
    conditions.push(`triage_level = $${params.length}`);
  }
  if (query.hospital_id) {
    params.push(query.hospital_id);
    conditions.push(`hospital_id = $${params.length}`);
  }
  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM patients ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, from];
    const { rows } = await pool.query(
      `SELECT p.id, p.full_name, p.age, p.gender, p.status, p.triage_level,
              p.hospital_id, p.admitted_at, p.contact_number,
              h.name AS hospital_name
       FROM patients p
       LEFT JOIN hospitals h ON h.id = p.hospital_id
       ${where}
       ORDER BY p.admitted_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
  } catch (err) {
    if (isSchemaMismatchError(err)) {
      logFallback('triage.getTriagePatients', err);
      return { data: [], pagination: buildPaginationMeta(0, page, limit) };
    }
    throw err;
  }
};

const createTriageCase = async (payload) => {
  const { rows } = await pool.query(
    `INSERT INTO triage_cases
       (hospital_id, patient_id, triage_level, status, presenting_complaint, vitals, notes, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      payload.hospital_id,
      payload.patient_id || null,
      payload.triage_level || 'low',
      payload.status || 'active',
      payload.presenting_complaint || null,
      payload.vitals ? JSON.stringify(payload.vitals) : null,
      payload.notes || null,
      payload.assigned_to || null,
    ]
  );
  return rows[0];
};

const updateTriageCase = async (id, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['triage_level', 'status', 'presenting_complaint', 'vitals', 'notes', 'assigned_to'];

  allowed.forEach((k) => {
    if (payload[k] !== undefined) {
      params.push(k === 'vitals' ? JSON.stringify(payload[k]) : payload[k]);
      fields.push(`${k} = $${params.length}`);
    }
  });
  params.push(new Date().toISOString());
  fields.push(`updated_at = $${params.length}`);
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE triage_cases SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('Triage case not found'), { statusCode: 404 });
  return rows[0];
};

const getTriageStats = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT h.id AS hospital_id, h.name AS hospital_name,
              tc.triage_level, COUNT(*)::int AS count
       FROM triage_cases tc
       JOIN hospitals h ON h.id = tc.hospital_id
       WHERE tc.status = 'active'
       GROUP BY h.id, h.name, tc.triage_level
       ORDER BY h.name, tc.triage_level`
    );

    // Pivot rows into per-hospital objects
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.hospital_id)) {
        map.set(r.hospital_id, {
          hospital_id: r.hospital_id,
          hospital_name: r.hospital_name,
          low: 0, medium: 0, high: 0, very_high: 0, critical: 0, total: 0,
        });
      }
      const entry = map.get(r.hospital_id);
      const lvl = r.triage_level?.toLowerCase();
      if (entry[lvl] !== undefined) entry[lvl] = r.count;
      entry.total += r.count;
    }

    return [...map.values()];
  } catch (err) {
    if (isSchemaMismatchError(err)) {
      logFallback('triage.getTriageStats', err);
      return [];
    }
    throw err;
  }
};

const getTriageByHospitalId = async (id) => {
  const { rows } = await pool.query(
    `SELECT triage_level FROM triage_cases WHERE hospital_id = $1 AND status = 'active'`,
    [id]
  );

  const grouped = (rows || []).reduce(
    (acc, t) => {
      const lvl = t.triage_level?.toLowerCase() || 'low';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, very_high: 0, critical: 0 }
  );

  return grouped;
};

export default {
  getTriageByHospital,
  getTriagePatients,
  createTriageCase,
  updateTriageCase,
  getTriageStats,
  getTriageByHospitalId,
};
