export const allow = roles => (req, res, next) => {
  if (!roles.includes(req.userRole)) return res.status(403).json({ error: 'Forbidden' });
  return next();
};