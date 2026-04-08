const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    xp: DataTypes.INTEGER,
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);


module.exports = User;
