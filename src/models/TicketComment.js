import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Ticket } from './Ticket.js';
import { User } from './User.js';

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

// Relacionamentos
TicketComment.belongsTo(Ticket, { foreignKey: 'TicketUuid' });
TicketComment.belongsTo(User, { as: 'author', foreignKey: 'UserUuid' });

// Relacionamentos inversos (definidos no modelo respectivo)
// Ticket.hasMany(TicketComment) - será adicionado no Ticket.js
// User.hasMany(TicketComment) - será adicionado no User.js se necessário
