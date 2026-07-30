import { Fighter } from "@/types/game";

/**
 * Recalculates ranking numbers for every division based on current Elo
 * rating. Call this after every simulated card — rankings are NOT static,
 * they need to reflect the roster's current state, including:
 *
 * - A former champion who just lost the belt needs a real number again
 *   (previously they'd keep `ranking: null` forever since champions never
 *   carried a number, leaving them stuck displaying as "–").
 * - A new champion needs their OLD contender ranking cleared (previously
 *   they'd keep showing their pre-title number even after winning the belt).
 * - Anyone else whose Elo shifted should reshuffle naturally — beating a
 *   higher-rated opponent can vault someone past several fighters at once,
 *   exactly like a real ranking panel reacting to a statement win.
 *
 * Sorting by Elo (not win-loss differential) is what makes rankings behave
 * realistically: losing to the champion barely moves you, since Elo expects
 * that outcome; losing to someone ranked below you costs a lot, since
 * that's the actual upset. Win-loss differential can't tell those apart.
 *
 * Retired fighters are excluded from ranking entirely.
 */
export function recalculateRankings(roster: Fighter[]): Fighter[] {
  const byDivision = new Map<string, Fighter[]>();

  for (const fighter of roster) {
    if (fighter.isRetired) continue;
    const list = byDivision.get(fighter.weightClass) ?? [];
    list.push(fighter);
    byDivision.set(fighter.weightClass, list);
  }

  const rankingById = new Map<string, number | null>();

  for (const [, fighters] of byDivision) {
    const champion = fighters.find((f) => f.isChampion);

    // A fighter who hasn't actually competed under this promotion yet
    // stays unranked no matter how hyped their (pregenerated) backstory
    // record or Elo looks — real orgs don't hand out a top-5 ranking to
    // someone who just signed and hasn't fought for them once.
    const hasPromotionFights = (f: Fighter) =>
      f.promotionWins + f.promotionLosses + f.promotionDraws > 0;

    const contenders = fighters
      .filter((f) => !f.isChampion && hasPromotionFights(f))
      .sort((a, b) => b.eloRating - a.eloRating);

    contenders.forEach((fighter, index) => {
      rankingById.set(fighter.id, index); // #1 contender = index 0
    });

    for (const fighter of fighters) {
      if (!fighter.isChampion && !hasPromotionFights(fighter)) {
        rankingById.set(fighter.id, null); // unranked debut
      }
    }

    if (champion) {
      rankingById.set(champion.id, null); // champions carry no number
    }
  }

  return roster.map((fighter) => {
    if (fighter.isRetired) return fighter;
    return {
      ...fighter,
      ranking: rankingById.has(fighter.id)
        ? rankingById.get(fighter.id)!
        : fighter.ranking,
    };
  });
}
