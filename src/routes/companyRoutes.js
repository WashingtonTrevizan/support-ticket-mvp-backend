import { Router } from 'express';
import * as CompanyController from '../controllers/companyController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { allow } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authMiddleware);

// Criar empresa (apenas support)
router.post('/', allow(['support']), CompanyController.create);

// Listar empresas (apenas support)
router.get('/', allow(['support']), CompanyController.index);

// Ver empresa específica (support vê qualquer, client vê só a própria)
router.get('/:id', CompanyController.show);

// Atualizar empresa (apenas support)
router.put('/:id', allow(['support']), CompanyController.update);

// Deletar empresa (apenas support)
router.delete('/:id', allow(['support']), CompanyController.destroy);

// Atribuir usuário a empresa (apenas support)
router.post('/:id/assign-user', allow(['support']), CompanyController.assignUser);

export default router;
