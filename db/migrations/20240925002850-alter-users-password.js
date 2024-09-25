'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  return queryInterface.addColumn('Users', 'password',{
    type: Sequelize.DataTypes.STRING,
    after: 'email'
  });
  },

  async down (queryInterface) {
   return queryInterface.removeColumn('Users', 'password');
  }
};
