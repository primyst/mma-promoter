import { Fighter, WeightClass, WEIGHT_CLASS_ORDER, TitleReign } from "@/types/game";

// ============================================
// ADJACENT DIVISION LOOKUP
// ============================================

export interface AdjacentDivisions {
  up: WeightClass | null;
  down: WeightClass | null;
}

export function getAdjacentDivisions(current: WeightClass): AdjacentDivisions {
  const index = WEIGHT_CLASS_ORDER.indexOf(current);
  return {
    down: index > 0 ? WEIGHT_CLASS_ORDER[index - 1] : null,
    up: index < WEIGHT_CLASS_ORDER.length - 1 ? WEIGHT_CLASS_ORDER[index + 1] : null,
  };
}

// ============================================
// ELIGIBILITY
// ============================================

export interface WeightMoveEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Checks whether a fighter can move weight class right now.
 * Real-life-ish constraints: can't be mid-cooldown/injured (their body's
 * already under strain), and moving weight is a whole-camp decision so it
 * can't be done back-to-back every week.
 */
export function checkWeightMoveEligibility(fighter: Fighter): WeightMoveEligibility {
  if (fighter.isRetired) {
    return { eligible: false, reason: "Retired" };
  }
  if (fighter.contractFightsRemaining === null) {
    return { eligible: false, reason: "Free agent — sign a contract first" };
  }
  if (fighter.health === "injured") {
    return { eligible: false, reason: "Can't change weight while injured" };
  }
  if (fighter.weeksUntilAvailable > 0) {
    return { eligible: false, reason: "Still on cooldown from last fight" };
  }
  return { eligible: true };
}

// ============================================
// APPLYING THE MOVE
// ============================================

export interface WeightMoveResult {
  updatedFighter: Fighter;
  vacatedTitle: boolean;
}

/**
 * Applies a weight class change to a fighter.
 *
 * Moving DOWN (cutting weight): harder on the body — cardio and chin take
 * a temporary hit for a few weeks while the fighter adjusts, and they need
 * a short settling-in period before they're bookable.
 *
 * Moving UP: easier physically (no hard cut), but they lose their built-up
 * ranking in the old division and start unranked in a division full of
 * naturally bigger opponents — represented here as no stat penalty, but
 * losing rank standing.
 *
 * Either direction: if the fighter was champion, the title is vacated —
 * you can't hold a belt in a division you no longer compete in.
 */
export function applyWeightClassMove(
  fighter: Fighter,
  direction: "up" | "down",
  targetClass: WeightClass
): WeightMoveResult {
  const wasChampion = fighter.isChampion;

  const cardioHit = direction === "down" ? Math.max(30, fighter.cardio - 12) : fighter.cardio;
  const chinHit = direction === "down" ? Math.max(30, fighter.chin - 8) : fighter.chin;
  const settlingWeeks = direction === "down" ? 4 : 2;

  const updatedFighter: Fighter = {
    ...fighter,
    weightClass: targetClass,
    ranking: null, // start unranked in the new division, must climb again
    isChampion: false, // title stays behind in the old division
    cardio: cardioHit,
    chin: chinHit,
    weeksUntilAvailable: settlingWeeks,
    momentum: "neutral", // moving divisions resets momentum narrative-wise
  };

  return { updatedFighter, vacatedTitle: wasChampion };
}

/**
 * If a title was vacated by a weight move, close out the reign in history.
 * Call alongside applyWeightClassMove when vacatedTitle is true.
 */
export function vacateTitle(
  titleHistory: TitleReign[],
  fighterId: string,
  week: number
): TitleReign[] {
  return titleHistory.map((r) =>
    r.championId === fighterId && r.endWeek === null
      ? { ...r, endWeek: week }
      : r
  );
}
