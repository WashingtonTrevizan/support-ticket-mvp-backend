import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Company extends Model {}
Company.init({
  name:       { type: DataTypes.STRING, allowNull: false },
  cnpj:       { type: DataTypes.STRING },
}, { sequelize, modelName: 'company' });

// User.js
import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Company } from './Company.js';

export class User extends Model {
  checkPassword(password) { return bcrypt.compareSync(password, this.password_hash); }
}
User.init({
  name:        { type: DataTypes.STRING, allowNull: false },
  email:       { type: DataTypes.STRING, unique: true, allowNull: false },
  role:        { type: DataTypes.ENUM('client', 'support'), defaultValue: 'client' },
  password:    { type: DataTypes.VIRTUAL },
  password_hash:{ type: DataTypes.STRING },
}, { hooks: {
  beforeSave: async user => { if (user.password) user.password_hash = await bcrypt.hash(user.password, 10); },
}, sequelize, modelName: 'user' });
User.belongsTo(Company); Company.hasMany(User);

// Ticket.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Company } from './Company.js';
import { User }    from './User.js';

export class Ticket extends Model {}
Ticket.init({
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  priority:    { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  status:      { type: DataTypes.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
}, { sequelize, modelName: 'ticket' });
Ticket.belongsTo(User,   { as: 'creator' });
Ticket.belongsTo(Company); Company.hasMany(Ticket);

// TicketComment.js – omitted for brevity