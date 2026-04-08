const sequelize = require('../config/db');

exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        u.id,
        u.username,
        u.rating,
        COALESCE(SUM(mr.result = 'win'), 0) AS wins,
        COALESCE(SUM(mr.result = 'loss'), 0) AS losses,
        COUNT(mr.id) AS totalMatches
      FROM users u
      LEFT JOIN match_results mr ON mr.user_id = u.id
      GROUP BY u.id
      ORDER BY u.rating DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
};