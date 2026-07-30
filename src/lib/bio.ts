import { Fighter } from "@/types/game";
import { getFightingStyle } from "./fightingStyle";

// ============================================
// BIO GENERATOR
// ============================================
//
// Deliberately NOT stored on the fighter — derived at render time from
// stuff that's already on the fighter (country, hometown, personality,
// record, style), the same pattern as getFightingStyle(). Keeps it
// consistent even if e.g. their style shifts after a weight class move.

const PERSONALITY_BLURBS: Record<Fighter["personality"], string> = {
  Loyal:
    "Fiercely loyal to whoever gave them a shot — camp and promotion loyalty mean more to them than chasing the biggest paycheck.",
  Mercenary:
    "Business first. They'll fight anyone, anywhere, for the right number — loyalty to a promotion only goes as far as the purse.",
  Prideful:
    "Carries themselves like a star whether they're ranked or not — quick to feel disrespected by a lowball offer or a mismatch beneath them.",
  Humble:
    "Lets the performances speak for themselves — easygoing outside the cage, rarely makes noise about money or rankings.",
};

/**
 * A short 2-sentence bio: where they're from + how they fight, then a
 * personality-driven second sentence. Not meant to replace the stat
 * block — this is flavor, the "why should I care about this fighter"
 * a real broadcast bio would give you.
 */
export function generateBio(fighter: Fighter): string {
  const style = getFightingStyle(fighter);
  const originLine = `Out of ${fighter.hometown}, ${fighter.country} — a ${style.toLowerCase()} through and through.`;
  return `${originLine} ${PERSONALITY_BLURBS[fighter.personality]}`;
}
