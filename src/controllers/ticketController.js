import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { TicketComment } from '../models/TicketComment.js';

// Create ⇒ CLIENTS and SUPPORT can abrir chamado
export const create = async (req, res) => {
  try {
    if (!['client', 'support'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Only clients and support can open tickets' });
    }

    const { title, description, priority, type } = req.body;
    
    // Validação básica
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Validar type se fornecido
    if (type && !['bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao'].includes(type)) {
      return res.status(400).json({ error: 'Type must be one of: bug, suporte_tecnico, solicitacao, sugestao_implementacao' });
    }
    
    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      type: type || 'suporte_tecnico',
      UserUuid: req.userId,
      CompanyUuid: req.companyId, // Isso pode ser null por enquanto se não tiver company
    });
    
    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Index ⇒ cliente vê só da empresa, suporte vê todos (com filtro opcional por empresa)
export const index = async (req, res) => {
  try {
    const { companyId, status, priority, type, page = 1, limit = 10 } = req.query;
    
    // Converter page e limit para números
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    // Validação de paginação
    if (pageNumber < 1) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
    
    // Calcular offset
    const offset = (pageNumber - 1) * limitNumber;
    
    let where = {};
    
    if (req.userRole === 'support') {
      // Suporte pode ver todos, mas pode filtrar por empresa específica
      if (companyId) {
        where.CompanyUuid = companyId;
      }
      // Filtros adicionais opcionais para suporte
      if (status) {
        where.status = status;
      }
      if (priority) {
        where.priority = priority;
      }
      if (type) {
        where.type = type;
      }
    } else {
      // Cliente vê apenas tickets da própria empresa
      where.CompanyUuid = req.companyId;
      
      // Cliente também pode filtrar por status e prioridade
      if (status) {
        where.status = status;
      }
      if (priority) {
        where.priority = priority;
      }
      if (type) {
        where.type = type;
      }
    }
    
    // Buscar tickets com paginação
    const { count, rows: tickets } = await Ticket.findAndCountAll({ 
      where, 
      order: [['createdAt', 'DESC']],
      limit: limitNumber,
      offset: offset,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['uuid', 'name', 'email']
      }]
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(count / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    
    return res.json({
      tickets,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: count,
        itemsPerPage: limitNumber,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Show single ticket with optional comments
export const show = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeComments } = req.query;
    
    console.log('DEBUG: Searching for ticket ID:', id);
    console.log('DEBUG: Include comments:', includeComments);
    
    let ticket;
    
    if (includeComments === 'true') {
      console.log('DEBUG: Searching WITH comments...');
      // Buscar ticket com comentários
      ticket = await Ticket.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['uuid', 'name', 'email']
          },
          {
            model: TicketComment,
            as: 'comments',
            required: false,
            include: [{
              model: User,
              as: 'author',
              attributes: ['uuid', 'name', 'role']
            }]
          }
        ]
      });
      console.log('DEBUG: Ticket with comments found:', !!ticket);
    } else {
      console.log('DEBUG: Searching WITHOUT comments...');
      // Buscar ticket sem comentários
      ticket = await Ticket.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['uuid', 'name', 'email']
        }]
      });
      console.log('DEBUG: Ticket without comments found:', !!ticket);
    }
    
    if (!ticket) {
      console.log('DEBUG: Ticket NOT FOUND - returning 404');
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verificar permissões: cliente só vê tickets da própria empresa
    if (req.userRole === 'client' && ticket.CompanyUuid !== req.companyId) {
      return res.status(403).json({ error: 'You can only view tickets from your company' });
    }
    
    // Filtrar comentários internos para clientes
    if (includeComments === 'true' && req.userRole === 'client' && ticket.comments) {
      ticket.comments = ticket.comments.filter(comment => !comment.isInternal);
    }
    
    // Ordenar comentários por data se existirem
    if (ticket.comments && ticket.comments.length > 0) {
      ticket.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    console.log('DEBUG: Returning ticket successfully');
    return res.json(ticket);
  } catch (error) {
    console.error('DEBUG: ERROR in show method:', error.message);
    console.error('DEBUG: Stack trace:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// updateStatus ⇒ só SUPORTE pode mudar status
export const updateStatus = async (req, res) => {
  try {
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can update status' });
    }

    const { id } = req.params;
    const { status } = req.body; // 'open' | 'in_progress' | 'closed'

    if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();
    return res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// update ⇒ atualizar campos do ticket (com permissões)
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, type } = req.body;
    
    // Buscar o ticket
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verificar permissões: cliente só vê tickets da própria empresa
    if (req.userRole === 'client' && ticket.CompanyUuid !== req.companyId) {
      return res.status(403).json({ error: 'You can only update tickets from your company' });
    }
    
    // Validações e permissões por campo
    const updates = {};
    
    // Título - Cliente pode editar apenas seus próprios tickets, Suporte pode editar qualquer um
    if (title !== undefined) {
      if (req.userRole === 'client' && ticket.UserUuid !== req.userId) {
        return res.status(403).json({ error: 'Only the ticket creator can update title' });
      }
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      updates.title = title.trim();
    }
    
    // Descrição - Cliente pode editar apenas seus próprios tickets, Suporte pode editar qualquer um
    if (description !== undefined) {
      if (req.userRole === 'client' && ticket.UserUuid !== req.userId) {
        return res.status(403).json({ error: 'Only the ticket creator can update description' });
      }
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ error: 'Description must be a non-empty string' });
      }
      updates.description = description.trim();
    }
    
    // Prioridade - Cliente pode editar apenas seus próprios tickets, Suporte pode editar qualquer um
    if (priority !== undefined) {
      if (req.userRole === 'client' && ticket.UserUuid !== req.userId) {
        return res.status(403).json({ error: 'Only the ticket creator can update priority' });
      }
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Priority must be low, medium, or high' });
      }
      updates.priority = priority;
    }
    
    // Status - Apenas suporte pode alterar status
    if (status !== undefined) {
      if (req.userRole !== 'support') {
        return res.status(403).json({ error: 'Only support can update status' });
      }
      if (!['open', 'in_progress', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be open, in_progress, or closed' });
      }
      updates.status = status;
    }
    
    // Tipo - Cliente pode editar apenas seus próprios tickets, Suporte pode editar qualquer um
    if (type !== undefined) {
      if (req.userRole === 'client' && ticket.UserUuid !== req.userId) {
        return res.status(403).json({ error: 'Only the ticket creator can update type' });
      }
      if (!['bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao'].includes(type)) {
        return res.status(400).json({ error: 'Type must be one of: bug, suporte_tecnico, solicitacao, sugestao_implementacao' });
      }
      updates.type = type;
    }
    
    // Se não há atualizações válidas
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    
    // Aplicar atualizações
    Object.assign(ticket, updates);
    await ticket.save();
    
    // Retornar ticket atualizado com creator
    const updatedTicket = await Ticket.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['uuid', 'name', 'email']
      }]
    });
    
    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};