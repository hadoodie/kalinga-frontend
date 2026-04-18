/**
 * RBAC middleware. Call after `authenticate`.
 *
 * Usage:
 *   router.get('/admin', authenticate, requireRole('admin'), handler)
 *   router.get('/staff', authenticate, requireRole(['admin', 'doh_officer']), handler)
 */
const requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!req.dbUser) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (!allowed.includes(req.dbUser.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${allowed.join(', ')}.`,
    });
  }

  next();
};

/**
 * Allows access only to the resource owner OR an admin/doh_officer.
 * Expects `req.params.id` to be the target user id.
 */
const requireOwnerOrAdmin = (req, res, next) => {
  const { dbUser } = req;
  const targetId = req.params.id || req.params.userId;

  const isAdmin = ['admin', 'doh_officer'].includes(dbUser?.role);
  const isOwner = dbUser?.id === targetId;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only modify your own resources.',
    });
  }

  next();
};

export { requireRole, requireOwnerOrAdmin };
