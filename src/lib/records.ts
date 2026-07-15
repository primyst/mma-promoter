import { Fighter, TitleReign } from "@/types/game";

// ============================================
// LEADERBOARD ENTRY TYPE
// ============================================

export interface LeaderboardEntry {
  fighterId: string;
  fighterName: string;
  value: number;
  label: string; // e.g. "18 wins", "5 defenses"
}

// ============================================
// INDIVIDUAL LEADERBOARDS
// ============================================

export function getMostWins(roster: Fighter[], limit: number = 10): LeaderboardEntry[] {
  return [...roster]
    .filter((f) => f.wins > 0)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit)
    .map((f) => ({
      fighterId: f.id,
      fighterName: f.name,
      value: f.wins,
      label: `${f.wins} win${f.wins !== 1 ? "s" : ""}`,
    }));
}

export function getBestRecord(roster: Fighter[], limit: number = 10): LeaderboardEntry[] {
  return [...roster]
    .filter((f) => f.wins + f.losses > 0)
    .sort((a, b) => b.wins - b.losses - (a.wins - a.losses))
    .slice(0, limit)
    .map((f) => ({
      fighterId: f.id,
      fighterName: f.name,
      value: f.wins - f.losses,
      label: `${f.wins}-${f.losses}-${f.draws}`,
    }));
}

export function getMostFinishes(roster: Fighter[], limit: number = 10): LeaderboardEntry[] {
  return [...roster]
    .map((f) => {
      const finishes = f.recentFights.filter(
        (fight) => fight.result === "win" && fight.method !== "Decision"
      ).length;
      return { fighter: f, finishes };
    })
    .filter((entry) => entry.finishes > 0)
    .sort((a, b) => b.finishes - a.finishes)
    .slice(0, limit)
    .map((entry) => ({
      fighterId: entry.fighter.id,
      fighterName: entry.fighter.name,
      value: entry.finishes,
      label: `${entry.finishes} finish${entry.finishes !== 1 ? "es" : ""}`,
    }));
}

export function getMostTitleDefenses(
  titleHistory: TitleReign[],
  limit: number = 10
): LeaderboardEntry[] {
  // A fighter may have held multiple reigns (lost and regained the title) —
  // sum defenses across all their reigns for a true career total.
  const totalsByFighter = new Map<string, { name: string; total: number }>();

  for (const reign of titleHistory) {
    const existing = totalsByFighter.get(reign.championId);
    if (existing) {
      existing.total += reign.defenses;
    } else {
      totalsByFighter.set(reign.championId, {
        name: reign.championName,
        total: reign.defenses,
      });
    }
  }

  return Array.from(totalsByFighter.entries())
    .filter(([, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([fighterId, data]) => ({
      fighterId,
      fighterName: data.name,
      value: data.total,
      label: `${data.total} defense${data.total !== 1 ? "s" : ""}`,
    }));
}

export function getMostFanHeat(roster: Fighter[], limit: number = 10): LeaderboardEntry[] {
  return [...roster]
    .filter((f) => !f.isRetired)
    .sort((a, b) => b.fanHeat - a.fanHeat)
    .slice(0, limit)
    .map((f) => ({
      fighterId: f.id,
      fighterName: f.name,
      value: f.fanHeat,
      label: `${f.fanHeat} heat`,
    }));
}

export function getLongestReign(
  titleHistory: TitleReign[],
  currentWeek: number,
  limit: number = 10
): LeaderboardEntry[] {
  return [...titleHistory]
    .map((reign) => ({
      reign,
      length: (reign.endWeek ?? currentWeek) - reign.startWeek,
    }))
    .filter((entry) => entry.length > 0)
    .sort((a, b) => b.length - a.length)
    .slice(0, limit)
    .map((entry) => ({
      fighterId: entry.reign.championId,
      fighterName: entry.reign.championName,
      value: entry.length,
      label: `${entry.length} week${entry.length !== 1 ? "s" : ""} (${entry.reign.weightClass})`,
    }));
}

// ============================================
// POUND-FOR-POUND
// ============================================

/**
 * Current win streak counted from the most recent fight backwards until
 * the first loss. Not a career-long stat — this resets the moment a
 * fighter loses, which is exactly what P4P lists care about (who's hot
 * RIGHT NOW, not who was hot two years ago).
 */
function getCurrentWinStreak(fighter: Fighter): number {
  let streak = 0;
  for (const fight of fighter.recentFights) {
    if (fight.result === "win") streak++;
    else break;
  }
  return streak;
}

/**
 * Composite pound-for-pound score. This is deliberately NOT just "most
 * wins" — it rewards CURRENT dominance: being champion, actively
 * defending, finishing fights (not just winning them), and being on a
 * hot streak right now. A retired legend with 30 career wins shouldn't
 * outrank an active champion on an 8-fight win streak, and this formula
 * reflects that by weighting recency and finishes over sheer volume.
 */
export function getPoundForPound(
  roster: Fighter[],
  titleHistory: TitleReign[],
  limit: number = 10
): LeaderboardEntry[] {
  const defensesByFighter = new Map<string, number>();
  for (const reign of titleHistory) {
    defensesByFighter.set(
      reign.championId,
      (defensesByFighter.get(reign.championId) ?? 0) + reign.defenses
    );
  }

  return roster
    .filter((f) => !f.isRetired && f.wins + f.losses > 0)
    .map((fighter) => {
      const finishes = fighter.recentFights.filter(
        (fight) => fight.result === "win" && fight.method !== "Decision"
      ).length;
      const streak = getCurrentWinStreak(fighter);
      const defenses = defensesByFighter.get(fighter.id) ?? 0;

      const score =
        (fighter.isChampion ? 40 : 0) +
        streak * 8 +
        fighter.wins * 2 +
        finishes * 5 +
        defenses * 10 +
        fighter.fanHeat * 0.5;

      return { fighter, score, streak, defenses };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ fighter, score, streak }) => ({
      fighterId: fighter.id,
      fighterName: fighter.name,
      value: Math.round(score),
      label: fighter.isChampion
        ? `Champion · ${streak}-fight streak`
        : `${streak}-fight streak · ${fighter.weightClass}`,
    }));
}
