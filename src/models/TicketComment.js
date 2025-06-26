import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class TicketComment extends Model {}

TicketComment.init({
  uuid: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  content: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  isInternal: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    comment: 'Comentário interno apenas para suporte'
  },
}, { 
  sequelize, 
  modelName: 'ticketComment',
  tableName: 'ticket_comments'
});
