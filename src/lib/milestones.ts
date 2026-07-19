import { Fighter, FeedItem } from "@/types/game";
import { getCurrentWinStreak } from "./records";

// ============================================
// STREAK MILESTONES
// ============================================

const STREAK_MILESTONES = [3, 5, 8, 10, 15];

const OUTLETS = ["MMA Wire", "Cage Report", "Fight Central", "The Scrap Sheet"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// RECORD HELPERS
// ============================================

/**
 * Highest win total among all OTHER active fighters in the given division
 * (or across everyone, if weightClass is omitted). Used to detect the
 * exact moment someone's win total overtakes it.
 */
function maxWinsExcluding(
  roster: Fighter[],
  excludeId: string,
  weightClass?: string
): number {
  const pool = roster.filter(
    (f) =>
      f.id !== excludeId &&
      !f.isRetired &&
      (weightClass ? f.weightClass === weightClass : true)
  );
  if (pool.length === 0) return 0;
  return Math.max(...pool.map((f) => f.wins));
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Checks every fighter who competed this card for streak milestones and
 * record-breaking win totals. Compares PRE-fight roster (to know what the
 * record was before) against POST-fight roster (to know what changed),
 * so each milestone only fires exactly once, the moment it's actually hit.
 */
export function generateMilestoneNews(
  fightedFighterIds: Set<string>,
  preFightRoster: Fighter[],
  postFightRoster: Fighter[],
  promotionName: string,
  week: number
): FeedItem[] {
  const items: FeedItem[] = [];
  const preMap = new Map(preFightRoster.map((f) => [f.id, f]));

  for (const fighterId of fightedFighterIds) {
    const post = postFightRoster.find((f) => f.id === fighterId);
    const pre = preMap.get(fighterId);
    if (!post || !pre) continue;

    const didWin = post.wins > pre.wins;
    if (!didWin) continue;

    // --- Streak milestone ---
    const streak = getCurrentWinStreak(post);
    if (STREAK_MILESTONES.includes(streak)) {
      items.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: pick(OUTLETS),
        content: `${post.name} is now on a ${streak}-fight win streak — one of the hottest runs in the division right now.`,
        relatedFighterIds: [fighterId],
      });
    }

    // --- Divisional record ---
    const priorDivisionMax = maxWinsExcluding(preFightRoster, fighterId, post.weightClass);
    if (post.wins > priorDivisionMax && pre.wins <= priorDivisionMax) {
      items.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: pick(OUTLETS),
        content: `${post.name} breaks the record for most wins in ${promotionName}'s ${post.weightClass} division.`,
        relatedFighterIds: [fighterId],
      });
    }

    // --- All-time, all-division record ---
    const priorAllTimeMax = maxWinsExcluding(preFightRoster, fighterId);
    if (post.wins > priorAllTimeMax && pre.wins <= priorAllTimeMax) {
      items.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: pick(OUTLETS),
        content: `${post.name} now holds the all-time wins record across every division in ${promotionName} history.`,
        relatedFighterIds: [fighterId],
      });
    }
  }

  return items;
}
