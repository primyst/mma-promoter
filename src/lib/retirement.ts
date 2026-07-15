import { Fighter, TitleReign, FeedItem } from "@/types/game";
import { vacateTitle } from "./weightClassMove";

// ============================================
// RETIREMENT RISK
// ============================================

/**
 * Weekly retirement chance for a given fighter. Deliberately tiny per-week
 * numbers — this compounds over many weeks rather than firing often, so a
 * career winds down gradually instead of fighters vanishing constantly.
 *
 * Risk scales with:
 * - Age past 32 (real decline zone), ramping hard past 36
 * - Recent decline: a fighter losing more than they're winning lately
 *   retires sooner than one still performing well at the same age
 */
export function weeklyRetirementChance(fighter: Fighter): number {
  if (fighter.age < 32) return 0;

  const ageOver32 = fighter.age - 32;
  // Roughly: age 32 ~ 0.1%/week, age 36 ~ 1%/week, age 40 ~ 2.5%/week
  const baseChance = 0.001 + ageOver32 * ageOver32 * 0.00015;

  const recentLosses = fighter.recentFights
    .slice(0, 5)
    .filter((f) => f.result === "loss").length;
  const recentWins = fighter.recentFights
    .slice(0, 5)
    .filter((f) => f.result === "win").length;

  // A fighter losing more than winning lately is declining — retirement
  // becomes more likely. Still winning at the same age delays it.
  const declineMultiplier =
    recentLosses > recentWins ? 1.6 : recentWins > recentLosses ? 0.6 : 1.0;

  return Math.min(0.05, baseChance * declineMultiplier); // hard cap so it's never near-certain in one roll
}

/**
 * Rolls retirement for a single fighter. Call this once per fighter per
 * week — champions and fighters mid-cooldown are still eligible to age
 * out, retirement isn't gated by booking status.
 */
export function rollRetirement(fighter: Fighter): boolean {
  if (fighter.isRetired) return false;
  return Math.random() < weeklyRetirementChance(fighter);
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export interface RetirementProcessResult {
  roster: Fighter[];
  titleHistory: TitleReign[];
  feedItems: FeedItem[];
}

/**
 * Runs once per week regardless of whether a card happened — ages
 * fighters up once per in-game year (52 weeks) and rolls retirement for
 * everyone active. Handles title vacancy automatically if a reigning
 * champion retires.
 */
export function processWeeklyAgingAndRetirement(
  roster: Fighter[],
  titleHistory: TitleReign[],
  currentWeek: number
): RetirementProcessResult {
  const shouldAge = currentWeek > 0 && currentWeek % 52 === 0;

  const aged = shouldAge
    ? roster.map((f) => (f.isRetired ? f : { ...f, age: f.age + 1 }))
    : roster;

  const feedItems: FeedItem[] = [];
  let updatedTitleHistory = titleHistory;

  const finalRoster = aged.map((fighter) => {
    if (fighter.isRetired) return fighter;
    if (!rollRetirement(fighter)) return fighter;

    if (fighter.isChampion) {
      updatedTitleHistory = vacateTitle(updatedTitleHistory, fighter.id, currentWeek);
    }

    feedItems.push({
      id: crypto.randomUUID(),
      type: "news",
      week: currentWeek,
      authorName: "MMA Wire",
      content: `${fighter.name} has announced retirement, closing out a career at ${fighter.wins}-${fighter.losses}-${fighter.draws}.`,
      relatedFighterIds: [fighter.id],
    });

    return { ...fighter, isRetired: true, isChampion: false };
  });

  return { roster: finalRoster, titleHistory: updatedTitleHistory, feedItems };
}
