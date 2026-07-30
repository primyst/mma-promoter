import { Fighter, BookedFight, CardTier, FightCard } from "@/types/game";

// ============================================
// ELIGIBILITY
// ============================================

export interface EligibilityCheck {
  eligible: boolean;
  reason?: string; // shown in UI if not eligible, e.g. "Injured — 4 weeks left"
}

/**
 * Single source of truth for "can this fighter be booked right now".
 * Every other function (roster list, matchup validation) should call this
 * instead of re-checking fields directly.
 *
 * `scheduledFighterIds` is every fighter already committed to a FUTURE
 * unsimulated card — without this, a fighter booked for Week 5 would still
 * show as "available" if you're booking Week 3, since nothing else tracks
 * that they're already spoken for until the fight actually happens.
 */
export function checkEligibility(
  fighter: Fighter,
  scheduledFighterIds: Set<string> = new Set()
): EligibilityCheck {
  if (fighter.isRetired) {
    return { eligible: false, reason: "Retired" };
  }
  if (fighter.contractFightsRemaining === null) {
    return { eligible: false, reason: "Free agent — not signed" };
  }
  if (scheduledFighterIds.has(fighter.id)) {
    return { eligible: false, reason: "Already booked on an upcoming card" };
  }
  if (fighter.health === "injured") {
    return {
      eligible: false,
      reason: `Injured — ${fighter.weeksUntilAvailable} week(s) left`,
    };
  }
  if (fighter.weeksUntilAvailable > 0) {
    return {
      eligible: false,
      reason: `On cooldown — ${fighter.weeksUntilAvailable} week(s) left`,
    };
  }
  return { eligible: true };
}

/**
 * Builds the set of fighter IDs already committed to any unsimulated card,
 * across all future weeks — not just the one being booked right now.
 */
export function getScheduledFighterIds(cards: FightCard[]): Set<string> {
  const ids = new Set<string>();
  for (const card of cards) {
    if (card.isSimulated) continue;
    for (const fight of card.fights) {
      ids.add(fight.fighterAId);
      ids.add(fight.fighterBId);
    }
  }
  return ids;
}

/**
 * Filters a roster down to fighters who can actually be booked. Pass the
 * full cards list so already-scheduled fighters get excluded correctly.
 */
export function getBookableFighters(
  roster: Fighter[],
  cards: FightCard[] = []
): Fighter[] {
  const scheduledFighterIds = getScheduledFighterIds(cards);
  return roster.filter((f) => checkEligibility(f, scheduledFighterIds).eligible);
}

// ============================================
// MATCHUP VALIDATION
// ============================================

export interface MatchupValidation {
  valid: boolean;
  warnings: string[]; // non-blocking, e.g. "Big ranking gap — fans may call this a mismatch"
  blockers: string[]; // blocking, e.g. "Different weight classes"
}

/**
 * Validates a proposed matchup. Blockers prevent booking entirely.
 * Warnings let the player book anyway but flag consequences (fan heat hit).
 */
export function validateMatchup(
  fighterA: Fighter,
  fighterB: Fighter,
  isTitleFight: boolean,
  divisionHasChampion: boolean = true,
  scheduledFighterIds: Set<string> = new Set()
): MatchupValidation {
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (fighterA.id === fighterB.id) {
    blockers.push("A fighter can't face themselves");
  }

  if (fighterA.weightClass !== fighterB.weightClass) {
    blockers.push("Fighters must be in the same weight class");
  }

  // Camp rule — real MMA gyms don't let their own fighters coach each
  // other in fight week and then throw hands on fight night. Teammates
  // are simply not bookable against each other.
  if (fighterA.teamId && fighterB.teamId && fighterA.teamId === fighterB.teamId) {
    blockers.push("Teammates from the same camp can't be booked against each other");
  }

  const eligA = checkEligibility(fighterA, scheduledFighterIds);
  const eligB = checkEligibility(fighterB, scheduledFighterIds);
  if (!eligA.eligible) blockers.push(`${fighterA.name}: ${eligA.reason}`);
  if (!eligB.eligible) blockers.push(`${fighterB.name}: ${eligB.reason}`);

  // Title fights normally require the reigning champion to be involved —
  // BUT if the division has no champion at all (brand new division, or a
  // vacated title with nobody crowned yet), two ranked contenders can
  // fight for the vacant belt instead.
  if (isTitleFight && divisionHasChampion) {
    if (!fighterA.isChampion && !fighterB.isChampion) {
      blockers.push("Title fight requires the current champion to be involved");
    }
  }

  // Ranking gap check (only meaningful if both are ranked)
  if (fighterA.ranking != null && fighterB.ranking != null) {
    const gap = Math.abs(fighterA.ranking - fighterB.ranking);
    if (gap >= 5) {
      warnings.push(
        "Large ranking gap — fans may see this as a mismatch, lower fan heat gain"
      );
      // A Prideful fighter being fed a much lower-ranked opponent (or
      // asked to face someone well above their own level) takes it as an
      // insult either way — they want to be tested against real competition.
      for (const f of [fighterA, fighterB]) {
        if (f.personality === "Prideful") {
          warnings.push(`${f.name} may see this booking as beneath them or unfair`);
        }
      }
    }
  }

  // Momentum mismatch (hot vs cold reads as "protecting" a fighter)
  if (fighterA.momentum !== fighterB.momentum) {
    const hotOne = fighterA.momentum === "hot" ? fighterA : fighterB;
    const coldOne = fighterA.momentum === "cold" ? fighterA : fighterB;
    if (hotOne.momentum === "hot" && coldOne.momentum === "cold") {
      warnings.push(
        `Booking a hot streak against a fighter on a cold streak may look like padding a record`
      );
    }
  }

  return { valid: blockers.length === 0, warnings, blockers };
}

// ============================================
// MATCHUP SUGGESTIONS
// ============================================

export interface SuggestedOpponent {
  fighter: Fighter;
  reason: string;
}

/**
 * Instead of dumping the whole division on the user, surface a short list
 * of matchups that actually make sense for this fighter: similar ranking
 * (a real title-eliminator type bout), or — for a champion — the very top
 * contenders who are actually next in line.
 */
export function getSuggestedOpponents(
  fighter: Fighter,
  candidates: Fighter[],
  limit: number = 5
): SuggestedOpponent[] {
  const sameDivision = candidates.filter(
    (c) => c.weightClass === fighter.weightClass && c.id !== fighter.id
  );

  if (fighter.isChampion) {
    // Top-ranked contenders are the realistic next title challengers.
    return sameDivision
      .filter((c) => c.ranking != null)
      .sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999))
      .slice(0, limit)
      .map((c) => ({
        fighter: c,
        reason: `#${(c.ranking ?? 0) + 1} contender`,
      }));
  }

  const myRank = fighter.ranking; // null = unranked

  return sameDivision
    .map((c) => {
      // Unranked fighters are treated as "far away" for sorting purposes,
      // so ranked opponents near the fighter's own spot bubble up first.
      const gap =
        myRank != null && c.ranking != null
          ? Math.abs(c.ranking - myRank)
          : 999;
      return { fighter: c, gap };
    })
    .sort((a, b) => a.gap - b.gap)
    .slice(0, limit)
    .map(({ fighter: c, gap }) => ({
      fighter: c,
      reason:
        c.isChampion
          ? "Champion"
          : c.ranking != null && myRank != null
          ? gap <= 1
            ? "Right next to you in the rankings"
            : `#${c.ranking + 1} · ${gap} spot${gap !== 1 ? "s" : ""} away`
          : c.ranking != null
          ? `#${c.ranking + 1} contender`
          : "Unranked",
    }));
}

/**
 * How a card's matchmaking quality nudges promotion reputation — booking
 * genuinely competitive fights (close in ranking, title fights) builds
 * credibility; stacking mismatches spends it. This is what gives
 * reputation an ordinary, ongoing input instead of only moving on rare
 * incidents/controversies.
 */
export function computeCardReputationDelta(
  fights: BookedFight[],
  rosterMap: Map<string, Fighter>
): number {
  let delta = 0;

  for (const fight of fights) {
    const a = rosterMap.get(fight.fighterAId);
    const b = rosterMap.get(fight.fighterBId);
    if (!a || !b) continue;

    if (fight.isTitleFight) {
      delta += 2; // a title fight happening at all is good for credibility
    }

    if (a.ranking != null && b.ranking != null) {
      const gap = Math.abs(a.ranking - b.ranking);
      if (gap <= 2) delta += 1; // genuinely competitive matchup
      else if (gap >= 8) delta -= 1; // clear mismatch
    }
  }

  return Math.max(-4, Math.min(4, delta));
}

/**
 * Checks a full proposed card: no fighter double-booked, at least one fight,
 * exactly one main event.
 */
export function validateCard(fights: BookedFight[]): MatchupValidation {
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (fights.length === 0) {
    blockers.push("Card needs at least one fight");
  }

  const mainEvents = fights.filter((f) => f.isMainEvent);
  if (mainEvents.length === 0) {
    blockers.push("Card needs a main event");
  } else if (mainEvents.length > 1) {
    blockers.push("Only one main event allowed per card");
  }

  const bookedFighterIds = new Set<string>();
  for (const fight of fights) {
    for (const id of [fight.fighterAId, fight.fighterBId]) {
      if (bookedFighterIds.has(id)) {
        blockers.push("A fighter can't appear twice on the same card");
      }
      bookedFighterIds.add(id);
    }
  }

  return { valid: blockers.length === 0, warnings, blockers };
}

// ============================================
// CARD TIER SUGGESTION (helps player understand what they're building)
// ============================================

/**
 * Suggests a card tier label based on the main event's stakes.
 * Purely informational for v0.1 — doesn't gate anything yet.
 */
export function suggestCardTier(fights: BookedFight[]): CardTier {
  const hasTitleFight = fights.some((f) => f.isTitleFight);
  if (hasTitleFight) return "Title Fight";

  const mainEvent = fights.find((f) => f.isMainEvent);
  if (!mainEvent) return "Main Card";

  return "Numbered Event";
}
