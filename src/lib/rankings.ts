import { Fighter } from "@/types/game";

/**
 * Recalculates ranking numbers for every division based on current
 * win-loss record. Call this after every simulated card — rankings are
 * NOT static, they need to reflect the roster's current state, including:
 *
 * - A former champion who just lost the belt needs a real number again
 *   (previously they'd keep `ranking: null` forever since champions never
 *   carried a number, leaving them stuck displaying as "–").
 * - A new champion needs their OLD contender ranking cleared (previously
 *   they'd keep showing their pre-title number even after winning the belt).
 * - Anyone else whose win-loss record shifted should reshuffle naturally.
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
    const contenders = fighters
      .filter((f) => !f.isChampion)
      .sort((a, b) => b.wins - b.losses - (a.wins - a.losses));

    contenders.forEach((fighter, index) => {
      rankingById.set(fighter.id, index); // #1 contender = index 0
    });

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
