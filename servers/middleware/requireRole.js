// middleware/requireRole.js
module.exports = function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const user = req.user; // set by auth middleware after verifying JWT
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
