const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

const activeContests = new Map();
const zoneDamageIntervals = new Map();

async function createContest({ createdBy, durationMinutes = 15, problemId }) {
  const roomCode = generateRoomCode();
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const [result] = await sequelize.query(
    `
    INSERT INTO contests (room_code, created_by, status, start_time, end_time, problem_id)
    VALUES (?, ?, 'waiting', ?, ?, ?)
    `,
    {
      replacements: [roomCode, createdBy, startTime, endTime, problemId],
      type: QueryTypes.INSERT,
    }
  );

  return result[0];
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function startContest(contestId, io) {
  const startTime = new Date();
  
  await sequelize.query(
    `UPDATE contests SET status = 'active', start_time = ? WHERE id = ?`,
    { replacements: [startTime, contestId] }
  );

  const [contest] = await sequelize.query(
    `SELECT * FROM contests WHERE id = ?`,
    { replacements: [contestId] }
  );

  const players = await getContestParticipants(contestId);

  const contestState = {
    contestId,
    startTime,
    endTime: new Date(contest[0].end_time),
    players: {},
    ended: false,
  };

  for (const player of players) {
    contestState.players[player.user_id] = {
      playerId: player.user_id,
      health: 100,
      rating: player.rating || 0,
      solved: false,
      isAlive: true,
      solveTime: null,
      testCasesPassed: 0,
      ratingUpdated: false,
    };
  }

  activeContests.set(contestId, contestState);

  startZoneDamage(contestId, io);

  return contestState;
}

function startZoneDamage(contestId, io) {
  const interval = setInterval(async () => {
    const contest = activeContests.get(contestId);
    if (!contest || contest.ended) {
      clearInterval(interval);
      zoneDamageIntervals.delete(contestId);
      return;
    }

    const now = new Date();
    if (now >= contest.endTime) {
      await endContest(contestId, io);
      return;
    }

    let playerEliminated = false;

    for (const [playerId, player] of Object.entries(contest.players)) {
      if (player.isAlive && !player.solved) {
        player.health -= 5;
        if (player.health <= 0) {
          player.health = 0;
          player.isAlive = false;
          playerEliminated = true;

          io.to(`contest_${contestId}`).emit("player_eliminated", {
            contestId,
            playerId: parseInt(playerId),
            reason: "zone_damage",
            remainingHealth: 0,
          });

          io.to(`user_${playerId}`).emit("defeat_popup", {
            reason: "zone_damage",
            ratingChange: 0,
          });
        }
      }
    }

    io.to(`contest_${contestId}`).emit("zone_damage", {
      contestId,
      damage: 5,
      players: contest.players,
    });

    if (await shouldEndContest(contestId)) {
      await endContest(contestId, io);
    }
  }, 3 * 60 * 1000);

  zoneDamageIntervals.set(contestId, interval);
}

async function getContestParticipants(contestId) {
  const [participants] = await sequelize.query(
    `
    SELECT cp.*, u.rating
    FROM contest_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.contest_id = ?
    `,
    { replacements: [contestId] }
  );
  return participants;
}

async function getContestState(contestId) {
  if (activeContests.has(contestId)) {
    return activeContests.get(contestId);
  }

  const [contest] = await sequelize.query(
    `SELECT * FROM contests WHERE id = ?`,
    { replacements: [contestId] }
  );

  if (!contest[0] || contest[0].status !== 'active') {
    return null;
  }

  const players = await getContestParticipants(contestId);
  const contestState = {
    contestId,
    startTime: new Date(contest[0].start_time),
    endTime: new Date(contest[0].end_time),
    players: {},
    ended: false,
  };

  for (const player of players) {
    contestState.players[player.user_id] = {
      playerId: player.user_id,
      health: player.health || 100,
      rating: player.rating || 0,
      solved: player.solved || false,
      isAlive: player.health > 0,
      solveTime: player.solve_time,
      testCasesPassed: player.test_cases_passed || 0,
      ratingUpdated: player.rating_updated || false,
    };
  }

  activeContests.set(contestId, contestState);
  return contestState;
}

async function validateSubmission(contestId, playerId) {
  // First get in-memory state
  let contest = activeContests.get(contestId);
  
  // If not in memory, try to get from DB
  if (!contest) {
    contest = await getContestState(contestId);
  }
  
  if (!contest) {
    return { valid: false, reason: "contest_not_found" };
  }

  if (contest.ended) {
    return { valid: false, reason: "contest_ended" };
  }

  let player = contest.players[playerId];
  
  // If player not in memory state, check DB directly
  if (!player) {
    const [participant] = await sequelize.query(
      `SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?`,
      { replacements: [contestId, playerId] }
    );
    
    if (!participant[0]) {
      return { valid: false, reason: "not_participant" };
    }
    
    // Create player object from DB
    player = {
      playerId: participant[0].user_id,
      health: participant[0].health || 100,
      rating: participant[0].rating || 0,
      solved: participant[0].solved || false,
      isAlive: participant[0].is_alive || false,
      solveTime: participant[0].solve_time,
      testCasesPassed: participant[0].test_cases_passed || 0,
      ratingUpdated: participant[0].rating_updated || false,
    };
    
    // Update in-memory state
    contest.players[playerId] = player;
  }

  // Check if player is alive (from DB to avoid stale state)
  const [dbParticipant] = await sequelize.query(
    `SELECT solved, is_alive, health FROM contest_participants WHERE contest_id = ? AND user_id = ?`,
    { replacements: [contestId, playerId] }
  );
  
  if (dbParticipant[0]) {
    // Use DB state to prevent stale in-memory state issues
    if (!dbParticipant[0].is_alive) {
      return { valid: false, reason: "eliminated" };
    }
    
    if (dbParticipant[0].solved) {
      return { valid: false, reason: "already_solved" };
    }
    
    // Update in-memory health from DB
    player.health = dbParticipant[0].health;
    player.isAlive = dbParticipant[0].is_alive;
    player.solved = dbParticipant[0].solved;
  }

  if (!player.isAlive) {
    return { valid: false, reason: "eliminated" };
  }

  if (player.solved) {
    return { valid: false, reason: "already_solved" };
  }

  const now = new Date();
  if (now >= contest.endTime) {
    return { valid: false, reason: "time_up" };
  }

  return { valid: true, contest, player };
}

async function handleWrongSubmission(contestId, playerId, io) {
  const result = await validateSubmission(contestId, playerId);
  if (!result.valid) {
    return result;
  }

  const { player, contest } = result;

  player.health -= 10;
  if (player.health <= 0) {
    player.health = 0;
    player.isAlive = false;

    io.to(`contest_${contestId}`).emit("player_eliminated", {
      contestId,
      playerId,
      reason: "wrong_submission",
      remainingHealth: 0,
    });

    io.to(`user_${playerId}`).emit("defeat_popup", {
      reason: "wrong_submission",
      remainingHealth: 0,
      ratingChange: 0,
    });
  } else {
    io.to(`user_${playerId}`).emit("health_update", {
      playerId,
      health: player.health,
    });

    io.to(`contest_${contestId}`).emit("player_damaged", {
      contestId,
      playerId,
      damage: 10,
      remainingHealth: player.health,
    });
  }

  await savePlayerState(contestId, playerId, player);

  if (await shouldEndContest(contestId)) {
    await endContest(contestId, io);
  }

  return { valid: true, player };
}

async function handleRuntimeError(contestId, playerId, io) {
  return handleWrongSubmission(contestId, playerId, io);
}

async function handleCompilationError(contestId, playerId, io) {
  return handleWrongSubmission(contestId, playerId, io);
}

async function handleTLE(contestId, playerId, io) {
  return handleWrongSubmission(contestId, playerId, io);
}

async function handleCorrectSubmission(contestId, playerId, testCasesPassed, totalTestCases, io, validatedData = null) {
  console.log(`🏆 handleCorrectSubmission called for contest ${contestId}, player ${playerId}`);
  
  let result;
  let player;
  let contest;
  
  // Use pre-validated data if provided, otherwise validate
  if (validatedData) {
    player = validatedData.player;
    contest = validatedData.contest;
    result = { valid: true, player, contest };
  } else {
    result = await validateSubmission(contestId, playerId);
  }
  
  console.log(`🏆 Validation result:`, result);
  
  if (!result.valid) {
    console.log(`🏆 Validation failed for player ${playerId}:`, result.reason);
    return result;
  }

  player = result.player;
  contest = result.contest;
  
  const now = new Date();

  if (now > contest.endTime) {
    return { valid: false, reason: "time_up" };
  }

  // Mark player as solved - this must be done BEFORE emitting victory popup
  // to prevent any race conditions with further submissions
  player.solved = true;
  player.solveTime = now;
  player.testCasesPassed = testCasesPassed;

  const Tmax = (contest.endTime - contest.startTime) / 1000;
  const Tcurrent = (now - contest.startTime) / 1000;
  const Hremaining = player.health;

  let timeScore = 100 * (1 - (Tcurrent / Tmax));
  if (timeScore < 0) timeScore = 0;

  const healthScore = Hremaining;
  const ratingGain = Math.floor((0.6 * timeScore) + (0.4 * healthScore));

  console.log(`🏆 Rating calculation: Tmax=${Tmax}, Tcurrent=${Tcurrent}, Hremaining=${Hremaining}`);
  console.log(`🏆 timeScore=${timeScore}, healthScore=${healthScore}, ratingGain=${ratingGain}`);

  player.rating += ratingGain;

  await sequelize.query(
    `UPDATE users SET rating = rating + ? WHERE id = ?`,
    { replacements: [ratingGain, playerId] }
  );

  player.ratingUpdated = true;

  // Save player state FIRST to ensure they can't submit again
  await savePlayerState(contestId, playerId, player);

  // Emit victory popup IMMEDIATELY to the winning player
  console.log(`🏆 Emitting victory_popup to user_${playerId} (socket userId: ${playerId})`);
  io.to(`user_${playerId}`).emit("victory_popup", {
    reason: "solved",
    ratingGain,
    solveTime: player.solveTime,
    healthRemaining: player.health,
  });

  // Notify the contest room that this player solved
  console.log(`🏆 Emitting player_solved to contest_${contestId}`);
  io.to(`contest_${contestId}`).emit("player_solved", {
    contestId,
    playerId,
    solveTime: player.solveTime,
    ratingGain,
  });

  // Check if contest should end (all solved, only 1 alive, or time up)
  if (await shouldEndContest(contestId)) {
    console.log(`🏆 Contest ${contestId} ending after player ${playerId} solved`);
    await endContest(contestId, io);
  }

  return { valid: true, player, ratingGain };
}

async function savePlayerState(contestId, playerId, playerState) {
  await sequelize.query(
    `
    UPDATE contest_participants 
    SET health = ?, solved = ?, is_alive = ?, solve_time = ?, 
        test_cases_passed = ?, rating_updated = ?
    WHERE contest_id = ? AND user_id = ?
    `,
    {
      replacements: [
        playerState.health,
        playerState.solved ? 1 : 0,
        playerState.isAlive ? 1 : 0,
        playerState.solveTime,
        playerState.testCasesPassed,
        playerState.ratingUpdated ? 1 : 0,
        contestId,
        playerId,
      ],
    }
  );
}

async function shouldEndContest(contestId) {
  const contest = activeContests.get(contestId);
  if (!contest || contest.ended) return true;

  const now = new Date();
  if (now >= contest.endTime) return true;

  const alivePlayers = Object.values(contest.players).filter(p => p.isAlive);
  const solvedPlayers = Object.values(contest.players).filter(p => p.solved);
  const eliminatedPlayers = Object.values(contest.players).filter(p => !p.isAlive);

  // End if all players solved
  if (solvedPlayers.length === Object.keys(contest.players).length) return true;
  
  // End if only 1 player is alive (everyone else eliminated)
  if (alivePlayers.length <= 1) return true;
  
  // End if all players eliminated
  if (eliminatedPlayers.length === Object.keys(contest.players).length) return true;

  return false;
}

async function endContest(contestId, io) {
  const contest = activeContests.get(contestId);
  if (!contest) return;

  contest.ended = true;

  if (zoneDamageIntervals.has(contestId)) {
    clearInterval(zoneDamageIntervals.get(contestId));
    zoneDamageIntervals.delete(contestId);
  }

  await sequelize.query(
    `UPDATE contests SET status = 'completed' WHERE id = ?`,
    { replacements: [contestId] }
  );

  const [contestData] = await sequelize.query(
    `SELECT problem_id FROM contests WHERE id = ?`,
    { replacements: [contestId] }
  );

  const [testCases] = await sequelize.query(
    `SELECT COUNT(*) as total FROM test_cases WHERE problem_id = ?`,
    { replacements: [contestData[0]?.problem_id] }
  );
  const totalTestCases = testCases[0]?.total || 0;

  for (const [playerId, player] of Object.entries(contest.players)) {
    if (!player.solved && player.isAlive) {
      if (player.testCasesPassed > 0 && totalTestCases > 0) {
        const partialScore = (player.testCasesPassed / totalTestCases) * 50;
        const ratingGain = Math.floor(partialScore);

        player.rating += ratingGain;
        player.ratingUpdated = true;

        await sequelize.query(
          `UPDATE users SET rating = rating + ? WHERE id = ?`,
          { replacements: [ratingGain, playerId] }
        );

        io.to(`user_${playerId}`).emit("defeat_popup", {
          reason: "time_up_partial",
          ratingChange: ratingGain,
          testCasesPassed: player.testCasesPassed,
          totalTestCases,
        });
      } else {
        io.to(`user_${playerId}`).emit("defeat_popup", {
          reason: "time_up",
          ratingChange: 0,
        });
      }
    }

    await savePlayerState(contestId, parseInt(playerId), player);
  }

  io.to(`contest_${contestId}`).emit("contest_ended", {
    contestId,
    finalState: contest.players,
  });
}

function getActiveContests() {
  return activeContests;
}

function getContest(contestId) {
  return activeContests.get(contestId);
}

module.exports = {
  createContest,
  startContest,
  validateSubmission,
  handleWrongSubmission,
  handleRuntimeError,
  handleCompilationError,
  handleTLE,
  handleCorrectSubmission,
  endContest,
  getActiveContests,
  getContest,
  getContestState,
  shouldEndContest,
};
