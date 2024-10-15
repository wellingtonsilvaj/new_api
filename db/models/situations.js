'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Situations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Definir as associações
      Situations.hasMany(models.Users, { foreignKey: 'situationId' });
    }
  }
  Situations.init({
    nameSituation: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Situations',
  });
  return Situations;
};