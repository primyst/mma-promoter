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

  let method = determineFinishMethod(winner, loser);
  let round = determineRound(method, rounds);

  // Doctor stoppages: a rare, pure-bad-luck cut that ends the fight
  // regardless of who was actually winning on stats. This is deliberately
  // NOT tied to striking/chin — cuts happen to dominant fighters too, and
  // that's exactly what makes them feel unfair when they land.
  if (method !== "Decision" && Math.random() < 0.03) {
    method = "Doctor Stoppage";
    round = Math.max(1, Math.min(rounds, round)); // keep whatever round it already landed on
  }

  const judgeScores =
    method === "Decision"
      ? generateJudgeScorecards(winner, loser, rounds)
      : undefined;

  const summary = generateFightSummary(winner, loser, method, round);

  // Career-threatening injuries — small chance on a brutal finish (KO/TKO
  // or Doctor Stoppage), so always booking the best fighter and stacking
  // brutal finishes carries real risk, not just a cooldown timer. First
  // round finishes are the most violent and carry the highest chance.
  let loserInjury: "severe" | "career_ending" | undefined;
  if (method === "KO/TKO" || method === "Doctor Stoppage") {
    const injuryChance = round === 1 ? 0.05 : 0.03;
    if (Math.random() < injuryChance) {
      loserInjury = Math.random() < 0.25 ? "career_ending" : "severe";
    }
  }

  return {
    fightId: "", // caller sets this to the actual BookedFight id
    winnerId: winner.id,
    result: "win" as FightResultType,
    method,
    round,
    judgeScores,
    summary,
    loserInjury,
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
  "Doctor Stoppage": [
    "picked up the win after a cut forced the doctor to step in",
    "was awarded the stoppage when a bad cut ended the fight early",
  ],
};

function generateFightSummary(
  winner: Fighter,
  loser: Fighter,
  method: FinishMethod,
  round: number
): string {
  const options = FINISH_SUMMARIES[method];
  const template = options[Math.floor(Math.random() * options.length)];

  const opener =
    method === "Decision"
      ? `${winner.name} ${template} against ${loser.name}.`
      : `${winner.name} ${template} in round ${round} against ${loser.name}.`;

  // Second sentence grounds it in the actual matchup instead of just being
  // more flavor text — same idea whether you're reading this on the
  // Results screen or expanding a Feed item, since both pull from here.
  const strikingGap = winner.striking - loser.striking;
  const grapplingGap = winner.grappling - loser.grappling;
  const wasUpset = winner.eloRating < loser.eloRating - 50;

  let context: string;
  if (method === "Decision") {
    if (Math.abs(strikingGap) >= Math.abs(grapplingGap)) {
      context =
        strikingGap >= 0
          ? `${winner.name}'s striking was the difference on the cards.`
          : `${loser.name} actually had the better striking numbers, but ${winner.name} did enough elsewhere for the judges.`;
    } else {
      context =
        grapplingGap >= 0
          ? `Control on the mat is what won ${winner.name} the decision.`
          : `${loser.name} had the wrestling edge, but couldn't turn it into enough offense to take the cards.`;
    }
  } else if (wasUpset) {
    context = `A real statement finish against a fighter many had rated above them.`;
  } else {
    context =
      strikingGap >= grapplingGap
        ? `Clean striking is what got it done.`
        : `Relentless grappling pressure is what got it done.`;
  }

  return `${opener} ${context}`;
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
  // Doctor stoppages are pure bad luck — a cut doesn't care how good either
  // fighter is, so this rolls BEFORE any stat-based chances and at a flat
  // rate regardless of who's winning.
  if (Math.random() < 0.025) return "Doctor Stoppage";

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

  // Elo update — this is what actually drives ranking movement, not win
  // count. Beating someone rated well above you (like a champion) gains a
  // lot; beating someone rated below you gains little. Losing to someone
  // rated well above you (the champ) costs very little — that's expected.
  // Losing to someone rated below you costs a lot, since that's the real
  // upset.
  //
  // K is NOT flat — it scales with how the fight actually ended. A decision
  // win over someone you were expected to beat should barely move the
  // needle (that's the "#2 beats #3, nobody reacts" case). A first-round
  // finish is a statement and needs to actually shake the division up, the
  // way a real dominant performance would. This mirrors how modern
  // objective UFC-style rankings weigh "win type" as its own input, not
  // just win/loss.
  const K =
    outcome.method === "KO/TKO"
      ? 40
      : outcome.method === "Submission"
      ? 36
      : 22; // Decision — smallest movement, closest to "as expected"

  const expectedWinner =
    1 / (1 + Math.pow(10, (loser.eloRating - winner.eloRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  // Ladder bonus — real rankings behave like a ladder as much as a rating:
  // beat someone ranked clearly above you and you visibly climb, on top of
  // whatever Elo alone would give you. Lower ranking number = better spot,
  // so a positive gap here means the winner reached UP the ladder.
  //
  // An unranked fighter (a debut, a fresh signee) is treated as sitting at
  // the bottom of a deep division for this math — otherwise beating a #1
  // contender while unranked yourself gave NO ladder bonus at all, since
  // the old check required both fighters to already have a number. That's
  // exactly backwards: an unknown KO'ing the #1 contender is the biggest
  // possible upset, not a non-event.
  const UNRANKED_SENTINEL = 50;
  const winnerEffectiveRank = winner.ranking ?? UNRANKED_SENTINEL;
  const loserEffectiveRank = loser.ranking ?? UNRANKED_SENTINEL;
  const rankGap =
    loserEffectiveRank < winnerEffectiveRank ? winnerEffectiveRank - loserEffectiveRank : 0;
  const ladderBonus = Math.min(rankGap * 4, 40); // capped — one fight shouldn't be able to guarantee an infinite jump

  // Symmetric on the way down: losing to someone ranked well below you (or
  // a total unknown) should cost real ground on top of the standard Elo
  // dip, not just whatever the raw rating gap implied.
  const upsetLossPenalty = rankGap >= 5 ? Math.min(rankGap * 2, 20) : 0;

  const winnerEloChange = Math.round(K * (1 - expectedWinner) + ladderBonus);
  const loserEloChange = Math.round(K * (0 - expectedLoser) - upsetLossPenalty);

  const updatedWinner: Fighter = {
    ...winner,
    wins: winner.wins + 1,
    promotionWins: winner.promotionWins + 1,
    momentum: "hot",
    health: "fine", // wins rarely bring meaningful downtime
    weeksUntilAvailable: outcome.method === "Decision" ? 2 : 3,
    fanHeat: clamp(winner.fanHeat + fanHeatGain(outcome), 0, 100),
    fame: winner.fame + fameGain,
    eloRating: winner.eloRating + winnerEloChange,
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
    promotionLosses: loser.promotionLosses + 1,
    momentum: "cold",
    health: outcome.loserInjury ? "injured" : outcome.method === "KO/TKO" ? "nursing" : "fine",
    weeksUntilAvailable: outcome.loserInjury
      ? randomInRange(14, 24) // real time out, not the usual few-week cooldown
      : cooldownForLoss(outcome.method),
    isRetired: outcome.loserInjury === "career_ending" ? true : loser.isRetired,
    // A severe injury leaves permanent wear — chin and cardio never fully
    // come back the same after something like this.
    chin:
      outcome.loserInjury === "severe"
        ? Math.max(1, loser.chin - randomInRange(5, 10))
        : loser.chin,
    cardio:
      outcome.loserInjury === "severe"
        ? Math.max(1, loser.cardio - randomInRange(3, 7))
        : loser.cardio,
    fanHeat: clamp(loser.fanHeat - 2, 0, 100), // losing rarely kills fan heat much, upsets can even boost it later
    eloRating: loser.eloRating + loserEloChange,
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

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
