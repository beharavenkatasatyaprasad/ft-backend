const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('relations', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    fname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    lname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    childOf: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isPartnerOf: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    birthdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    photourl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isRoot: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    birthPlace: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'relations',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
