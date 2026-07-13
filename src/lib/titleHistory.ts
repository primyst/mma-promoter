import { Fighter, FightOutcome, BookedFight, TitleReign } from "@/types/game";

/**
 * Processes title fights from a card and returns an updated titleHistory
 * array. Call this after simulateCard(), passing the roster state BEFORE
 * fighter.isChampion flags get flipped elsewhere.
 *
 * Rules:
 * - If the outgoing champion wins (defends), increment defenses on the
 *   current open reign.
 * - If the challenger wins, close the outgoing champion's reign (set
 *   endWeek) and open a new reign for the new champion.
 */
export function updateTitleHistory(
  fights: BookedFight[],
  outcomes: FightOutcome[],
  rosterBeforeFight: Fighter[],
  titleHistory: TitleReign[],
  week: number
): TitleReign[] {
  let history = [...titleHistory];
  const rosterMap = new Map(rosterBeforeFight.map((f) => [f.id, f]));

  const titleFights = fights.filter((f) => f.isTitleFight);

  for (const fight of titleFights) {
    const outcome = outcomes.find((o) => o.fightId === fight.id);
    if (!outcome || !outcome.winnerId) continue;

    const fighterA = rosterMap.get(fight.fighterAId);
    const fighterB = rosterMap.get(fight.fighterBId);
    if (!fighterA || !fighterB) continue;

    const champion = fighterA.isChampion ? fighterA : fighterB;
    const challenger = fighterA.isChampion ? fighterB : fighterA;
    const winnerId = outcome.winnerId;

    if (winnerId === champion.id) {
      // Champion defended — bump defenses on their open reign
      const openReign = history.find(
        (r) => r.championId === champion.id && r.endWeek === null
      );
      if (openReign) {
        openReign.defenses += 1;
      }
    } else {
      // New champion — close old reign, open new one
      history = history.map((r) =>
        r.championId === champion.id && r.endWeek === null
          ? { ...r, endWeek: week }
          : r
      );
      history.push({
        weightClass: champion.weightClass,
        championId: challenger.id,
        championName: challenger.name,
        startWeek: week,
        endWeek: null,
        defenses: 0,
      });
    }
  }

  return history;
}

/**
 * Bootstraps initial title reigns for a starter roster's existing champions
 * (so day-one champions have a reign entry from week 1 instead of nothing).
 */
export function initTitleHistoryFromRoster(
  roster: Fighter[],
  startWeek: number = 1
): TitleReign[] {
  return roster
    .filter((f) => f.isChampion)
    .map((f) => ({
      weightClass: f.weightClass,
      championId: f.id,
      championName: f.name,
      startWeek,
      endWeek: null,
      defenses: 0,
    }));
}
