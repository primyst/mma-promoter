import { Fighter, BookedFight, CardTier } from "@/types/game";

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
 */
export function checkEligibility(fighter: Fighter): EligibilityCheck {
  if (fighter.isRetired) {
    return { eligible: false, reason: "Retired" };
  }
  if (fighter.contractFightsRemaining === null) {
    return { eligible: false, reason: "Free agent — not signed" };
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
 * Filters a roster down to fighters who can actually be booked this week.
 * This is what populates the booking screen's fighter picker.
 */
export function getBookableFighters(roster: Fighter[]): Fighter[] {
  return roster.filter((f) => checkEligibility(f).eligible);
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
  isTitleFight: boolean
): MatchupValidation {
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (fighterA.id === fighterB.id) {
    blockers.push("A fighter can't face themselves");
  }

  if (fighterA.weightClass !== fighterB.weightClass) {
    blockers.push("Fighters must be in the same weight class");
  }

  const eligA = checkEligibility(fighterA);
  const eligB = checkEligibility(fighterB);
  if (!eligA.eligible) blockers.push(`${fighterA.name}: ${eligA.reason}`);
  if (!eligB.eligible) blockers.push(`${fighterB.name}: ${eligB.reason}`);

  if (isTitleFight) {
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
// CARD-LEVEL VALIDATION
// ============================================

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
