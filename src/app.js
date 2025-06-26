import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import './models/User.js';
import './models/Company.js';
import './models/Ticket.js';
import './models/TicketComment.js';
import { initializeAssociations } from './models/associations.js';

dotenv.config();

// Inicializar associações após importar todos os modelos
initializeAssociations();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rota de health‑check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rotas da API
app.use('/api/v1', routes);
app.use('/auth', authRoutes);

// Em DEV, cria/atualiza tabelas automaticamente
if (process.env.NODE_ENV !== 'production') {
  sequelize
    .sync({ alter: true })
    .then(() => console.log('📦 Database synced'))
    .catch(err => console.error('❌ DB sync error:', err));
}

export default app;