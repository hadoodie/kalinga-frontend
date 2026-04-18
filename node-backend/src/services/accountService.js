import pool from '../config/db.js';

const getStatus = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, user_id, status, verified_at, deactivated_at, deactivation_reason, created_at
     FROM accounts WHERE user_id = $1`,
    [userId]
  );
  if (!rows[0]) throw Object.assign(new Error('Account not found'), { statusCode: 404 });
  return rows[0];
};

const verifyAccount = async (userId) => {
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO accounts (user_id, status, verified_at, created_at, updated_at)
     VALUES ($1, 'verified', $2, $2, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET status = 'verified', verified_at = $2, updated_at = $2
     RETURNING *`,
    [userId, now]
  );
  await pool.query('UPDATE users SET is_active = TRUE WHERE id = $1', [userId]);
  return rows[0];
};

const deactivateAccount = async (userId, reason) => {
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `UPDATE accounts
     SET status = 'deactivated', deactivated_at = $1, deactivation_reason = $2, updated_at = $1
     WHERE user_id = $3
     RETURNING *`,
    [now, reason || null, userId]
  );
  if (!rows[0]) throw Object.assign(new Error('Account not found'), { statusCode: 404 });
  await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [userId]);
  return rows[0];
};

export default { getStatus, verifyAccount, deactivateAccount };
