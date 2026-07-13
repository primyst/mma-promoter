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
