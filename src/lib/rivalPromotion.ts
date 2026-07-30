import { Fighter, FeedItem, RivalPromotion, WeightClass } from "@/types/game";
import { generateFighter, WEIGHT_CLASSES } from "./generateRoster";
import { simulateFight, applyFightResult } from "./fightSim";

const RIVAL_NAMES = [
  { name: "Titan Fighting Alliance", abbreviation: "TFA" },
  { name: "Apex Combat League", abbreviation: "ACL" },
  { name: "Iron Circle FC", abbreviation: "ICFC" },
  { name: "Vanguard Fighting Championship", abbreviation: "VFC" },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Builds the rival's starting roster — a mix of contenders and prospects
 * across every weight class, so they feel like a real competing org from
 * day one instead of an empty shell that only fills in over time.
 */
export function generateRivalPromotion(): RivalPromotion {
  const identity = randomFrom(RIVAL_NAMES);
  const roster: Fighter[] = [];

  for (const weightClass of WEIGHT_CLASSES) {
    const tier = Math.random() < 0.15 ? "contender" : "prospect";
    const fighter = generateFighter({ weightClass, tier });
    fighter.contractFightsRemaining = 6;
    roster.push(fighter);
  }

  return { name: identity.name, abbreviation: identity.abbreviation, roster };
}

export interface RivalTickResult {
  rival: RivalPromotion;
  freeAgents: Fighter[];
  feedItems: FeedItem[];
}

/**
 * Runs one week of the rival promotion's own life, independent of anything
 * the player does — this is what makes the world feel alive even in weeks
 * the player doesn't act. Each week, small chances of:
 *   - poaching a free agent off the shared market
 *   - running an internal fight card among their own roster
 *   - releasing a fighter back to free agency (poachable by the player too)
 */
export function tickRivalPromotion(
  rival: RivalPromotion,
  freeAgents: Fighter[],
  week: number
): RivalTickResult {
  let updatedRoster = [...rival.roster];
  let updatedFreeAgents = [...freeAgents];
  const feedItems: FeedItem[] = [];

  // --- Poaching: rival signs a free agent off the shared market ---
  if (updatedFreeAgents.length > 0 && Math.random() < 0.12) {
    const index = Math.floor(Math.random() * updatedFreeAgents.length);
    const signed = { ...updatedFreeAgents[index], contractFightsRemaining: 6 };
    updatedFreeAgents = updatedFreeAgents.filter((_, i) => i !== index);
    updatedRoster = [...updatedRoster, signed];

    feedItems.push({
      id: crypto.randomUUID(),
      type: "news",
      week,
      authorName: "MMA Wire",
      content: `${signed.name} has signed with ${rival.name}, bypassing free agency entirely.`,
      relatedFighterIds: [signed.id],
    });
  }

  // --- Internal fight card: two same-division rival fighters throw down ---
  if (Math.random() < 0.35) {
    const byDivision = new Map<WeightClass, Fighter[]>();
    for (const f of updatedRoster) {
      if (f.isRetired) continue;
      byDivision.set(f.weightClass, [...(byDivision.get(f.weightClass) ?? []), f]);
    }
    const eligibleDivisions = [...byDivision.entries()].filter(([, fs]) => fs.length >= 2);

    if (eligibleDivisions.length > 0) {
      const [, fighters] = randomFrom(eligibleDivisions);
      const shuffled = [...fighters].sort(() => Math.random() - 0.5);
      const [fighterA, fighterB] = shuffled;

      const outcome = simulateFight(fighterA, fighterB, false);
      const { winner, loser } = applyFightResult(fighterA, fighterB, outcome, week);

      updatedRoster = updatedRoster.map((f) => {
        if (f.id === winner.id) return winner;
        if (f.id === loser.id) return loser;
        return f;
      });

      feedItems.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: "MMA Wire",
        content: `${winner.name} defeated ${loser.name} via ${outcome.method} at a ${rival.name} event.`,
        detail: outcome.summary,
        relatedFighterIds: [winner.id, loser.id],
      });
    }
  }

  // --- Release: a rival fighter's deal lapses, they re-enter free agency ---
  const stillOnDeal = updatedRoster.filter((f) => {
    if (f.isRetired) return true;
    const releaseChance = 0.03;
    if (Math.random() < releaseChance) {
      updatedFreeAgents = [...updatedFreeAgents, { ...f, contractFightsRemaining: null }];
      feedItems.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: "MMA Wire",
        content: `${f.name} is now a free agent after parting ways with ${rival.name}.`,
        relatedFighterIds: [f.id],
      });
      return false;
    }
    return true;
  });

  return {
    rival: { ...rival, roster: stillOnDeal },
    freeAgents: updatedFreeAgents,
    feedItems,
  };
}
