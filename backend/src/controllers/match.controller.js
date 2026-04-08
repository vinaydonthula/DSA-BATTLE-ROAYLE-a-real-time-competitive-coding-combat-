const sequelize = require("../config/db");

exports.getMatchById = async (req, res) => {
  const { matchId } = req.params;

  try {
    // 1️⃣ Match + players
    const [[match]] = await sequelize.query(
      `
      SELECT 
        m.id,
        m.difficulty,
        m.status,
        m.problem_id,
        m.player1_hp,
        m.player2_hp,
        m.winner_id,
        u1.id AS p1_id,
        u1.username AS p1_username,
        u1.rating AS p1_rating,
        u2.id AS p2_id,
        u2.username AS p2_username,
        u2.rating AS p2_rating
      FROM matches m
      JOIN users u1 ON u1.id = m.player1_id
      JOIN users u2 ON u2.id = m.player2_id
      WHERE m.id = ?
      `,
      { replacements: [matchId] }
    );

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Check if match is already completed
    if (match.status === 'completed') {
      return res.json({
        id: match.id,
        status: 'completed',
        winnerId: match.winner_id,
        message: 'Match already completed',
      });
    }

    // 2️⃣ Pick problem (if not already assigned)
    let problem;
    if (match.problem_id) {
      const [[existingProblem]] = await sequelize.query(
        `SELECT id, title, description, input_format, output_format, constraints, 
                difficulty, starter_code, time_limit_ms, memory_limit_mb
         FROM problems WHERE id = ?`,
        { replacements: [match.problem_id] }
      );
      problem = existingProblem;
    }

    if (!problem) {
      const [[randomProblem]] = await sequelize.query(
        `
        SELECT id, title, description, input_format, output_format, constraints, 
               difficulty, starter_code, time_limit_ms, memory_limit_mb
        FROM problems
        WHERE difficulty = ?
        ORDER BY RAND()
        LIMIT 1
        `,
        { replacements: [match.difficulty] }
      );
      problem = randomProblem;

      if (!problem) {
        return res.status(500).json({ message: "No problems available for this difficulty" });
      }

      await sequelize.query(
        `UPDATE matches SET problem_id = ? WHERE id = ?`,
        { replacements: [problem.id, matchId] }
      );
    }

    // 3️⃣ Sample test cases (visible to users)
    const [sampleTestCases] = await sequelize.query(
      `
      SELECT input_data AS input, expected_output AS output, explanation
      FROM sample_test_cases
      WHERE problem_id = ?
      `,
      { replacements: [problem.id] }
    );

    // 4️⃣ Hidden test cases (for judging)
    const [hiddenTestCases] = await sequelize.query(
      `
      SELECT input_data AS input, expected_output AS output
      FROM test_cases
      WHERE problem_id = ?
      `,
      { replacements: [problem.id] }
    );

    const currentUserId = req.user.id;

    let p1 = {
          id: match.p1_id,
          username: match.p1_username,
          rating: match.p1_rating,
          hp: match.player1_hp || 100,
        }

    let p2 = {
          id: match.p2_id,
          username: match.p2_username,
          rating: match.p2_rating,
          hp: match.player2_hp || 100,
        }
      
    let players;
    
    if (currentUserId === match.p1_id) {
      players = [p1,p2];
    } else {
      players = [p2,p1];
    }

    // Match duration in seconds (15 minutes = 900 seconds)
    // Note: problem.time_limit_ms is for code execution, not match duration
    const MATCH_DURATION_SECONDS = 900;

    // 5️⃣ Final response
    res.json({
      id: match.id,
      difficulty: match.difficulty,
      timeLimit: MATCH_DURATION_SECONDS,
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      players,
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        inputFormat: problem.input_format,
        outputFormat: problem.output_format,
        constraints: problem.constraints,
        difficulty: problem.difficulty,
        starterCode: problem.starter_code,
        timeLimitMs: problem.time_limit_ms || 1000,
        memoryLimitMb: problem.memory_limit_mb || 256,
        sampleTestCases,
        hiddenTestCases,
      },
    });
  } catch (err) {
    console.error("❌ getMatchById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
