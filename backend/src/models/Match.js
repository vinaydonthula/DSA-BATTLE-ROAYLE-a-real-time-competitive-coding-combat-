const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Match = sequelize.define("Match", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  player1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  player2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  difficulty: {
    type: DataTypes.ENUM("easy", "medium", "hard"),
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM("waiting", "active", "completed"),
    defaultValue: "active",
  },

  started_at: {
    type: DataTypes.DATE,
  },

  ended_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "matches",
  timestamps: false,
});

module.exports = Match;
