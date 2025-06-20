import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Company extends Model {}
Company.init({
  uuid:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:       { type: DataTypes.STRING, allowNull: false },
  cnpj:       { type: DataTypes.STRING },
}, { sequelize, modelName: 'company' });
