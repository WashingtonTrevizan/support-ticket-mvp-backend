import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Ticket extends Model {}
Ticket.init({
  uuid:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  priority:    { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  status:      { type: DataTypes.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
}, { sequelize, modelName: 'ticket' });
