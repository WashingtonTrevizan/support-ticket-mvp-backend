import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';

// Create ⇒ only CLIENTS can abrir chamado
export const create = async (req, res) => {
  try {
    if (req.userRole !== 'client') {
      return res.status(403).json({ error: 'Only clients can open tickets' });
    }

    const { title, description, priority } = req.body;
    
    // Validação básica
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      UserUuid: req.userId,
      CompanyUuid: req.companyId, // Isso pode ser null por enquanto se não tiver company
    });
    
    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Index ⇒ cliente vê só da empresa, suporte vê todos
export const index = async (req, res) => {  try {
    const where = req.userRole === 'support' ? {} : { CompanyUuid: req.companyId };
    const tickets = await Ticket.findAll({ 
      where, 
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['uuid', 'name', 'email']
      }]
    });
    return res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
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