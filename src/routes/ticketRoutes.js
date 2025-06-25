import { Router } from 'express';
import * as TicketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { allow } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

// CLIENT abre chamado
router.post('/', allow(['client']), TicketController.create);

// Todos autenticados podem listar (filtragem dentro do controller)
router.get('/', TicketController.index);

// Buscar ticket específico (com comentários opcionais)
router.get('/:id', TicketController.show);

// SUPORTE altera status
router.patch('/:id/status', allow(['support']), TicketController.updateStatus);

export default router;