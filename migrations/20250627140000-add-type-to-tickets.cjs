'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tickets', 'type', {
      type: Sequelize.ENUM('bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao'),
      allowNull: false,
      defaultValue: 'suporte_tecnico'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tickets', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_type";');
  }
};
