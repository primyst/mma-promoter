import { Fighter, FightOutcome, BookedFight } from "@/types/game";

// ============================================
// TYPES
// ============================================

export interface CardBonuses {
  fotn: { fightId: string; fighterIds: string[] } | null;
  potn: { fightId: string; fighterId: string } | null;
}

export const BONUS_AMOUNTS = {
  fotn: 15000, // split between both fighters, conceptually
  potn: 10000,
};

// ============================================
// EXCITEMENT SCORING (for Fight of the Night)
// ============================================

function scoreFightExcitement(
  outcome: FightOutcome,
  fighterA: Fighter,
  fighterB: Fighter,
  maxRounds: number
): number {
  let score = 0;

  if (outcome.method !== "Decision" && outcome.method !== "Doctor Stoppage") {
    // Early finishes are exciting, but not so early they read as a squash
    const roundsRemaining = maxRounds - outcome.round;
    score += 10 + roundsRemaining * 5;
  }

  if (outcome.method === "Decision" && outcome.judgeScores) {
    const avgMargin =
      outcome.judgeScores.reduce(
        (sum, card) => sum + (card.winnerScore - card.loserScore),
        0
      ) / outcome.judgeScores.length;
    // Closer margin = more exciting; a blowout decision scores near zero here
    score += Math.max(0, 20 - avgMargin * 4);
  }

  // Upset bonus — a real ranking gap crossed makes for a better story
  const winner = outcome.winnerId === fighterA.id ? fighterA : fighterB;
  const loser = outcome.winnerId === fighterA.id ? fighterB : fighterA;
  const winnerWasFavorite =
    winner.isChampion || ((winner.ranking ?? 50) < (loser.ranking ?? 50) - 1);
  if (!winnerWasFavorite) score += 15;

  return score;
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Awards Fight of the Night (most exciting fight on the card, judged by
 * finish speed / decision closeness / upset factor) and Performance of
 * the Night (single most impressive FINISH on the card — decisions don't
 * qualify, POTN is about a standout individual performance).
 */
export function computeCardBonuses(
  fights: BookedFight[],
  outcomes: FightOutcome[],
  roster: Fighter[]
): CardBonuses {
  const rosterMap = new Map(roster.map((f) => [f.id, f]));

  let bestFotnScore = -Infinity;
  let fotn: CardBonuses["fotn"] = null;

  let bestPotnScore = -Infinity;
  let potn: CardBonuses["potn"] = null;

  for (const fight of fights) {
    const outcome = outcomes.find((o) => o.fightId === fight.id);
    if (!outcome || !outcome.winnerId) continue;

    const fighterA = rosterMap.get(fight.fighterAId);
    const fighterB = rosterMap.get(fight.fighterBId);
    if (!fighterA || !fighterB) continue;

    const maxRounds = fight.isTitleFight ? 5 : 3;
    const excitement = scoreFightExcitement(outcome, fighterA, fighterB, maxRounds);

    if (excitement > bestFotnScore) {
      bestFotnScore = excitement;
      fotn = { fightId: fight.id, fighterIds: [fighterA.id, fighterB.id] };
    }

    if (outcome.method !== "Decision" && outcome.method !== "Doctor Stoppage") {
      // POTN score rewards speed specifically — a first-round finish beats
      // a third-round one even if the overall "excitement" score is close
      const potnScore = (maxRounds - outcome.round + 1) * 10;
      if (potnScore > bestPotnScore) {
        bestPotnScore = potnScore;
        potn = { fightId: fight.id, fighterId: outcome.winnerId };
      }
    }
  }

  return { fotn, potn };
}
