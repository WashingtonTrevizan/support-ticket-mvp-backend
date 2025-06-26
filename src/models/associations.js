// Arquivo para definir todas as associações entre modelos
import { User } from './User.js';
import { Company } from './Company.js';
import { Ticket } from './Ticket.js';
import { TicketComment } from './TicketComment.js';

// Definir todas as associações aqui para evitar dependências circulares
export function initializeAssociations() {
  // User associations
  User.belongsTo(Company, { foreignKey: 'CompanyUuid' });
  Company.hasMany(User, { foreignKey: 'CompanyUuid' });

  // Ticket associations
  Ticket.belongsTo(User, { as: 'creator', foreignKey: 'UserUuid' });
  Ticket.belongsTo(Company, { foreignKey: 'CompanyUuid' });
  Company.hasMany(Ticket, { foreignKey: 'CompanyUuid' });

  // TicketComment associations
  TicketComment.belongsTo(Ticket, { foreignKey: 'TicketUuid' });
  TicketComment.belongsTo(User, { as: 'author', foreignKey: 'UserUuid' });
  
  // Associações inversas
  Ticket.hasMany(TicketComment, { foreignKey: 'TicketUuid', as: 'comments' });
  User.hasMany(TicketComment, { foreignKey: 'UserUuid', as: 'comments' });
}
