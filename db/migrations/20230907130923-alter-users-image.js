'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'image',{
      type: Sequelize.DataTypes.STRING,
      after: 'password',
    });
  },

  async down (queryInterface) {
    return queryInterface.removeColumn('Users', 'image');
  }
};
