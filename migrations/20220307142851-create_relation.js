'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      fname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      childOf: {
        type: Sequelize.INTEGER,
      },
      isPartnerOf: {
        type: Sequelize.INTEGER,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      birthdate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      photourl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isRoot: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('relations');
  },
};
