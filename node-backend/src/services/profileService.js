import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const getProfile = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.phone, u.profile_image,
            u.verification_status, u.created_at,
            r.id AS responder_id, r.responder_code, r.full_name AS responder_name, r.status AS responder_status
     FROM users u
     LEFT JOIN responders r ON r.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  if (!rows[0]) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return rows[0];
};

const updateProfile = async (userId, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['name', 'phone'];

  allowed.forEach((k) => {
    if (payload[k] !== undefined) {
      params.push(payload[k]);
      fields.push(`${k} = $${params.length}`);
    }
  });

  if (fields.length === 0) throw Object.assign(new Error('No valid fields to update'), { statusCode: 400 });

  params.push(new Date().toISOString());
  fields.push(`updated_at = $${params.length}`);
  params.push(userId);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length}
     RETURNING id, email, name, role, phone, profile_image`,
    params
  );
  if (!rows[0]) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return rows[0];
};

const updateAvatar = async (userId, avatarUrl) => {
  const { rows } = await pool.query(
    `UPDATE users SET profile_image = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, profile_image`,
    [avatarUrl, userId]
  );
  if (!rows[0]) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return rows[0];
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const { rows } = await pool.query(
    'SELECT password FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  // Normalize any bcrypt variant ($2y$ from Laravel, $2a$ from older libs) to $2b$
  const normalizedHash = rows[0].password.replace(/^\$2[ay]\$/, '$2b$');
  const valid = await bcrypt.compare(currentPassword, normalizedHash);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hash, userId]
  );
  return true;
};

const getDevices = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, device_name, device_type, location, ip_address, last_active, is_current_device
     FROM active_devices WHERE user_id = $1 ORDER BY last_active DESC`,
    [userId]
  );
  return rows;
};

const removeDevice = async (userId, deviceId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM active_devices WHERE id = $1 AND user_id = $2 AND is_current_device = false`,
    [deviceId, userId]
  );
  if (rowCount === 0) throw Object.assign(new Error('Device not found or is current device'), { statusCode: 400 });
  return true;
};

export default { getProfile, updateProfile, updateAvatar, changePassword, getDevices, removeDevice };
