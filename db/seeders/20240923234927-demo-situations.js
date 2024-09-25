'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //Cadastrar o registro na tabela "situations"
    return queryInterface.bulkInsert('Situations', [
      {
        nameSituation:"Ativo",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nameSituation:"Inativo",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nameSituation:"Spam",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nameSituation:"Aguardando Confirmação",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    
    
  }
};
