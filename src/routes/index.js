import { Router } from 'express';
import authRoutes   from './authRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import companyRoutes from './companyRoutes.js';
import ticketCommentRoutes from './ticketCommentRoutes.js';

const routes = Router();
routes.use('/auth',   authRoutes);
routes.use('/tickets', ticketRoutes);
routes.use('/tickets', ticketCommentRoutes); // Rotas de comentários: /api/v1/tickets/:ticketId/comments
routes.use('/companies', companyRoutes);
export default routes;