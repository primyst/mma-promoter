import { Fighter } from "@/types/game";

/**
 * Derives a fighting style label purely from stats — deliberately NOT
 * stored on the fighter object, since it should always reflect their
 * current stats (which can shift slightly with weight class moves, etc.)
 * rather than being frozen at generation time.
 */
export function getFightingStyle(fighter: Fighter): string {
  const { striking, grappling, cardio, chin } = fighter;

  const strikingLead = striking - grappling;

  if (Math.abs(strikingLead) <= 5) {
    return "Well-Rounded";
  }
  if (strikingLead > 15) {
    return chin >= 75 ? "Brawler" : "Striker";
  }
  if (strikingLead > 5) {
    return "Striker";
  }
  if (strikingLead < -15) {
    return cardio >= 75 ? "Wrestler" : "Grappler";
  }
  return "Grappler";
}
