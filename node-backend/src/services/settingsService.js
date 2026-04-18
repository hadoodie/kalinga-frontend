import pool from '../config/db.js';

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'en',
  notifications_enabled: true,
  email_notifications: true,
  sms_notifications: false,
  two_factor_enabled: false,
  timezone: 'Asia/Manila',
};

const getSettings = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  if (!rows[0]) {
    return { user_id: userId, ...DEFAULT_SETTINGS };
  }
  return rows[0];
};

const updateSettings = async (userId, payload) => {
  const theme = payload.theme ?? DEFAULT_SETTINGS.theme;
  const language = payload.language ?? DEFAULT_SETTINGS.language;
  const notif = payload.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled;
  const emailNotif = payload.email_notifications ?? DEFAULT_SETTINGS.email_notifications;
  const smsNotif = payload.sms_notifications ?? DEFAULT_SETTINGS.sms_notifications;
  const twoFa = payload.two_factor_enabled ?? DEFAULT_SETTINGS.two_factor_enabled;
  const tz = payload.timezone ?? DEFAULT_SETTINGS.timezone;

  const { rows } = await pool.query(
    `INSERT INTO user_settings
       (user_id, theme, language, notifications_enabled, email_notifications,
        sms_notifications, two_factor_enabled, timezone, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       theme = $2, language = $3, notifications_enabled = $4,
       email_notifications = $5, sms_notifications = $6,
       two_factor_enabled = $7, timezone = $8, updated_at = NOW()
     RETURNING *`,
    [userId, theme, language, notif, emailNotif, smsNotif, twoFa, tz]
  );
  return rows[0];
};

export default { getSettings, updateSettings };
