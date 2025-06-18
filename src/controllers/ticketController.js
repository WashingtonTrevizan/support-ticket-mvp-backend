import { Ticket } from '../models/Ticket.js';

// Create ⇒ only CLIENTS can abrir chamado
export const create = async (req, res) => {
  if (req.userRole !== 'client')
    return res.status(403).json({ error: 'Only clients can open tickets' });

  const ticket = await Ticket.create({
    ...req.body,
    userId:    req.userId,
    companyId: req.companyId,
  });
  return res.status(201).json(ticket);
};

// Index ⇒ cliente vê só da empresa, suporte vê todos
export const index = async (req, res) => {
  const where = req.userRole === 'support' ? {} : { companyId: req.companyId };
  const tickets = await Ticket.findAll({ where, order: [['createdAt', 'DESC']] });
  return res.json(tickets);
};

// updateStatus ⇒ só SUPORTE pode mudar status
export const updateStatus = async (req, res) => {
  if (req.userRole !== 'support')
    return res.status(403).json({ error: 'Only support can update status' });

  const { id } = req.params;
  const { status } = req.body; // 'open' | 'in_progress' | 'closed'

  const ticket = await Ticket.findByPk(id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (status) ticket.status = status;
  await ticket.save();
  return res.json(ticket);
};