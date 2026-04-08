const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

exports.createMatch = async (player1Id, player2Id, difficulty) => {
  const result = await sequelize.query(
    `
    INSERT INTO matches
    (player1_id, player2_id, difficulty, status, started_at, player1_hp, player2_hp)
    VALUES (?, ?, ?, 'active', NOW(), 100, 100)
    `,
    {
      replacements: [player1Id, player2Id, difficulty],
      type: QueryTypes.INSERT,
    }
  );

  // Sequelize returns [insertId, affectedRows]
  return result[0];
};
