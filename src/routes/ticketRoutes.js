import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { allow } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

// Rota de DEBUG (remover em produção)
router.get('/debug', ticketController.debug);

// Rota de TESTE para filtros de status (remover em produção)
router.get('/test-status', ticketController.testStatusFilter);

// CLIENT e SUPPORT podem abrir chamado - TEMP: sem middleware allow para teste
router.post('/', ticketController.create);

// Todos autenticados podem listar (filtragem dentro do controller)
router.get('/', ticketController.index);

// SUPORTE pode ver "meus tickets" (tickets atribuídos a ele)
router.get('/my-tickets', ticketController.myTickets);

// SUPORTE pode vincular ticket a um usuário suporte
router.patch('/:id/assign', ticketController.assignToSupport);

// SUPORTE pode desvincular ticket
router.patch('/:id/unassign', ticketController.unassignTicket);

// SUPORTE altera status (rota específica deve vir ANTES da rota genérica)
router.patch('/:id/status', ticketController.updateStatus);

// Atualizar ticket (status, prioridade, título, descrição)
router.patch('/:id', ticketController.update);

// Buscar ticket específico (com comentários opcionais)
router.get('/:id', ticketController.show);

export default router;