import { TicketComment } from '../models/TicketComment.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';

// Create comment - qualquer usuário autenticado pode comentar
export const create = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal = false } = req.body;
    
    // Validação básica
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verificar se o ticket existe
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verificar permissões: cliente só vê tickets da própria empresa
    if (req.userRole === 'client' && ticket.CompanyUuid !== req.companyId) {
      return res.status(403).json({ error: 'You can only comment on tickets from your company' });
    }

    // Apenas suporte pode criar comentários internos
    const commentIsInternal = req.userRole === 'support' ? isInternal : false;

    const comment = await TicketComment.create({
      content: content.trim(),
      isInternal: commentIsInternal,
      TicketUuid: ticketId,
      UserUuid: req.userId,
    });

    // Buscar o comentário com o autor incluído para retornar
    const commentWithAuthor = await TicketComment.findByPk(comment.uuid, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['uuid', 'name', 'role']
      }]
    });
    
    return res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// List comments of a ticket
export const index = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Verificar se o ticket existe
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verificar permissões: cliente só vê tickets da própria empresa
    if (req.userRole === 'client' && ticket.CompanyUuid !== req.companyId) {
      return res.status(403).json({ error: 'You can only view comments from tickets of your company' });
    }

    // Filtrar comentários baseado no role
    const whereClause = {
      TicketUuid: ticketId,
    };

    // Cliente não vê comentários internos
    if (req.userRole === 'client') {
      whereClause.isInternal = false;
    }

    const comments = await TicketComment.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']], // Ordem cronológica
      include: [{
        model: User,
        as: 'author',
        attributes: ['uuid', 'name', 'role']
      }]
    });
    
    return res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update comment - apenas autor ou suporte pode editar
export const update = async (req, res) => {
  try {
    const { ticketId, commentId } = req.params;
    const { content } = req.body;
    
    // Validação básica
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Buscar comentário
    const comment = await TicketComment.findOne({
      where: {
        uuid: commentId,
        TicketUuid: ticketId
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['uuid', 'name', 'role']
      }]
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verificar permissões: apenas autor ou suporte pode editar
    if (req.userRole !== 'support' && comment.UserUuid !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    // Atualizar comentário
    comment.content = content.trim();
    await comment.save();
    
    return res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete comment - apenas autor ou suporte pode deletar
export const destroy = async (req, res) => {
  try {
    const { ticketId, commentId } = req.params;
    
    // Buscar comentário
    const comment = await TicketComment.findOne({
      where: {
        uuid: commentId,
        TicketUuid: ticketId
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verificar permissões: apenas autor ou suporte pode deletar
    if (req.userRole !== 'support' && comment.UserUuid !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await comment.destroy();
    
    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
