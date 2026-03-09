import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

/**
 * Verifies the JWT bearer token on every protected request.
 * Attaches `req.user` (JWT payload) and `req.dbUser` (DB user record).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // Load user from DB to ensure account still exists
    const { rows } = await pool.query(
      'SELECT id, email, role, name, phone FROM users WHERE id = $1 LIMIT 1',
      [decoded.sub]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = decoded;
    req.dbUser = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — attaches user if token present, but does not require it.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, email, role, name FROM users WHERE id = $1 LIMIT 1',
      [decoded.sub]
    );

    if (rows[0]) {
      req.user = decoded;
      req.dbUser = rows[0];
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};

export { authenticate, optionalAuth };
