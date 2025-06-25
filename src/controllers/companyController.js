import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Op } from 'sequelize';

// Create company - apenas support pode criar
export const create = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can create companies' });
    }

    const { name, cnpj } = req.body;
    
    // Validação básica
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Verificar se já existe uma empresa com o mesmo CNPJ (se fornecido)
    if (cnpj) {
      const existingCompany = await Company.findOne({ where: { cnpj } });
      if (existingCompany) {
        return res.status(400).json({ error: 'Company with this CNPJ already exists' });
      }
    }

    const company = await Company.create({
      name,
      cnpj: cnpj || null
    });
    
    return res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// List all companies - apenas support pode listar
export const index = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can list companies' });
    }

    const companies = await Company.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['uuid', 'name', 'email', 'role']
      }]
    });
    
    return res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get company by ID
export const show = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Support pode ver qualquer empresa, client só pode ver a própria
    if (req.userRole === 'client' && req.companyId !== id) {
      return res.status(403).json({ error: 'You can only view your own company' });
    }

    const company = await Company.findByPk(id, {
      include: [{
        model: User,
        attributes: ['uuid', 'name', 'email', 'role']
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update company - apenas support pode atualizar
export const update = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can update companies' });
    }

    const { id } = req.params;
    const { name, cnpj } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }    // Verificar se CNPJ já existe em outra empresa
    if (cnpj && cnpj !== company.cnpj) {
      const existingCompany = await Company.findOne({ 
        where: { 
          cnpj, 
          uuid: { [Op.ne]: id } 
        }
      });
      if (existingCompany) {
        return res.status(400).json({ error: 'Company with this CNPJ already exists' });
      }
    }

    if (name) company.name = name;
    if (cnpj !== undefined) company.cnpj = cnpj;

    await company.save();
    return res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete company - apenas support pode deletar
export const destroy = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can delete companies' });
    }

    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Verificar se há usuários associados
    const usersCount = await User.count({ where: { CompanyUuid: id } });
    if (usersCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete company. ${usersCount} users are still associated with this company.` 
      });
    }

    await company.destroy();
    return res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign user to company - apenas support pode fazer
export const assignUser = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can assign users to companies' });
    }    const { id } = req.params; // company id
    
    // Debug: Verificar o que está chegando no req.body
    console.log('req.body:', req.body);
    console.log('req.params:', req.params);
    
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required',
        message: 'Envie o userId no corpo da requisição',
        example: { userId: 'uuid-do-usuario' },
        receivedBody: req.body
      });
    }

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.CompanyUuid = id;
    await user.save();

    return res.json({ 
      message: 'User assigned to company successfully',
      user: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        companyId: user.CompanyUuid
      }
    });
  } catch (error) {
    console.error('Error assigning user to company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
