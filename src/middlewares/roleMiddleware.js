export const allow = roles => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: `Seu perfil '${req.userRole}' não tem permissão para acessar este recurso. Perfis necessários: ${roles.join(', ')}`,
      requiredRoles: roles,
      userRole: req.userRole
    });
  }
  return next();
};