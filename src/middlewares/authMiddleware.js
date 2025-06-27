import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';

const authMiddleware = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('JWT_SECRET:', JWT_SECRET);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No auth header');
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token in header');
    return res.status(401).json({ message: 'Token inválido' });
  }
  
  console.log('Token received:', token.substring(0, 50) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.companyId = decoded.companyId; // Incluir companyId do token
    next();
  } catch (err) {
    console.log('Error decoding token:', err);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

export default authMiddleware;