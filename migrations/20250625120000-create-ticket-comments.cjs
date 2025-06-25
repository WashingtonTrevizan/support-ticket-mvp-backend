'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ticket_comments', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isInternal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Comentário interno apenas para suporte'
      },
      ticketUuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'uuid',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userUuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Índices para melhor performance
    await queryInterface.addIndex('ticket_comments', ['ticketUuid']);
    await queryInterface.addIndex('ticket_comments', ['userUuid']);
    await queryInterface.addIndex('ticket_comments', ['createdAt']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ticket_comments');
  }
};
