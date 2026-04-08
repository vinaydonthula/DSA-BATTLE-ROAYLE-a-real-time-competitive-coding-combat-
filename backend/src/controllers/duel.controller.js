const sequelize = require('../config/db');

exports.joinQueue = async (req, res) => {
  const userId = req.user.id;
  const { difficulty } = req.body;

  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ message: 'Invalid difficulty' });
  }

  const t = await sequelize.transaction();

  try {
    /* 1️⃣ Check if user already queued */
    const [existing] = await sequelize.query(
      `SELECT * FROM matchmaking_queue WHERE user_id = ?`,
      { replacements: [userId], transaction: t }
    );

    if (existing.length > 0) {
      await t.rollback();
      return res.json({ status: 'queued' });
    }

    /* 2️⃣ Look for opponent */
    const [opponent] = await sequelize.query(
      `
      SELECT * FROM matchmaking_queue
      WHERE difficulty = ?
        AND user_id != ?
      ORDER BY joined_at ASC
      LIMIT 1
      `,
      { replacements: [difficulty, userId], transaction: t }
    );

    if (opponent.length === 0) {
      /* 3️⃣ No opponent → join queue */
      await sequelize.query(
        `
        INSERT INTO matchmaking_queue (user_id, difficulty)
        VALUES (?, ?)
        `,
        { replacements: [userId, difficulty], transaction: t }
      );

      await t.commit();
      return res.json({ status: 'queued' });
    }

    /* 4️⃣ Opponent found → create match */
    const opponentId = opponent[0].user_id;

    const [result] = await sequelize.query(
      `
      INSERT INTO matches
      (player1_id, player2_id, difficulty, status)
      VALUES (?, ?, ?, 'active')
      `,
      { replacements: [opponentId, userId, difficulty], transaction: t }
    );

    const matchId = result.insertId;

    /* 5️⃣ Remove both from queue */
    await sequelize.query(
      `
      DELETE FROM matchmaking_queue
      WHERE user_id IN (?, ?)
      `,
      { replacements: [userId, opponentId], transaction: t }
    );

    await t.commit();

    return res.json({
      status: 'matched',
      matchId,
    });
  } catch (err) {
    await t.rollback();
    console.error('Matchmaking error:', err);
    res.status(500).json({ message: 'Matchmaking failed' });
  }
};
