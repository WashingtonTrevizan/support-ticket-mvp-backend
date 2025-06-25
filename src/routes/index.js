import { Router } from 'express';
import authRoutes   from './authRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import companyRoutes from './companyRoutes.js';

const routes = Router();
routes.use('/auth',   authRoutes);
routes.use('/tickets', ticketRoutes);
routes.use('/companies', companyRoutes);
export default routes;