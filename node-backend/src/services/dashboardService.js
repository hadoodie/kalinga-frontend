import pool from '../config/db.js';

/**
 * Dashboard-specific queries with computed occupancy and priority tagging.
 */

/**
 * Fetch all hospitals with dynamic occupancy calculation and auto-priority.
 *
 * occupancy_pct = (current_patients / bed_capacity) * 100
 * priority:
 *   Critical  >= 90%
 *   High      75–89%
 *   Medium    < 75%
 */
const getHospitalsWithOccupancy = async () => {
  const { rows } = await pool.query(
    `SELECT
       h.id,
       h.name,
       h.code,
       h.address,
       h.type,
       h.is_active,
       h.bed_capacity,
       COALESCE(h.current_patients, h.current_occupancy, 0) AS current_patients,
       h.icu_capacity,
       h.contact_number,
       h.latitude,
       h.longitude,
       h.level,
       h.created_at,
       h.updated_at,
       CASE
         WHEN COALESCE(h.bed_capacity, 0) = 0 THEN 0
         ELSE ROUND(
           (COALESCE(h.current_patients, h.current_occupancy, 0)::numeric
            / h.bed_capacity) * 100, 1
         )
       END AS occupancy_pct,
       CASE
         WHEN COALESCE(h.bed_capacity, 0) = 0 THEN 'Medium'
         WHEN (COALESCE(h.current_patients, h.current_occupancy, 0)::numeric
               / h.bed_capacity) * 100 >= 90 THEN 'Critical'
         WHEN (COALESCE(h.current_patients, h.current_occupancy, 0)::numeric
               / h.bed_capacity) * 100 >= 75 THEN 'High'
         ELSE 'Medium'
       END AS priority
     FROM hospitals h
     WHERE h.is_active IS NOT FALSE
     ORDER BY occupancy_pct DESC`
  );
  return rows;
};

/**
 * Fetch active (non-resolved/cancelled) incidents for real-time dashboard.
 * Includes reporter and assigned responder names.
 */
const getRealtimeIncidents = async () => {
  const { rows } = await pool.query(
    `SELECT
       i.id,
       i.type,
       i.status,
       i.description,
       i.location,
       i.latlng,
       i.created_at,
       i.updated_at,
       u.name  AS reporter_name,
       u.role  AS reporter_role,
       ua.name AS assigned_responder_name
     FROM incidents i
     LEFT JOIN users u  ON u.id  = i.user_id
     LEFT JOIN users ua ON ua.id = i.assigned_responder_id
     WHERE i.status NOT IN ('resolved', 'closed', 'cancelled')
     ORDER BY i.created_at DESC`
  );
  return rows;
};

export default { getHospitalsWithOccupancy, getRealtimeIncidents };
