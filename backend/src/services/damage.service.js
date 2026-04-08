/**
 * STEP 7 — Damage Calculation Engine
 * Server authoritative
 */

const DAMAGE = {
  PER_TEST: 10, // each newly passed test case
  WA: 5,        // wrong answer penalty
  RTE: 10, 
  CTE: 5     // runtime error penalty
};

function normalizeVerdict(judgeResult) {
  if (judgeResult.verdict === "AC") return "AC";
  if (judgeResult.verdict === "RTE") return "RTE";
  if (judgeResult.passed > 0) return "PARTIAL";
  return "WA";
}

function applyDamage({ match, attackerId, judgeResult, progressStore }) {
  const defenderId =
    match.player1_id === attackerId
      ? match.player2_id
      : match.player1_id;

  progressStore[match.id] ??= {};
  progressStore[match.id][attackerId] ??= new Set();

  const passedSet = progressStore[match.id][attackerId];

  const verdict = normalizeVerdict(judgeResult);
  let damageToDefender = 0;
  let damageToSelf = 0;

  // ✅ ACCEPTED → instant kill
  if (verdict === "AC") {
    if (defenderId === match.player1_id) match.player1_hp = 0;
    else match.player2_hp = 0;

    return { verdict, matchEnded: true,player1HP: match.player1_hp,
  player2HP: match.player2_hp, };
  }

  // 🟡 PARTIAL DAMAGE
  if (verdict === "PARTIAL") {
    const newlyPassed = judgeResult.passedIndexes.filter(
      (i) => !passedSet.has(i)
    );

    damageToDefender = newlyPassed.length * DAMAGE.PER_TEST;

    newlyPassed.forEach((i) => passedSet.add(i));
  }

  // 🔴 WRONG ANSWER
  if (verdict === "WA") {
    damageToSelf = DAMAGE.WA;
  }

  // 🟠 RUNTIME ERROR
  if (verdict === "RTE") {
    damageToSelf = DAMAGE.RTE;
  }

  if (verdict === "CTE") {
    damageToSelf = DAMAGE.CTE;
  }



  // APPLY DAMAGE
  if (damageToDefender > 0) {
    if (defenderId === match.player1_id) {
      match.player1_hp = Math.max(0, match.player1_hp - damageToDefender);
    } else {
      match.player2_hp = Math.max(0, match.player2_hp - damageToDefender);
    }
  }

  if (damageToSelf > 0) {
    if (attackerId === match.player1_id) {
      match.player1_hp = Math.max(0, match.player1_hp - damageToSelf);
    } else {
      match.player2_hp = Math.max(0, match.player2_hp - damageToSelf);
    }
  }

  let matchEnded = match.player1_hp === 0 || match.player2_hp === 0


  return { verdict, matchEnded,player1HP: match.player1_hp,
  player2HP: match.player2_hp, };
}

module.exports = { applyDamage };
