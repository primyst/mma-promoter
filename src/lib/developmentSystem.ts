import { Fighter } from "@/types/game";

// ============================================
// DEVELOPMENT SYSTEM
// ============================================
//
// Runs once per in-game year (alongside aging) and nudges a fighter's
// four core stats up or down. Direction and size depend on:
//   - their hidden `potential` tier (never shown in any UI)
//   - their age relative to a rough athletic curve
//
// This is deliberately separate from `potential` itself: potential is a
// fixed ceiling/floor rolled at creation, development is the yearly stat
// movement that plays out against that ceiling. Two "good" potential
// fighters can still develop differently year to year because each stat
// rolls its own delta.

type Stat = "striking" | "grappling" | "cardio" | "chin";
const STATS: Stat[] = ["striking", "grappling", "cardio", "chin"];

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampStat(value: number): number {
  return Math.max(1, Math.min(99, value));
}

/**
 * Base yearly delta range [min, max] for a stat, before potential is
 * applied. Young fighters (under 27) are still improving; 27-32 is
 * roughly prime (mostly flat); past 32 stats start eroding, faster the
 * older they get.
 */
function ageCurveRange(age: number): [number, number] {
  if (age < 23) return [1, 5]; // still raw, biggest growth window
  if (age < 27) return [0, 4]; // still climbing
  if (age <= 32) return [-1, 2]; // prime — roughly flat, slight variance
  if (age <= 36) return [-4, 0]; // early decline
  return [-7, -2]; // hard decline
}

/**
 * Potential shifts the age-curve range up or down. Elite potential means
 * a fighter grows faster young and erodes slower old; bad potential means
 * the opposite — growth is stunted even young, and decline hits harder.
 */
function potentialShift(potential: Fighter["potential"]): number {
  switch (potential) {
    case "elite":
      return 2;
    case "good":
      return 1;
    case "neutral":
      return 0;
    case "bad":
      return -2;
  }
}

/**
 * Applies one year of development to a single fighter, returning a new
 * Fighter object with updated stats. Retired fighters are untouched.
 */
export function developFighter(fighter: Fighter): Fighter {
  if (fighter.isRetired) return fighter;

  const [rangeMin, rangeMax] = ageCurveRange(fighter.age);
  const shift = potentialShift(fighter.potential);

  const updates: Partial<Record<Stat, number>> = {};
  for (const stat of STATS) {
    const delta = randomInRange(rangeMin + shift, rangeMax + shift);
    updates[stat] = clampStat(fighter[stat] + delta);
  }

  return { ...fighter, ...updates };
}

/**
 * Applies one year of development across a whole roster (and free-agent
 * pool, since unsigned fighters age and develop too — a scouted green
 * prospect you passed on can quietly turn into a real prospect by the
 * time you look again).
 */
export function developRoster(fighters: Fighter[]): Fighter[] {
  return fighters.map(developFighter);
}
