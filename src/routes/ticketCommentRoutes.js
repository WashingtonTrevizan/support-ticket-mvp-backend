import { Router } from 'express';
import * as TicketCommentController from '../controllers/ticketCommentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de comentários requerem autenticação
router.use(authMiddleware);

// Criar comentário em um ticket
router.post('/:ticketId/comments', TicketCommentController.create);

// Listar comentários de um ticket
router.get('/:ticketId/comments', TicketCommentController.index);

// Atualizar um comentário específico
router.put('/:ticketId/comments/:commentId', TicketCommentController.update);

// Deletar um comentário específico
router.delete('/:ticketId/comments/:commentId', TicketCommentController.destroy);

export default router;
