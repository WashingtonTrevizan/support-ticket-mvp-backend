import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token inválido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.companyId = decoded.companyId; // Incluir companyId do token
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

export default authMiddleware;