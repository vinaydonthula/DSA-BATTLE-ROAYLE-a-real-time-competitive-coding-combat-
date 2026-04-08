const sequelize = require("../config/db");

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    /* =========================
       1️⃣ BASIC USER INFO
    ========================= */
    const [[user]] = await sequelize.query(
      `SELECT rating FROM users WHERE id = ?`,
      { replacements: [userId] }
    );

    /* =========================
       2️⃣ MATCH RESULTS
    ========================= */
    const [results] = await sequelize.query(
      `
      SELECT
        mr.result,
        mr.rating_change,
        mr.created_at,
        u.username AS opponent
      FROM match_results mr
      JOIN matches m ON m.id = mr.match_id
      JOIN users u 
        ON u.id = CASE 
          WHEN m.player1_id = mr.user_id THEN m.player2_id
          ELSE m.player1_id
        END
      WHERE mr.user_id = ?
      ORDER BY mr.created_at ASC
      `,
      { replacements: [userId] }
    );

    /* =========================
       3️⃣ BUILD RATING HISTORY
    ========================= */
    let runningRating = 1200; // base rating
    const ratingHistory = [];

    for (const row of results) {
      runningRating += row.rating_change;
      ratingHistory.push({
        date: row.created_at,
        rating: runningRating,
      });
    }

    /* =========================
       4️⃣ PROBLEMS SOLVED COUNTS
    ========================= */
    const [solvedCounts] = await sequelize.query(
      `
      SELECT 
        p.difficulty, 
        COUNT(DISTINCT p.id) as count
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.user_id = ? AND s.verdict = 'AC'
      GROUP BY p.difficulty
      `,
      { replacements: [userId] }
    );

    const problemsSolved = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    solvedCounts.forEach(row => {
      const difficulty = (row.difficulty || "").toLowerCase();
      if (problemsSolved.hasOwnProperty(difficulty)) {
        problemsSolved[difficulty] = row.count;
      }
    });

    /* =========================
       5️⃣ AGGREGATES
    ========================= */
    const totalMatches = results.length;
    const wins = results.filter(r => r.result === "win").length;
    const winRate =
      totalMatches === 0 ? 0 : Math.round((wins / totalMatches) * 100);

    /* =========================
       6️⃣ RECENT MATCHES
    ========================= */
    const recentMatches = results
      .slice(-5)
      .reverse()
      .map(r => ({
        date: r.created_at,
        opponent: r.opponent,
        result: r.result,
        rating:
          r.rating_change >= 0
            ? `+${r.rating_change}`
            : `${r.rating_change}`,
      }));

    /* =========================
       7️⃣ RESPONSE
    ========================= */
    res.json({
      totalMatches,
      wins,
      winRate,
      rating: user.rating,
      ratingHistory,
      recentMatches,
      problemsSolved,
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
