import pool from '../config/db.js';

/* ── helpers: map DB column / status names to API spec ──────────────── */
const mapStatus = (s) => (s === 'revoked' ? 'inactive' : s);
const toDbStatus = (s) => (s === 'inactive' ? 'revoked' : s);

const mapRow = (row) => {
  if (!row) return null;
  const { qr_token, status, ...rest } = row;
  return { ...rest, qr_uid: qr_token, status: mapStatus(status) };
};

/**
 * Bind a QR to a user.
 * If the user already has an active QR it is returned unchanged.
 * @param {number|string} userId
 * @param {string|null}   qrUid — optional; when omitted the DB generates a UUID.
 */
const bindQr = async (userId, qrUid) => {
  const existing = await pool.query(
    `SELECT id, user_id, qr_token, status, affiliation, created_at, updated_at
     FROM qr_codes
     WHERE user_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (existing.rows[0]) return mapRow(existing.rows[0]);

  const sql = qrUid
    ? `INSERT INTO qr_codes (user_id, qr_token, status)
       VALUES ($1, $2, 'active')
       RETURNING id, user_id, qr_token, status, affiliation, created_at, updated_at`
    : `INSERT INTO qr_codes (user_id, status)
       VALUES ($1, 'active')
       RETURNING id, user_id, qr_token, status, affiliation, created_at, updated_at`;

  const params = qrUid ? [userId, qrUid] : [userId];
  const { rows } = await pool.query(sql, params);
  return mapRow(rows[0]);
};

/**
 * Return the active QR record for a user (null if none exists).
 */
const getQrByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT q.id, q.user_id, q.qr_token, q.status, q.affiliation, q.created_at
     FROM qr_codes q
     WHERE q.user_id = $1 AND q.status = 'active'
     ORDER BY q.created_at DESC LIMIT 1`,
    [userId]
  );
  return mapRow(rows[0]);
};

/**
 * Validate a scanned QR UID and return the owner's user data.
 * Throws 404 if the QR is unknown or inactive.
 */
const scanQr = async (qrUid) => {
  const { rows } = await pool.query(
    `SELECT q.id AS qr_id, q.user_id, q.qr_token, q.status, q.affiliation,
            u.name AS user_name, u.email, u.role
     FROM qr_codes q
     JOIN users u ON u.id = q.user_id
     WHERE q.qr_token = $1 AND q.status = 'active'
     LIMIT 1`,
    [qrUid]
  );
  if (!rows[0]) {
    throw Object.assign(new Error('Invalid or inactive QR'), { statusCode: 404 });
  }
  return mapRow(rows[0]);
};

/**
 * Revoke all active QRs for a user and issue a fresh one.
 */
const regenerateQr = async (userId) => {
  await pool.query(
    `UPDATE qr_codes SET status = 'revoked', updated_at = NOW()
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  const { rows } = await pool.query(
    `INSERT INTO qr_codes (user_id, status)
     VALUES ($1, 'active')
     RETURNING id, user_id, qr_token, status, affiliation, created_at, updated_at`,
    [userId]
  );
  return mapRow(rows[0]);
};

/**
 * Update a QR record's status by qr_uid.
 * @param {string} qrUid
 * @param {string} newStatus — 'active' | 'inactive'
 */
const updateStatus = async (qrUid, newStatus) => {
  const dbStatus = toDbStatus(newStatus);
  const { rows } = await pool.query(
    `UPDATE qr_codes SET status = $1, updated_at = NOW()
     WHERE qr_token = $2
     RETURNING id, user_id, qr_token, status, affiliation, created_at, updated_at`,
    [dbStatus, qrUid]
  );
  if (!rows[0]) {
    throw Object.assign(new Error('QR not found'), { statusCode: 404 });
  }
  return mapRow(rows[0]);
};

export default { bindQr, getQrByUser, scanQr, regenerateQr, updateStatus };
