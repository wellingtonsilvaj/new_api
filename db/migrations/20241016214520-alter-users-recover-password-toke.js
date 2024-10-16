'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'recoverPasswordToken',{
      type: Sequelize.DataTypes.STRING,
      after:'recoverPassword',
    });
  },

  async down (queryInterface) {
    return queryInterface.removeColumn('Users','recoverPasswordToken');
  }
};
