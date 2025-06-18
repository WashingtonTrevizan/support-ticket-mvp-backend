import jwt from 'jsonwebtoken';
export function authMiddleware(req, res, next) {
  const [, token] = (req.headers.authorization || '').split(' ');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.companyId = decoded.companyId;
    return next();
  } catch (err) { return res.status(401).json({ error: 'Token invalid' }); }
}