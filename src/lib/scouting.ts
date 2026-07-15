import { Fighter, WeightClass } from "@/types/game";
import { generateFighter } from "./generateRoster";

// ============================================
// SCOUTING TIERS
// ============================================

export type ScoutTier = "standard" | "premium";

export interface ScoutTierInfo {
  cost: number;
  breakoutChance: number;
  label: string;
  description: string;
}

export const SCOUT_TIERS: Record<ScoutTier, ScoutTierInfo> = {
  standard: {
    cost: 6000,
    breakoutChance: 0.04,
    label: "Standard Scouting",
    description: "A regional search — cheap, but breakout talent is rare.",
  },
  premium: {
    cost: 15000,
    breakoutChance: 0.12,
    label: "Premium Scouting",
    description: "International reach — costs more, better odds of finding a real prospect.",
  },
};

// ============================================
// SCOUT RESULT
// ============================================

export interface ScoutResult {
  cost: number;
  candidates: Fighter[];
}

/**
 * Sends scouts to find prospects in a given weight class. Always costs
 * money up front regardless of what turns up — that's the real risk of
 * scouting, same as in real life. Returns 3 unsigned candidates; at most
 * one can be a rare "breakout" find with real upside.
 */
export function scoutForTalent(
  weightClass: WeightClass,
  tier: ScoutTier
): ScoutResult {
  const tierInfo = SCOUT_TIERS[tier];
  const hasBreakout = Math.random() < tierInfo.breakoutChance;
  const breakoutIndex = hasBreakout ? Math.floor(Math.random() * 3) : -1;

  const candidates = Array.from({ length: 3 }, (_, i) =>
    generateFighter({
      weightClass,
      tier: i === breakoutIndex ? "breakout" : "prospect",
    })
  );

  return { cost: tierInfo.cost, candidates };
}
