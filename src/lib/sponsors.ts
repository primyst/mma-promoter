import { Fighter, FightOutcome } from "@/types/game";

// ============================================
// SPONSOR DEFINITIONS
// ============================================

export type ObjectiveType = "win_next" | "finish_next" | "title_defense_win";

export interface Sponsor {
  id: string;
  name: string;
  minFameTier: number;
  objectiveType: ObjectiveType;
  objectiveLabel: string;
  payout: number;
}

// Fixed list, same every save — two sponsors per tier for tiers 1-3.
// Higher-tier sponsors ask for more (a finish, not just a win) and pay
// proportionally more.
export const SPONSOR_LIST: Sponsor[] = [
  {
    id: "grindwear",
    name: "GrindWear Apparel",
    minFameTier: 1,
    objectiveType: "win_next",
    objectiveLabel: "Win your next fight",
    payout: 8000,
  },
  {
    id: "ironfuel",
    name: "IronFuel Supplements",
    minFameTier: 1,
    objectiveType: "win_next",
    objectiveLabel: "Win your next fight",
    payout: 7000,
  },
  {
    id: "vantageenergy",
    name: "Vantage Energy Drinks",
    minFameTier: 2,
    objectiveType: "finish_next",
    objectiveLabel: "Finish your next opponent (KO/TKO or Submission)",
    payout: 18000,
  },
  {
    id: "blacktopwatches",
    name: "Blacktop Watches",
    minFameTier: 2,
    objectiveType: "win_next",
    objectiveLabel: "Win your next fight",
    payout: 15000,
  },
  {
    id: "summitmotors",
    name: "Summit Motors",
    minFameTier: 3,
    objectiveType: "title_defense_win",
    objectiveLabel: "Win your title defense",
    payout: 40000,
  },
  {
    id: "apexnutrition",
    name: "Apex Nutrition Global",
    minFameTier: 3,
    objectiveType: "finish_next",
    objectiveLabel: "Finish your next opponent (KO/TKO or Submission)",
    payout: 35000,
  },
];

export function getEligibleSponsors(fameTier: number): Sponsor[] {
  return SPONSOR_LIST.filter((s) => s.minFameTier <= fameTier);
}

// ============================================
// OBJECTIVE EVALUATION
// ============================================

/**
 * Checks whether a sponsor's objective was fulfilled by a single fight
 * outcome.
 */
export function checkSingleFightObjective(
  sponsor: Sponsor,
  fighterWon: boolean,
  wasChampionGoingIn: boolean,
  outcome: FightOutcome
): boolean {
  if (sponsor.objectiveType === "win_next") {
    return fighterWon;
  }
  if (sponsor.objectiveType === "finish_next") {
    return fighterWon && outcome.method !== "Decision";
  }
  if (sponsor.objectiveType === "title_defense_win") {
    return fighterWon && wasChampionGoingIn;
  }
  return false;
}
