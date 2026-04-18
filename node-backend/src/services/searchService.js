import pool from '../config/db.js';

/**
 * Global search across hospitals, incidents, responders, and reports.
 */
const globalSearch = async (q) => {
  if (!q || q.trim().length < 2) {
    return { hospitals: [], incidents: [], responders: [], reports: [] };
  }

  const term = `%${q.trim()}%`;

  const [hospitalsRes, incidentsRes, respondersRes, reportsRes] = await Promise.all([
    pool.query(
      `SELECT id, name, code, level, bed_capacity, current_occupancy
       FROM hospitals WHERE name ILIKE $1 LIMIT 5`,
      [term]
    ),
    pool.query(
      `SELECT id, type, status, location, description, created_at
       FROM incidents
       WHERE type ILIKE $1 OR description ILIKE $1 OR location ILIKE $1
       LIMIT 5`,
      [term]
    ),
    pool.query(
      `SELECT id, responder_code, full_name, status
       FROM responders WHERE full_name ILIKE $1 LIMIT 5`,
      [term]
    ),
    pool.query(
      `SELECT id, title, hospital_name, severity, created_at
       FROM hospital_reports
       WHERE title ILIKE $1 OR hospital_name ILIKE $1
       LIMIT 5`,
      [term]
    ),
  ]);

  return {
    hospitals: hospitalsRes.rows,
    incidents: incidentsRes.rows,
    responders: respondersRes.rows,
    reports: reportsRes.rows,
  };
};

export default { globalSearch };
