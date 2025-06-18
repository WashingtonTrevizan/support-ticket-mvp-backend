import { Router } from 'express';
import authRoutes   from './authRoutes.js';
import ticketRoutes from './ticketRoutes.js';

const routes = Router();
routes.use('/auth',   authRoutes);
routes.use('/tickets', ticketRoutes);
export default routes;