import { Fighter } from "@/types/game";

// ============================================
// EXPECTED PURSE
// ============================================

/**
 * A fighter's "expected" purse based on how big a draw they are right now.
 * Used to judge whether an offer is fair — mirrors the same formula the
 * roster generator uses for starting purses, so re-signs feel consistent
 * with what a fighter was worth when first generated.
 */
export function computeExpectedPurse(fighter: Fighter): number {
  return 2000 + fighter.fanHeat * 300 + (fighter.isChampion ? 15000 : 0);
}

// ============================================
// CONTRACT OFFERS
// ============================================

export type OfferOutcome = "accepted" | "rejected" | "countered";

export interface ContractOfferResult {
  outcome: OfferOutcome;
  counterPurse?: number;
  message: string;
}

/**
 * Evaluates a contract offer against what the fighter actually expects.
 * - Offer at or above 90% of expectation: accepted outright.
 * - Offer between 60-90%: fighter counters with something in between.
 * - Offer below 60%: flat rejection, they're insulted.
 */
export function evaluateContractOffer(
  fighter: Fighter,
  fightsOffered: number,
  purseOffered: number
): ContractOfferResult {
  const expected = computeExpectedPurse(fighter);
  const ratio = purseOffered / expected;

  if (ratio >= 0.9) {
    return {
      outcome: "accepted",
      message: `${fighter.name} signed a ${fightsOffered}-fight deal at $${purseOffered.toLocaleString()} per fight.`,
    };
  }

  if (ratio >= 0.6) {
    const counterPurse = Math.round(expected * 0.85);
    return {
      outcome: "countered",
      counterPurse,
      message: `${fighter.name}'s camp counters — they want $${counterPurse.toLocaleString()} per fight.`,
    };
  }

  return {
    outcome: "rejected",
    message: `${fighter.name}'s camp turned down the offer, calling it disrespectful.`,
  };
}

// ============================================
// FREE AGENCY
// ============================================

/**
 * Called when a fighter's contractFightsRemaining hits 0 after a fight.
 * They become a free agent — unbookable until re-signed, but they stay
 * on the roster (not deleted) so they can be re-signed later.
 */
export function expireContract(fighter: Fighter): Fighter {
  return { ...fighter, contractFightsRemaining: null };
}

/**
 * Decrements a fighter's remaining fight count after they compete.
 * Call this for BOTH participants of every simulated fight.
 */
export function decrementContract(fighter: Fighter): Fighter {
  if (fighter.contractFightsRemaining === null) return fighter;
  const remaining = fighter.contractFightsRemaining - 1;
  return remaining <= 0
    ? expireContract(fighter)
    : { ...fighter, contractFightsRemaining: remaining };
}
