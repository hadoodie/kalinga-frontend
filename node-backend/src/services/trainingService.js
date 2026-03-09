import pool from '../config/db.js';

const getProgress = async (userId) => {
  const { rows } = await pool.query(
    `SELECT tr.id, tr.course_id, tr.status, tr.score, tr.completed_at, tr.progress_percent,
            tc.id AS course_id, tc.title AS course_title, tc.category AS course_category,
            tc.total_lessons, tc.duration_minutes
     FROM training_records tr
     JOIN training_courses tc ON tc.id = tr.course_id
     WHERE tr.user_id = $1
     ORDER BY tr.updated_at DESC`,
    [userId]
  );
  return rows;
};

const updateProgress = async (userId, courseId, payload) => {
  const completedAt = payload.status === 'completed' ? new Date().toISOString() : null;
  const { rows } = await pool.query(
    `INSERT INTO training_records (user_id, course_id, status, score, progress_percent, completed_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id, course_id) DO UPDATE
       SET status = $3, score = $4, progress_percent = $5, completed_at = $6, updated_at = NOW()
     RETURNING *`,
    [userId, courseId, payload.status, payload.score || null, payload.progress_percent || 0, completedAt]
  );
  return rows[0];
};

const getCertifications = async (userId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.course_id, c.issued_at, c.expires_at, c.certificate_url,
            tc.title AS course_title
     FROM certifications c
     JOIN training_courses tc ON tc.id = c.course_id
     WHERE c.user_id = $1
     ORDER BY c.issued_at DESC`,
    [userId]
  );
  return rows;
};

export default { getProgress, updateProgress, getCertifications };
