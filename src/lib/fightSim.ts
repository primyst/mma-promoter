import {
  Fighter,
  FightOutcome,
  BookedFight,
  FightResultType,
  FinishMethod,
  Momentum,
  HealthStatus,
} from "@/types/game";
import { FAME_GAIN } from "./fame";

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

  const judgeScores =
    method === "Decision"
      ? generateJudgeScorecards(winner, loser, rounds)
      : undefined;

  const summary = generateFightSummary(winner, loser, method, round);

  return {
    fightId: "", // caller sets this to the actual BookedFight id
    winnerId: winner.id,
    result: "win" as FightResultType,
    method,
    round,
    judgeScores,
    summary,
  };
}

// ============================================
// JUDGE SCORECARDS (for decisions)
// ============================================

const JUDGE_NAMES = ["Adalene Cross", "Marcus Fields", "Priya Chandra"];

/**
 * Three judges score every round 10-9 (or 10-8 for a dominant round),
 * biased toward whoever actually won but with enough independent variance
 * that split decisions can happen — real judges don't always agree.
 */
function generateJudgeScorecards(
  winner: Fighter,
  loser: Fighter,
  rounds: number
): { judgeName: string; winnerScore: number; loserScore: number }[] {
  return JUDGE_NAMES.map((judgeName) => {
    let winnerTotal = 0;
    let loserTotal = 0;

    for (let round = 1; round <= rounds; round++) {
      // Each judge independently leans toward the actual winner ~75% of the
      // time per round — close enough for split decisions to occasionally
      // happen, consistent enough that the "right" fighter usually wins.
      const judgeFavorsWinner = Math.random() < 0.75;
      if (judgeFavorsWinner) {
        winnerTotal += 10;
        loserTotal += 9;
      } else {
        winnerTotal += 9;
        loserTotal += 10;
      }
    }

    return { judgeName, winnerScore: winnerTotal, loserScore: loserTotal };
  });
}

// ============================================
// FIGHT SUMMARY (short flavor line)
// ============================================

const FINISH_SUMMARIES: Record<FinishMethod, string[]> = {
  "KO/TKO": [
    "landed a clean shot that put the lights out",
    "battered their opponent against the fence until the ref stepped in",
    "caught them cold with a perfectly timed strike",
  ],
  Submission: [
    "worked for the finish on the ground until the tap came",
    "locked in a tight submission with nowhere to go",
    "took the fight to the mat and never let go",
  ],
  Decision: [
    "out-worked their opponent over the full distance",
    "controlled the pace but couldn't find the finish",
    "grinded out a hard-fought distance win",
  ],
  DQ: ["won by disqualification after an illegal strike"],
};

function generateFightSummary(
  winner: Fighter,
  loser: Fighter,
  method: FinishMethod,
  round: number
): string {
  const options = FINISH_SUMMARIES[method];
  const template = options[Math.floor(Math.random() * options.length)];

  if (method === "Decision") {
    return `${winner.name} ${template} against ${loser.name}.`;
  }

  return `${winner.name} ${template} in round ${round} against ${loser.name}.`;
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

  // Base fame gain — win, plus extra for a finish, plus extra for beating
  // someone clearly above your station. Title-specific bonuses (winning
  // or defending a belt) are applied separately in the store, since this
  // function doesn't know whether the booking was a title fight.
  const wasUpset =
    loser.isChampion ||
    (loser.ranking != null &&
      winner.ranking != null &&
      loser.ranking < winner.ranking - 2);
  const fameGain =
    FAME_GAIN.win +
    (outcome.method !== "Decision" ? FAME_GAIN.finish : 0) +
    (wasUpset ? FAME_GAIN.upset : 0);

  const updatedWinner: Fighter = {
    ...winner,
    wins: winner.wins + 1,
    momentum: "hot",
    health: "fine", // wins rarely bring meaningful downtime
    weeksUntilAvailable: outcome.method === "Decision" ? 2 : 3,
    fanHeat: clamp(winner.fanHeat + fanHeatGain(outcome), 0, 100),
    fame: winner.fame + fameGain,
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
