import { Router } from 'express';
import * as TicketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { allow } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

// CLIENT abre chamado
router.post('/',  allow(['client']), authMiddleware, TicketController.create);

// Todos autenticados podem listar (filtragem dentro do controller)
router.get('/', authMiddleware,  TicketController.index);

// SUPORTE altera status
router.patch('/:id/status', allow(['support']),authMiddleware, TicketController.updateStatus);

export default router;