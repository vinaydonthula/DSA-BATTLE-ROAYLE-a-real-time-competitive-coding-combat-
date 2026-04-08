const { Server } = require("socket.io");
const socketAuth = require("./auth");
const sequelize = require("../config/db");
const { createMatch } = require("../services/match.service");
const { handleSubmission } = require("../services/submission.service");
const { applyDamage } = require("../services/damage.service");
const { calculateElo } = require("../utils/elo");
const battleRoyale = require("../services/battle-royale.service");

const liveMatches = new Map();
const matchProgress = {};
const activeRooms = new Map();
const activeContests = new Map(); // roomCode -> room data

const questions = [
  {
    id: 1,
    title: "Two Sum",
    description: "Find two indices such that nums[i] + nums[j] = target\n\nINPUT:\nnums = [2,7,11,15]\ntarget = 9\n\nOUTPUT:\n0 1",
    inputFormat: "First line: space-separated integers for nums\nSecond line: integer for target",
    outputFormat: "Two space-separated integers representing the indices",
    sampleTestCases: [{ input: "2 7 11 15\n9", output: "0 1" }]
  },
  {
    id: 2,
    title: "Addition of Two Numbers",
    description: "Given two integers A and B, print their sum.\n\nCONSTRAINTS:\n-10^9 ≤ A, B ≤ 10^9\n\nEXAMPLES:\nInput:\n2 3\nOutput:\n5\n\nInput:\n10 20\nOutput:\n30\n\nInput:\n-5 5\nOutput:\n0",
    inputFormat: "Two integers A and B separated by space.",
    outputFormat: "Print a single integer (A + B)",
    sampleTestCases: [{ input: "2 3", output: "5" }]
  }
];
// Track matchmaking intervals per difficulty
const matchmakingIntervals = new Map();

// Matchmaking - works with existing DB schema (difficulty only)
async function tryMatchmaking(io, difficulty) {
  console.log(`🔍 Trying matchmaking for difficulty: ${difficulty}`);
  
  // Get ALL players from queue with same difficulty
  const [players] = await sequelize.query(
    `
    SELECT user_id, joined_at
    FROM matchmaking_queue
    WHERE difficulty = ?
    ORDER BY joined_at ASC
    `,
    { replacements: [difficulty] }
  );

  console.log(`👥 Found ${players.length} players in queue for ${difficulty}`);
  if (players.length > 0) {
    players.forEach(p => {
      console.log(`   - User ${p.user_id} (joined: ${p.joined_at})`);
    });
  }

  // Need exactly 2 DIFFERENT players for a duel
  // Filter out duplicate user_ids (same user in multiple tabs)
  const uniquePlayers = [];
  const seenUserIds = new Set();
  
  for (const player of players) {
    if (!seenUserIds.has(player.user_id)) {
      seenUserIds.add(player.user_id);
      uniquePlayers.push(player);
    }
  }
  
  console.log(`👤 ${uniquePlayers.length} unique players available`);

  if (uniquePlayers.length < 2) {
    console.log(`⏳ Not enough unique players, waiting...`);
    return false; // Return false if no match made
  }
  
  // Take the first 2 unique players
  const playersToMatch = uniquePlayers.slice(0, 2);

  const player1 = playersToMatch[0].user_id;
  const player2 = playersToMatch[1].user_id;

  console.log(`✅ Matching User ${player1} vs User ${player2}`);

  // Remove both from queue
  await sequelize.query(
    `
    DELETE FROM matchmaking_queue
    WHERE user_id IN (?, ?)
    `,
    { replacements: [player1, player2] }
  );

  // Create match
  const matchId = await createMatch(player1, player2, difficulty);

  console.log(`⚔️ Match created: ${matchId} (${player1} vs ${player2})`);

  // Initialize HP
  liveMatches.set(matchId, {
    players: [player1, player2],
    hp: {
      [player1]: 100,
      [player2]: 100,
    },
  });

  // Stop ALL monitors for this difficulty since match is made
  if (matchmakingIntervals.has(difficulty)) {
    clearInterval(matchmakingIntervals.get(difficulty));
    matchmakingIntervals.delete(difficulty);
    console.log(`🛑 Stopped all monitors for ${difficulty} - match created`);
  }

  // Emit to both users - with logging
  const room1 = `user_${player1}`;
  const room2 = `user_${player2}`;
  
  console.log(`📤 Emitting match_found to rooms: ${room1} and ${room2}`);
  
  io.to(room1).emit("match_found", { matchId });
  io.to(room2).emit("match_found", { matchId });
  
  // Also emit to all sockets as backup
  io.emit("match_created", { matchId, player1, player2, difficulty });
  
  return true; // Return true if match was made
}

// Start continuous matchmaking monitor for a difficulty
function startMatchmakingMonitor(io, difficulty) {
  if (matchmakingIntervals.has(difficulty)) {
    console.log(`📡 Monitor already exists for ${difficulty}`);
    return; // Already monitoring
  }
  
  console.log(`📡 Starting matchmaking monitor for ${difficulty}`);
  
  let checkCount = 0;
  const interval = setInterval(async () => {
    checkCount++;
    console.log(`🔄 Monitor check #${checkCount} for ${difficulty}`);
    const matchMade = await tryMatchmaking(io, difficulty);
    if (matchMade) {
      // Stop monitoring if match was made
      clearInterval(matchmakingIntervals.get(difficulty));
      matchmakingIntervals.delete(difficulty);
      console.log(`✅ Match made, stopping monitor for ${difficulty}`);
    }
  }, 500); // Check every 500ms
  
  matchmakingIntervals.set(difficulty, interval);
  
  // Stop after 30 seconds to prevent infinite monitoring
  setTimeout(() => {
    if (matchmakingIntervals.has(difficulty)) {
      clearInterval(matchmakingIntervals.get(difficulty));
      matchmakingIntervals.delete(difficulty);
      console.log(`⏹️ Matchmaking monitor timeout for ${difficulty}`);
    }
  }, 30000);
}

// Force matchmaking check - for debugging
async function forceMatchmakingCheck(io, difficulty) {
  console.log(`🔧 FORCE matchmaking check for ${difficulty}`);
  return await tryMatchmaking(io, difficulty);
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuth); // 🔐 AUTH HERE

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.userId, "Socket ID:", socket.id);

    // Join user-specific room for targeted messages
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    console.log(`📦 User ${socket.userId} joined room: ${userRoom}`);

    // Join matchmaking queue
    socket.on("join_queue", async ({ difficulty }) => {
      if (socket.inQueue) {
        console.log(`⚠️ User ${socket.userId} (${socket.username}) already in queue`);
        return;
      }

      try {
        // Use INSERT IGNORE to prevent duplicate entry errors
        await sequelize.query(
          `INSERT IGNORE INTO matchmaking_queue (user_id, difficulty) VALUES (?, ?)`,
          { replacements: [socket.userId, difficulty] }
        );

        // Check if user was actually added or was already in queue
        const [existing] = await sequelize.query(
          `SELECT * FROM matchmaking_queue WHERE user_id = ?`,
          { replacements: [socket.userId] }
        );

        if (existing.length === 0) {
          // Something went wrong
          console.log(`⚠️ Failed to add user ${socket.userId} to queue`);
          return;
        }

        socket.inQueue = true;
        socket.queueDifficulty = difficulty;

        console.log(`🟢 User ${socket.userId} (${socket.username}) joined ${difficulty} queue`);

        // Check queue count with user details
        const [queueStatus] = await sequelize.query(
          `SELECT user_id, joined_at FROM matchmaking_queue WHERE difficulty = ? ORDER BY joined_at ASC`,
          { replacements: [difficulty] }
        );
        console.log(`📊 Queue for ${difficulty}: ${queueStatus.length} players`);
        queueStatus.forEach(p => console.log(`   - User ${p.user_id} (joined: ${p.joined_at})`));

        // 🔥 TRY MATCHMAKING IMMEDIATELY
        console.log(`🔥 IMMEDIATE matchmaking attempt for ${difficulty}`);
        const matchMade = await tryMatchmaking(io, difficulty);
        
        // If no match made, start continuous monitoring (only if not already monitoring)
        if (!matchMade) {
          if (!matchmakingIntervals.has(difficulty)) {
            console.log(`📡 No immediate match, starting monitor for ${difficulty}`);
            startMatchmakingMonitor(io, difficulty);
          } else {
            console.log(`📡 Monitor already running for ${difficulty}, skipping`);
          }
        }
      } catch (error) {
        console.error(`❌ Error joining queue for user ${socket.userId}:`, error);
      }
    });

    socket.on("leave_queue", async () => {
      if (!socket.inQueue) return;

      await sequelize.query(
        `DELETE FROM matchmaking_queue WHERE user_id = ?`,
        { replacements: [socket.userId] }
      );

      socket.inQueue = false;
      console.log(`🔴 User ${socket.userId} left queue`);
    });

    // Debug: Check queue status
    socket.on("debug_queue_status", async ({ difficulty }) => {
      try {
        const [queue] = await sequelize.query(
          `SELECT user_id, difficulty, joined_at FROM matchmaking_queue WHERE difficulty = ?`,
          { replacements: [difficulty] }
        );
        
        socket.emit("debug_queue_result", {
          difficulty,
          queue,
          activeMonitors: Array.from(matchmakingIntervals.keys()),
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔍 Debug: Queue for ${difficulty}:`, queue);
      } catch (err) {
        console.error("Debug queue error:", err);
      }
    });

    // Debug: Force matchmaking
    socket.on("debug_force_matchmaking", async ({ difficulty }) => {
      console.log(`🔧 DEBUG: Force matchmaking for ${difficulty}`);
      await forceMatchmakingCheck(io, difficulty);
    });

    // Room management for private rooms
    socket.on("create_room", async ({ roomCode, hostId, username, difficulty, maxPlayers, settings }) => {
      const room = {
        code: roomCode,
        hostId,
        difficulty,
        maxPlayers,
        settings,
        host: username || socket.username || 'Player',
        players: [{ id: hostId, username: username || socket.username || 'Player', isHost: true, hp: 100 }],
      };
      
      activeRooms.set(roomCode, room);
      socket.join(roomCode); // Using strictly roomCode without prefix
      socket.currentRoom = roomCode;
      
      console.log(`🏠 Room created: ${roomCode} by ${hostId} (${username})`);
      console.log("Room players:", room.players);
      
      socket.emit('room_created', { room });
      io.to(roomCode).emit("player_list_update", room.players);
    });

    socket.on("join_room", ({ roomCode, username }) => {
      const room = activeRooms.get(roomCode);
      if (!room) {
        socket.emit('room_not_found'); // changed from room_error per request
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('room_error', { message: 'Room is full' });
        return;
      }

      // Add player to room if not already in it
      const uname = username || socket.username || 'Player';
      const exists = room.players.find(p => p.username === uname);
      if (!exists) {
        room.players.push({
          id: socket.userId,
          username: uname,
          isHost: false,
          hp: 100,
        });
      }

      socket.join(roomCode);
      socket.currentRoom = roomCode;

      // Notify all room members
      console.log("Room players:", room.players);
      io.to(roomCode).emit('player_list_update', room.players);
    });

    socket.on("leave_room", ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      // Remove player from room
      room.players = room.players.filter(p => String(p.id) !== String(socket.userId));
      socket.leave(roomCode);
      socket.currentRoom = null;

      // If room is empty, delete it
      if (room.players.length === 0) {
        if (room.timerId) clearTimeout(room.timerId);
        activeRooms.delete(roomCode);
        console.log(`🏠 Room deleted: ${roomCode}`);
      } else {
        // If host left, assign new host
        if (String(room.hostId) === String(socket.userId) && room.players.length > 0) {
          room.hostId = room.players[0].id;
          room.players[0].isHost = true;
          io.to(roomCode).emit('host_changed', { 
            newHostId: room.hostId, 
            players: room.players 
          });
        }
        
        io.to(roomCode).emit('player_list_update', room.players);
      }

      console.log(`👤 User ${socket.userId} left room ${roomCode}`);
    });

    socket.on("start_battle", async ({ roomCode, settings, difficulty }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return; 

      if (settings) room.settings = settings;
      if (difficulty) room.difficulty = difficulty;

      if (room.players.length < 2) {
        socket.emit('error_message', 'Need at least 2 players');
        return;
      }

      room.started = true;
      room.startTime = Date.now();
      room.gameOver = false;
      
      // Explicitly guarantee HP is at maximum
      room.players.forEach(p => p.hp = 100);
      
      // Select single unified problem matching all players uniformly
      if (!room.problem) {
        const diff = (room.settings?.difficulty || room.difficulty || "").toLowerCase();
        if (diff === "easy") {
          room.problem = questions.find(q => q.id === 2); // Addition of Two Numbers
        } else {
          room.problem = questions.find(q => q.id === 1); // Two Sum
        }
        if (!room.problem) room.problem = questions[0];
      }

      io.to(roomCode).emit("battle_countdown_start", {
        roomCode: roomCode
      });

      console.log("Room battle started:", roomCode);
      console.log("Players in match:", room.players);

      const computedDuration = room.settings?.duration ? room.settings.duration * 60 : 300;
      room.timerId = setTimeout(() => {
        const currentRoom = activeRooms.get(roomCode);
        if (!currentRoom || currentRoom.gameOver) return;
        currentRoom.gameOver = true;
        
        const p1 = currentRoom.players[0];
        const p2 = currentRoom.players[1];
        let winner = "draw";

        if (p1 && p2) {
          if (p1.hp > p2.hp) winner = p1.id;
          else if (p2.hp > p1.hp) winner = p2.id;
        }

        let winnerId = winner !== "draw" ? winner : null;

        // Apply Player stat changes securely isolating logic arrays
        currentRoom.players.forEach(player => {
          player.totalBattles = (player.totalBattles || 0) + 1;
          player.rating = player.rating || 1000;
          
          if (winnerId && String(player.id) === String(winnerId)) {
            player.victories = (player.victories || 0) + 1;
            player.rating += 25;
            const diff = (currentRoom.settings?.difficulty || currentRoom.difficulty || "easy").toLowerCase();
            if (diff === "easy") player.easySolved = (player.easySolved || 0) + 1;
            if (diff === "medium") player.mediumSolved = (player.mediumSolved || 0) + 1;
            if (diff === "hard") player.hardSolved = (player.hardSolved || 0) + 1;
          } else if (winnerId) {
            player.rating -= 10;
          }
        });

        io.to(roomCode).emit("match_result", {
          players: currentRoom.players,
          winner: winnerId || "draw"
        });

        io.to(roomCode).emit("game_over", {
          reason: "time_up",
          winner: winnerId || "draw"
        });

        activeRooms.delete(roomCode);
      }, computedDuration * 1000 + 5000); // Wait for match duration PLUS the 5000ms countdown constraint
    });

    socket.on("join_battle_room", ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      socket.join(roomCode);

      socket.emit("battle_data", {
        match: {
          id: roomCode,
          players: room.players,
          problem: room.problem || questions[0], 
          duration: room.settings?.duration ? room.settings.duration * 60 : 300,
          startTime: room.startTime
        }
      });
    });

    socket.on("attack", ({ roomCode, damage, type }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      const attacker = socket.userId;
      const player = room.players.find(p => String(p.id) === String(attacker));
      const opponent = room.players.find(p => String(p.id) !== String(attacker));

      if (!player) return;

      const handleGameOver = (roomInfo, reason, winnerId) => {
        if (roomInfo.gameOver) return;
        roomInfo.gameOver = true;
        if (roomInfo.timerId) clearTimeout(roomInfo.timerId);

        roomInfo.players.forEach(p => {
          p.totalBattles = (p.totalBattles || 0) + 1;
          p.rating = p.rating || 1000;
          
          if (String(p.id) === String(winnerId)) {
            p.victories = (p.victories || 0) + 1;
            p.rating += 25;
            const diff = (roomInfo.settings?.difficulty || roomInfo.difficulty || "easy").toLowerCase();
            if (diff === "easy") p.easySolved = (p.easySolved || 0) + 1;
            if (diff === "medium") p.mediumSolved = (p.mediumSolved || 0) + 1;
            if (diff === "hard") p.hardSolved = (p.hardSolved || 0) + 1;
          } else {
            p.rating -= 10;
          }
        });

        io.to(roomCode).emit("match_result", {
          players: roomInfo.players,
          winner: winnerId
        });

        io.to(roomCode).emit("game_over", {
          reason,
          winner: winnerId
        });
        activeRooms.delete(roomCode);
      };

      if (type === "correct") {
        if (opponent) {
          opponent.hp = Math.max(0, opponent.hp - (damage || 20));
        }
        io.to(roomCode).emit("hp_update", { players: room.players });
        handleGameOver(room, "correct_solution", player.id);
        return;
      }

      if (type === "wrong") {
        player.hp = Math.max(0, player.hp - (damage || 10));
      }

      io.to(roomCode).emit("hp_update", {
        players: room.players
      });



      if (player.hp === 0) {
        handleGameOver(room, "hp_zero", opponent ? opponent.id : null);
      } else if (opponent && opponent.hp === 0) {
        handleGameOver(room, "hp_zero", player.id);
      }
    });

    socket.on("time_up", ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      // Determine winner safely via highest HP
      const p1 = room.players[0];
      const p2 = room.players[1];
      let winnerId = null;

      if (p1 && p2) {
        if (p1.hp > p2.hp) winnerId = p1.id;
        else if (p2.hp > p1.hp) winnerId = p2.id;
        // if tie, leave as null
      }

      io.to(roomCode).emit("game_over", {
        winner: winnerId || null,
        isTie: !winnerId
      });
      
      activeRooms.delete(roomCode);
    });

    // Join match room for real-time updates
    socket.on("join_match", async ({ matchId }) => {
      socket.join(`match_${matchId}`);
      console.log(`👤 User ${socket.userId} joined match ${matchId}`);

      // Initialize liveMatches if not exists (for reconnects/page refresh)
      if (!liveMatches.has(matchId)) {
        try {
          const [[match]] = await sequelize.query(
            `SELECT player1_id, player2_id, player1_hp, player2_hp, status FROM matches WHERE id = ?`,
            { replacements: [matchId] }
          );

          if (match && match.status === 'active') {
            // Broadcast global HP map explicitly leaving local clients to parse selfHP natively via playersHP
            io.to(matchId).emit('hp_update', {
                playersHP: {
                  [match.player1_id]: match.player1_hp || 100,
                  [match.player2_id]: match.player2_hp || 100,
                }
            });
            liveMatches.set(matchId, {
              players: [match.player1_id, match.player2_id],
              hp: {
                [match.player1_id]: match.player1_hp || 100,
                [match.player2_id]: match.player2_hp || 100,
              },
            });
            console.log(`🔄 Reinitialized liveMatches for match ${matchId}`);
          }
        } catch (err) {
          console.error(`❌ Error initializing liveMatches for match ${matchId}:`, err);
        }
      }
    });

    socket.on("disconnect", async () => {
      if (socket.inQueue) {
        await sequelize.query(
          `DELETE FROM matchmaking_queue WHERE user_id = ?`,
          { replacements: [socket.userId] }
        );
      }

      // Handle room disconnect
      if (socket.currentRoom) {
        const room = activeRooms.get(socket.currentRoom);
        if (room) {
          room.players = room.players.filter(p => String(p.id) !== String(socket.userId));
          if (room.players.length === 0) {
            activeRooms.delete(socket.currentRoom);
          } else {
            io.to(socket.currentRoom).emit('player_list_update', room.players);
          }
        }
      }

      console.log("❌ User disconnected:", socket.userId);
    });

    // Run code without affecting match (for testing)
    socket.on("run_code", async ({ matchId, code, language }) => {
      try {
        const userId = socket.userId;

        // Run judge without affecting HP/match
        const judgeResult = await handleSubmission({
          userId,
          matchId,
          code,
          language,
        });

        // Emit result to user only (no HP changes)
        socket.emit("run_result", {
          verdict: judgeResult.verdict,
          testCasesPassed: judgeResult.passed,
          totalTestCases: judgeResult.total,
          executionTime: judgeResult.executionTime,
          memory: judgeResult.memory ?? 0,
          errorMessage: judgeResult.errorMessage || null,
          output: judgeResult.output || null,
        });

        console.log(`📝 User ${userId} ran code in match ${matchId}: ${judgeResult.verdict}`);
      } catch (err) {
        console.error("❌ Run code error:", err.message);
        socket.emit("run_result", {
          verdict: "RTE",
          errorMessage: err.message,
        });
      }
    });

    // ============================================
    // UNIFIED SUBMIT - Same rules for Duel & Battle Royale
    // Rules:
    // - Health = 100
    // - Wrong submission/RTE/CTE/TLE = -10 health (self only, not opponent)
    // - Correct submission = Victory popup with rating gain
    // - Health <= 0 = Defeat popup
    // ============================================
    socket.on("submit_code", async ({ matchId, code, language }) => {
      console.log(`⚔️ submit_code received from user ${socket.userId} for match ${matchId}`);
      
      try {
        const userId = socket.userId;

        // Get match info
        const [[match]] = await sequelize.query(
          `SELECT * FROM matches WHERE id = ? AND status = 'active'`,
          { replacements: [matchId] }
        );

        if (!match) {
          socket.emit("submission_result", {
            verdict: "BLOCKED",
            errorMessage: "Match not found or already ended",
          });
          return;
        }

        // Get player's current health from liveMatches or DB
        let liveMatch = liveMatches.get(matchId);
        let playerHealth = 100;
        
        if (liveMatch && liveMatch.hp && liveMatch.hp[userId] !== undefined) {
          playerHealth = liveMatch.hp[userId];
        } else if (match.player1_id === userId) {
          playerHealth = match.player1_hp || 100;
        } else if (match.player2_id === userId) {
          playerHealth = match.player2_hp || 100;
        }

        // Check if player is eliminated
        if (playerHealth <= 0) {
          socket.emit("submission_result", {
            verdict: "BLOCKED",
            reason: "eliminated",
          });
          return;
        }

        console.log(`⚔️ Player ${userId} health: ${playerHealth}`);

        // Run the judge
        const judgeResult = await handleSubmission({
          userId,
          matchId,
          code,
          language,
        });

        console.log(`⚔️ Judge result:`, judgeResult.verdict, judgeResult.passed, '/', judgeResult.total);

        // Update health based on result
        let newHealth = playerHealth;
        let playerEliminated = false;

        // Wrong answer, RTE, CTE, TLE = -10 health
        if (judgeResult.verdict === "WA" || judgeResult.verdict === "RTE" || 
            judgeResult.verdict === "CTE" || judgeResult.verdict === "TLE" || 
            judgeResult.verdict === "PARTIAL") {
          newHealth = Math.max(0, playerHealth - 10);
          console.log(`⚔️ Wrong submission! Health: ${playerHealth} -> ${newHealth}`);
        }

        // Update health in liveMatches
        if (!liveMatch) {
          liveMatch = {
            players: [match.player1_id, match.player2_id],
            hp: {
              [match.player1_id]: match.player1_hp || 100,
              [match.player2_id]: match.player2_hp || 100,
            },
          };
          liveMatches.set(matchId, liveMatch);
        }
        liveMatch.hp[userId] = newHealth;

        // Update in database
        if (match.player1_id === userId) {
          await sequelize.query(
            `UPDATE matches SET player1_hp = ? WHERE id = ?`,
            { replacements: [newHealth, matchId] }
          );
        } else {
          await sequelize.query(
            `UPDATE matches SET player2_hp = ? WHERE id = ?`,
            { replacements: [newHealth, matchId] }
          );
        }

        // Emit health update to both players
        const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;
        io.to(`user_${userId}`).emit("hp_update", {
          selfHP: newHealth,
          opponentHP: liveMatch.hp[opponentId] || 100,
        });
        io.to(`user_${opponentId}`).emit("hp_update", {
          selfHP: liveMatch.hp[opponentId] || 100,
          opponentHP: newHealth,
        });

        // Handle correct submission (AC) - Victory!
        if (judgeResult.verdict === "AC") {
          console.log(`🏆 Correct submission! Player ${userId} wins!`);
          
          // Calculate rating gain based on time and health
          const now = new Date();
          const matchDuration = 15 * 60 * 1000; // 15 minutes default
          const startTime = match.started_at || new Date(now.getTime() - 60000); // Default to 1 min ago if no start time
          const Tmax = matchDuration / 1000;
          const Tcurrent = (now - new Date(startTime)) / 1000;
          
          let timeScore = 100 * (1 - (Tcurrent / Tmax));
          if (timeScore < 0) timeScore = 0;
          
          const healthScore = newHealth;
          const ratingGain = Math.floor((0.6 * timeScore) + (0.4 * healthScore));

          console.log(`🏆 Rating calculation: Tmax=${Tmax}, Tcurrent=${Tcurrent}, health=${newHealth}`);
          console.log(`🏆 timeScore=${timeScore}, healthScore=${healthScore}, ratingGain=${ratingGain}`);

          // Update winner's rating
          await sequelize.query(
            `UPDATE users SET rating = rating + ? WHERE id = ?`,
            { replacements: [ratingGain, userId] }
          );

          // Insert match results for both players
          await sequelize.query(
            `INSERT INTO match_results (match_id, user_id, result, rating_change) VALUES (?, ?, 'win', ?)`,
            { replacements: [matchId, userId, ratingGain] }
          );
          
          await sequelize.query(
            `INSERT INTO match_results (match_id, user_id, result, rating_change) VALUES (?, ?, 'loss', 0)`,
            { replacements: [matchId, opponentId] }
          );

          // Mark match as completed
          await sequelize.query(
            `UPDATE matches SET status = 'completed', winner_id = ?, ended_at = NOW() WHERE id = ?`,
            { replacements: [userId, matchId] }
          );

          // Emit victory popup to winner
          io.to(`user_${userId}`).emit("victory_popup", {
            reason: "solved",
            ratingGain,
            solveTime: now,
            healthRemaining: newHealth,
          });

          // Emit defeat popup to loser
          io.to(`user_${opponentId}`).emit("defeat_popup", {
            reason: "opponent_solved",
            ratingChange: 0,
          });

          // Emit match end
          io.to(`match_${matchId}`).emit("match_end", {
            winner: { id: userId },
          });

          socket.emit("submission_result", {
            verdict: judgeResult.verdict,
            testCasesPassed: judgeResult.passed,
            totalTestCases: judgeResult.total,
            executionTime: judgeResult.executionTime,
            errorMessage: judgeResult.errorMessage || null,
          });
          
          return;
        }

        // Check if player is eliminated
        if (newHealth <= 0) {
          playerEliminated = true;
          console.log(`💀 Player ${userId} eliminated!`);

          // Find winner (the other player)
          const winnerId = opponentId;
          const loserId = userId;

          // Get winner's current rating for match results
          const [[winnerData]] = await sequelize.query(
            `SELECT rating FROM users WHERE id = ?`,
            { replacements: [winnerId] }
          );

          // Winner gets 0 rating for opponent elimination (no solve)
          // Loser gets 0 rating
          const winnerRatingGain = 0;
          const loserRatingGain = 0;

          // Update ratings (no change)
          await sequelize.query(
            `UPDATE users SET rating = rating + ? WHERE id = ?`,
            { replacements: [winnerRatingGain, winnerId] }
          );

          await sequelize.query(
            `UPDATE users SET rating = rating + ? WHERE id = ?`,
            { replacements: [loserRatingGain, loserId] }
          );

          // Insert match results for both players
          await sequelize.query(
            `INSERT INTO match_results (match_id, user_id, result, rating_change) VALUES (?, ?, 'win', ?)`,
            { replacements: [matchId, winnerId, winnerRatingGain] }
          );
          
          await sequelize.query(
            `INSERT INTO match_results (match_id, user_id, result, rating_change) VALUES (?, ?, 'loss', ?)`,
            { replacements: [matchId, loserId, loserRatingGain] }
          );

          // Mark match as completed
          await sequelize.query(
            `UPDATE matches SET status = 'completed', winner_id = ?, ended_at = NOW() WHERE id = ?`,
            { replacements: [winnerId, matchId] }
          );

          // Emit defeat popup to eliminated player
          io.to(`user_${loserId}`).emit("defeat_popup", {
            reason: "health_zero",
            ratingChange: 0,
          });

          // Emit victory popup to winner
          io.to(`user_${winnerId}`).emit("victory_popup", {
            reason: "opponent_eliminated",
            ratingGain: 0,
            solveTime: null,
            healthRemaining: liveMatch.hp[winnerId] || 100,
          });

          // Emit match end
          io.to(`match_${matchId}`).emit("match_end", {
            winner: { id: winnerId },
          });
        }

        // Send submission result
        socket.emit("submission_result", {
          verdict: judgeResult.verdict,
          testCasesPassed: judgeResult.passed,
          totalTestCases: judgeResult.total,
          executionTime: judgeResult.executionTime,
          errorMessage: judgeResult.errorMessage || null,
        });

      } catch (err) {
        console.error("❌ Submit error:", err.message, err.stack);
        socket.emit("submission_result", {
          verdict: "RTE",
          errorMessage: err.message,
        });
      }
    });

    // ============================================
    // BATTLE ROYALE - Create Contest
    // ============================================
    socket.on("create_contest", async ({ durationMinutes, problemId, difficulty }) => {
      try {
        const contestId = await battleRoyale.createContest({
          createdBy: socket.userId,
          durationMinutes: durationMinutes || 15,
          problemId,
          difficulty,
        });

        const roomCode = await sequelize.query(
          `SELECT room_code FROM contests WHERE id = ?`,
          { replacements: [contestId] }
        );

        socket.emit("contest_created", {
          contestId,
          roomCode: roomCode[0][0]?.room_code,
        });

        activeContests.set(contestId, {
          hostId: socket.userId,
          players: [],
          status: 'waiting',
        });

        console.log(`🏆 Contest ${contestId} created by user ${socket.userId}`);
      } catch (err) {
        console.error("❌ Create contest error:", err.message);
        socket.emit("contest_error", { message: err.message });
      }
    });

    // ============================================
    // BATTLE ROYALE - Join Contest
    // ============================================
    socket.on("join_contest", async ({ contestId }) => {
      try {
        const [contest] = await sequelize.query(
          `SELECT * FROM contests WHERE id = ?`,
          { replacements: [contestId] }
        );

        if (!contest[0]) {
          socket.emit("contest_error", { message: "Contest not found" });
          return;
        }

        if (contest[0].status !== 'waiting') {
          socket.emit("contest_error", { message: "Contest already started" });
          return;
        }

        await sequelize.query(
          `INSERT INTO contest_participants (contest_id, user_id, health, solved, is_alive)
           VALUES (?, ?, 100, 0, 1)
           ON DUPLICATE KEY UPDATE user_id = user_id`,
          { replacements: [contestId, socket.userId] }
        );

        socket.join(`contest_${contestId}`);
        socket.currentContest = contestId;

        const players = await battleRoyale.getContestParticipants(contestId);

        io.to(`contest_${contestId}`).emit("contest_player_joined", {
          contestId,
          playerId: socket.userId,
          players,
        });

        console.log(`👤 User ${socket.userId} joined contest ${contestId}`);
      } catch (err) {
        console.error("❌ Join contest error:", err.message);
        socket.emit("contest_error", { message: err.message });
      }
    });

    // ============================================
    // BATTLE ROYALE - Start Contest
    // ============================================
    socket.on("start_contest", async ({ contestId }) => {
      try {
        const contest = activeContests.get(contestId);
        if (!contest || contest.hostId !== socket.userId) {
          socket.emit("contest_error", { message: "Not authorized to start contest" });
          return;
        }

        const players = await battleRoyale.getContestParticipants(contestId);
        if (players.length < 1) {
          socket.emit("contest_error", { message: "Need at least 1 player" });
          return;
        }

        const contestState = await battleRoyale.startContest(contestId, io);
        activeContests.set(contestId, { ...contest, status: 'active' });

        io.to(`contest_${contestId}`).emit("contest_started", {
          contestId,
          startTime: contestState.startTime,
          endTime: contestState.endTime,
          players: contestState.players,
        });

        console.log(`🏆 Contest ${contestId} started`);
      } catch (err) {
        console.error("❌ Start contest error:", err.message);
        socket.emit("contest_error", { message: err.message });
      }
    });

    // ============================================
    // BATTLE ROYALE - Run Code (no damage)
    // ============================================
    socket.on("battle_royale_run", async ({ contestId, code, language }) => {
      try {
        const validation = await battleRoyale.validateSubmission(contestId, socket.userId);
        
        if (!validation.valid) {
          socket.emit("run_result", {
            verdict: "BLOCKED",
            reason: validation.reason,
          });
          return;
        }

        const judgeResult = await handleSubmission({
          userId: socket.userId,
          matchId: contestId,
          code,
          language,
        });

        socket.emit("run_result", {
          verdict: judgeResult.verdict,
          testCasesPassed: judgeResult.passed,
          totalTestCases: judgeResult.total,
          executionTime: judgeResult.executionTime,
          errorMessage: judgeResult.errorMessage || null,
        });
      } catch (err) {
        console.error("❌ Battle royale run error:", err.message);
        socket.emit("run_result", {
          verdict: "RTE",
          errorMessage: err.message,
        });
      }
    });

    // ============================================
    // BATTLE ROYALE - Submit Code
    // ============================================
    socket.on("battle_royale_submit", async ({ contestId, code, language }) => {
      console.log(`🎯 battle_royale_submit received from user ${socket.userId} for contest ${contestId}`);
      
      try {
        const userId = socket.userId;

        // First, validate the submission BEFORE running judge to save resources
        const validation = await battleRoyale.validateSubmission(contestId, userId);
        console.log(`🎯 Validation result:`, validation);
        
        if (!validation.valid) {
          console.log(`🎯 Submission blocked:`, validation.reason);
          socket.emit("submission_result", {
            verdict: "BLOCKED",
            reason: validation.reason,
          });
          return;
        }

        // Run the judge
        const judgeResult = await handleSubmission({
          userId,
          matchId: contestId,
          code,
          language,
        });

        console.log(`🎯 Judge result:`, judgeResult.verdict, judgeResult.passed, '/', judgeResult.total);

        // IMMEDIATELY emit victory popup for correct submission, before anything else
        if (judgeResult.verdict === "AC") {
          console.log(`🏆 Correct submission detected for player ${userId}, emitting victory popup immediately`);
          
          // Pass the validated data to avoid double validation
          await battleRoyale.handleCorrectSubmission(
            contestId,
            userId,
            judgeResult.passed,
            judgeResult.total,
            io,
            validation  // Pass validated data
          );
          
          // Send submission result AFTER victory popup to ensure proper order
          socket.emit("submission_result", {
            verdict: judgeResult.verdict,
            testCasesPassed: judgeResult.passed,
            totalTestCases: judgeResult.total,
            executionTime: judgeResult.executionTime,
            errorMessage: judgeResult.errorMessage || null,
          });
          
          return; // Return immediately - player has won, no more submissions allowed
        }
        
        // Handle wrong submission (WA) - apply damage
        if (judgeResult.verdict === "WA") {
          console.log(`❌ Wrong answer for player ${userId}`);
          await battleRoyale.handleWrongSubmission(contestId, userId, io);
        }
        
        // Handle runtime error (RTE)
        if (judgeResult.verdict === "RTE") {
          console.log(`❌ Runtime error for player ${userId}`);
          await battleRoyale.handleRuntimeError(contestId, userId, io);
        }
        
        // Handle compilation error (CTE)
        if (judgeResult.verdict === "CTE") {
          console.log(`❌ Compilation error for player ${userId}`);
          await battleRoyale.handleCompilationError(contestId, userId, io);
        }
        
        // Handle time limit exceeded (TLE)
        if (judgeResult.verdict === "TLE") {
          console.log(`❌ TLE for player ${userId}`);
          await battleRoyale.handleTLE(contestId, userId, io);
        }

        // Handle partial - treat as wrong submission (apply damage)
        if (judgeResult.verdict === "PARTIAL") {
          console.log(`⚠️ Partial verdict for player ${userId}, treating as wrong submission`);
          await battleRoyale.handleWrongSubmission(contestId, userId, io);
        }

        // Send submission result
        socket.emit("submission_result", {
          verdict: judgeResult.verdict,
          testCasesPassed: judgeResult.passed,
          totalTestCases: judgeResult.total,
          executionTime: judgeResult.executionTime,
          errorMessage: judgeResult.errorMessage || null,
        });
      } catch (err) {
        console.error("❌ Battle royale submit error:", err.message, err.stack);
        socket.emit("submission_result", {
          verdict: "RTE",
          errorMessage: err.message,
        });
      }
    });

    // ============================================
    // BATTLE ROYALE - Join Contest Room
    // ============================================
    socket.on("join_contest_room", ({ contestId }) => {
      socket.join(`contest_${contestId}`);
      socket.currentContest = contestId;
      console.log(`👤 User ${socket.userId} joined contest room ${contestId}`);
    });

    // ============================================
    // BATTLE ROYALE - Leave Contest
    // ============================================
    socket.on("leave_contest", async ({ contestId }) => {
      socket.leave(`contest_${contestId}`);
      socket.currentContest = null;
      console.log(`👤 User ${socket.userId} left contest ${contestId}`);
    });
  });
}

module.exports = initSocket;
