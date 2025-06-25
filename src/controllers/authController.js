import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js'; // Ajuste o caminho se necessário

const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validação básica dos campos
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Usar o método checkPassword do modelo ou comparar com password_hash
    const valid = user.checkPassword ? 
      user.checkPassword(password) : 
      await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }    // Usar uuid como id, já que é a chave primária
    const token = jwt.sign({ 
      id: user.uuid, 
      email: user.email, 
      role: user.role,
      companyId: user.CompanyUuid // Incluir companyId no token
    }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.uuid, 
        email: user.email, 
        name: user.name,
        role: user.role,
        companyId: user.CompanyUuid
      } 
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Validação básica dos campos
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Validar role se fornecido
    if (role && !['client', 'support'].includes(role)) {
      return res.status(400).json({ message: 'Role deve ser "client" ou "support"' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar usuário - o hook beforeSave vai cuidar do hash da senha
    const user = await User.create({ 
      name, 
      email, 
      password,
      role: role || 'client' // Default é client se não especificado
    });
    
    res.status(201).json({ 
      id: user.uuid, 
      email: user.email, 
      name: user.name,
      role: user.role
    });  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
};