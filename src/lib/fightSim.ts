import {
  Fighter,
  FightOutcome,
  BookedFight,
  FightResultType,
  FinishMethod,
  Momentum,
  HealthStatus,
} from "@/types/game";

// ============================================
// CONFIG
// ============================================

const MAX_ROUNDS = 3; // 5 for title fights, handled below

// ============================================
// CORE SIM
// ============================================

/**
 * Simulates a single fight between two fighters.
 * Pure function w.r.t. randomness source — returns the outcome only.
 * Does NOT mutate fighters; caller applies effects via applyFightResult().
 */
export function simulateFight(
  fighterA: Fighter,
  fighterB: Fighter,
  isTitleFight: boolean
): FightOutcome {
  const rounds = isTitleFight ? 5 : MAX_ROUNDS;

  // Overall "power score" per fighter, weighted + momentum/health adjusted
  const scoreA = computeFightScore(fighterA);
  const scoreB = computeFightScore(fighterB);

  // Random roll so favorites can still lose (upsets matter for a promoter sim),
  // but scores are squared first so a real stat/momentum edge actually shows up
  // as a real edge in win probability, instead of near-coinflip territory.
  const sharpenedA = Math.pow(scoreA, 1.8);
  const sharpenedB = Math.pow(scoreB, 1.8);
  const totalScore = sharpenedA + sharpenedB;
  const roll = Math.random() * totalScore;
  const aWins = roll < sharpenedA;

  const winner = aWins ? fighterA : fighterB;
  const loser = aWins ? fighterB : fighterA;

  const method = determineFinishMethod(winner, loser);
  const round = determineRound(method, rounds);

  return {
    fightId: "", // caller sets this to the actual BookedFight id
    winnerId: winner.id,
    result: "win" as FightResultType,
    method,
    round,
  };
}

/**
 * Weighted score used to bias the random roll.
 * Momentum and health matter as much as raw stats — a "hot" fighter
 * outperforms their base stats, an injured/nursing fighter underperforms.
 */
function computeFightScore(fighter: Fighter): number {
  const base =
    fighter.striking * 0.35 +
    fighter.grappling * 0.35 +
    fighter.cardio * 0.15 +
    fighter.chin * 0.15;

  const momentumMultiplier: Record<Momentum, number> = {
    hot: 1.15,
    neutral: 1.0,
    cold: 0.85,
  };

  const healthMultiplier: Record<HealthStatus, number> = {
    fine: 1.0,
    nursing: 0.8,
    injured: 0.5, // shouldn't be bookable at all, but safety net
  };

  return (
    base * momentumMultiplier[fighter.momentum] * healthMultiplier[fighter.health]
  );
}

function determineFinishMethod(winner: Fighter, loser: Fighter): FinishMethod {
  const koChance = (winner.striking / 100) * (1 - loser.chin / 150);
  const subChance = (winner.grappling / 100) * 0.4;
  const roll = Math.random();

  if (roll < koChance * 0.4) return "KO/TKO";
  if (roll < koChance * 0.4 + subChance * 0.3) return "Submission";
  return "Decision";
}

function determineRound(method: FinishMethod, maxRounds: number): number {
  if (method === "Decision") return maxRounds;
  // finishes weighted toward later rounds but can happen early
  const weights = Array.from({ length: maxRounds }, (_, i) => i + 1);
  const roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  for (const r of weights) {
    cumulative += r;
    if (roll < cumulative) return r;
  }
  return maxRounds;
}

// ============================================
// POST-FIGHT EFFECTS
// ============================================

interface FightEffectResult {
  winner: Fighter;
  loser: Fighter;
}

/**
 * Applies the outcome to both fighters: record, momentum, health/cooldown,
 * fan heat. Returns NEW fighter objects (immutable update pattern).
 */
export function applyFightResult(
  fighterA: Fighter,
  fighterB: Fighter,
  outcome: FightOutcome,
  week: number
): FightEffectResult {
  const winner = outcome.winnerId === fighterA.id ? fighterA : fighterB;
  const loser = outcome.winnerId === fighterA.id ? fighterB : fighterA;

  const updatedWinner: Fighter = {
    ...winner,
    wins: winner.wins + 1,
    momentum: "hot",
    health: "fine", // wins rarely bring meaningful downtime
    weeksUntilAvailable: outcome.method === "Decision" ? 2 : 3,
    fanHeat: clamp(winner.fanHeat + fanHeatGain(outcome), 0, 100),
    recentFights: pushRecentFight(winner, {
      opponentId: loser.id,
      opponentName: loser.name,
      result: "win",
      method: outcome.method,
      week,
    }),
  };

  const updatedLoser: Fighter = {
    ...loser,
    losses: loser.losses + 1,
    momentum: "cold",
    health: outcome.method === "KO/TKO" ? "nursing" : "fine",
    weeksUntilAvailable: cooldownForLoss(outcome.method),
    fanHeat: clamp(loser.fanHeat - 2, 0, 100), // losing rarely kills fan heat much, upsets can even boost it later
    recentFights: pushRecentFight(loser, {
      opponentId: winner.id,
      opponentName: winner.name,
      result: "loss",
      method: outcome.method,
      week,
    }),
  };

  return { winner: updatedWinner, loser: updatedLoser };
}

function cooldownForLoss(method: FinishMethod): number {
  switch (method) {
    case "KO/TKO":
      return 8; // brutal finishes need real recovery
    case "Submission":
      return 6;
    case "Decision":
      return 4;
    default:
      return 4;
  }
}

function fanHeatGain(outcome: FightOutcome): number {
  switch (outcome.method) {
    case "KO/TKO":
      return 8;
    case "Submission":
      return 6;
    case "Decision":
      return 3;
    default:
      return 2;
  }
}

function pushRecentFight(
  fighter: Fighter,
  record: Fighter["recentFights"][number]
) {
  const updated = [record, ...fighter.recentFights];
  return updated.slice(0, 15); // keep last 15 for career log display
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// SIMULATE A FULL CARD
// ============================================

export function simulateCard(
  fights: BookedFight[],
  roster: Fighter[],
  week: number
): { outcomes: FightOutcome[]; updatedRoster: Fighter[] } {
  const rosterMap = new Map(roster.map((f) => [f.id, f]));
  const outcomes: FightOutcome[] = [];

  for (const bookedFight of fights) {
    const fighterA = rosterMap.get(bookedFight.fighterAId);
    const fighterB = rosterMap.get(bookedFight.fighterBId);
    if (!fighterA || !fighterB) continue;

    const outcome = simulateFight(fighterA, fighterB, bookedFight.isTitleFight);
    outcome.fightId = bookedFight.id;
    outcomes.push(outcome);

    const { winner, loser } = applyFightResult(fighterA, fighterB, outcome, week);
    rosterMap.set(winner.id, winner);
    rosterMap.set(loser.id, loser);
  }

  return { outcomes, updatedRoster: Array.from(rosterMap.values()) };
}
