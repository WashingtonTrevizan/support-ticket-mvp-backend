import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Company } from './Company.js';

export class User extends Model {
  checkPassword(password) { return bcrypt.compareSync(password, this.password_hash); }
}
User.init({
  uuid:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  email:       { type: DataTypes.STRING, unique: true, allowNull: false },
  role:        { type: DataTypes.ENUM('client', 'support'), defaultValue: 'client' },
  password:    { type: DataTypes.VIRTUAL },
  password_hash:{ type: DataTypes.STRING },
}, { hooks: {
  beforeSave: async user => { if (user.password) user.password_hash = await bcrypt.hash(user.password, 10); },
}, sequelize, modelName: 'user' });
User.belongsTo(Company, { foreignKey: 'CompanyUuid' }); 
Company.hasMany(User, { foreignKey: 'CompanyUuid' });
