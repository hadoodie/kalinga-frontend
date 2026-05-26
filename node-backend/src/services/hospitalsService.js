import pool from '../config/db.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { isSchemaMismatchError, logFallback } from '../utils/dbFallback.js';

const VALID_ORDER_COLUMNS = ['name', 'code', 'level', 'bed_capacity', 'current_occupancy', 'id'];

const getPatientDistribution = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT status FROM patients WHERE status IS NOT NULL`
    );

    const distribution = (rows || []).reduce(
      (acc, p) => {
        const s = p.status?.toLowerCase();
        if (s === 'admitted') acc.admitted++;
        else if (s === 'discharged') acc.discharged++;
        else if (s === 'referred') acc.referred++;
        else if (s === 'critical') acc.critical++;
        return acc;
      },
      { admitted: 0, discharged: 0, referred: 0, critical: 0 }
    );

    return [
      { name: 'Admitted Patients', value: distribution.admitted },
      { name: 'Discharged Patients', value: distribution.discharged },
      { name: 'Referred Patients', value: distribution.referred },
      { name: 'Critical Cases', value: distribution.critical },
    ];
  } catch (err) {
    if (isSchemaMismatchError(err)) {
      logFallback('hospitals.getPatientDistribution', err);
      return [
        { name: 'Admitted Patients', value: 0 },
        { name: 'Discharged Patients', value: 0 },
        { name: 'Referred Patients', value: 0 },
        { name: 'Critical Cases', value: 0 },
      ];
    }
    throw err;
  }
};

const getHospitalPatients = async (hospitalId, query = {}) => {
  const { from, limit, page } = parsePagination(query);

  const conditions = ['hospital_id = $1'];
  const params = [hospitalId];

  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM patients ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT id, full_name, age, status, triage_level, admitted_at
     FROM patients
     ${where}
     ORDER BY admitted_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getAll = async (query = {}) => {
  const { from, limit, page, orderBy, orderDir } = parsePagination(query);
  const col = VALID_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'name';
  const dir = orderDir ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }
  if (query.level) {
    params.push(query.level);
    conditions.push(`level = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM hospitals ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, from];
  const { rows } = await pool.query(
    `SELECT id, name, code, latitude, longitude, bed_capacity, current_occupancy,
            level, contact_number, created_at
     FROM hospitals
     ${where}
     ORDER BY ${col} ${dir}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { data: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT h.*,
            (SELECT COUNT(*) FROM patients p WHERE p.hospital_id = h.id) AS patient_count
     FROM hospitals h
     WHERE h.id = $1`,
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Hospital not found'), { statusCode: 404 });
  return rows[0];
};

export default { getPatientDistribution, getHospitalPatients, getAll, getById };
