import { Fighter, FeedItem, WeightClass } from "@/types/game";

// A champion out this long or longer is "long-term" absent — real orgs
// crown an interim champion around the 6-9 month mark, this is roughly
// that on the game's week clock.
const LONG_TERM_ABSENCE_WEEKS = 12;

/**
 * Runs every week alongside the rest of the weekly tick. For each
 * division: if the real champion is out for a long stretch and nobody
 * currently holds the interim title, crown the #1 contender interim
 * champion. Once the real champion is medically clear again, the interim
 * title dissolves — a unification is the natural next step, which the
 * booking screen's suggestions already surface (the returning champion
 * gets shown their top contenders, which now includes the ex-interim
 * champ).
 */
export function processInterimTitles(
  roster: Fighter[],
  week: number
): { roster: Fighter[]; feedItems: FeedItem[] } {
  const feedItems: FeedItem[] = [];
  const byDivision = new Map<WeightClass, Fighter[]>();

  for (const f of roster) {
    if (f.isRetired) continue;
    byDivision.set(f.weightClass, [...(byDivision.get(f.weightClass) ?? []), f]);
  }

  const updates = new Map<string, Partial<Fighter>>();

  for (const [, fighters] of byDivision) {
    const champion = fighters.find((f) => f.isChampion);
    const currentInterim = fighters.find((f) => f.isInterimChampion);

    if (!champion) continue;

    const championIsLongTermOut = champion.weeksUntilAvailable >= LONG_TERM_ABSENCE_WEEKS;

    if (championIsLongTermOut && !currentInterim) {
      const topContender = fighters
        .filter((f) => !f.isChampion && f.ranking != null)
        .sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999))[0];

      if (topContender) {
        updates.set(topContender.id, { isInterimChampion: true });
        feedItems.push({
          id: crypto.randomUUID(),
          type: "news",
          week,
          authorName: "MMA Wire",
          content: `${topContender.name} is crowned interim ${topContender.weightClass} champion while ${champion.name} recovers from injury.`,
          relatedFighterIds: [topContender.id, champion.id],
        });
      }
    }

    if (!championIsLongTermOut && champion.weeksUntilAvailable === 0 && currentInterim) {
      updates.set(currentInterim.id, { isInterimChampion: false });
      feedItems.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: "MMA Wire",
        content: `${champion.name} is medically cleared to return — a unification bout with interim champion ${currentInterim.name} looms.`,
        relatedFighterIds: [champion.id, currentInterim.id],
      });
    }
  }

  if (updates.size === 0) {
    return { roster, feedItems: [] };
  }

  return {
    roster: roster.map((f) => (updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f)),
    feedItems,
  };
}
