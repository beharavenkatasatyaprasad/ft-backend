var DataTypes = require("sequelize").DataTypes;
var _SequelizeMeta = require("./SequelizeMeta");
var _relations = require("./relations");

function initModels(sequelize) {
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);
  var relations = _relations(sequelize, DataTypes);


  return {
    SequelizeMeta,
    relations,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
