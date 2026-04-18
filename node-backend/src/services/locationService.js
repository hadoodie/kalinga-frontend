import pool from '../config/db.js';

const getCurrentLocation = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, user_id, latitude, longitude, address, updated_at
     FROM locations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const upsertLocation = async (userId, payload) => {
  const { rows } = await pool.query(
    `INSERT INTO locations (user_id, latitude, longitude, address, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET latitude = $2, longitude = $3, address = $4, updated_at = NOW()
     RETURNING *`,
    [userId, payload.latitude, payload.longitude, payload.address || null]
  );
  return rows[0];
};

const getAreas = async (query = {}) => {
  const params = [];
  let where = '';

  if (query.search) {
    params.push(`%${query.search}%`);
    where = `WHERE name ILIKE $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT id, name, code, province, coordinates FROM regions ${where} ORDER BY name`,
    params
  );
  return rows;
};

export default { getCurrentLocation, upsertLocation, getAreas };
