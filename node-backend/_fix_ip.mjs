import pool from './src/config/db.js';
const r = await pool.query("UPDATE active_devices SET ip_address = '127.0.0.1' WHERE ip_address IN ('::1', '::ffff:127.0.0.1')");
console.log('Updated', r.rowCount, 'rows');
process.exit(0);
