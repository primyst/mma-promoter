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
/**
 * A promotion's reputation acts like brand prestige — a well-regarded
 * org can sign fighters for a bit less (fighters want to be part of
 * something respected), a poorly-regarded one has to overpay to
 * convince anyone to sign. 50 reputation is neutral (1.0x).
 */
function reputationMultiplier(promotionReputation: number): number {
  return 1 - (promotionReputation - 50) / 200; // 100 rep -> 0.75x, 0 rep -> 1.25x
}

export function computeExpectedPurse(fighter: Fighter, promotionReputation: number = 50): number {
  const base = 2000 + fighter.fanHeat * 300 + (fighter.isChampion ? 15000 : 0);
  return Math.round(base * reputationMultiplier(promotionReputation));
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
 * Personality shifts where the accept/counter/reject lines fall:
 *   - Mercenary: hardest negotiator, wants closer to full value, counters high
 *   - Prideful: quick to feel disrespected by a lowball, rejects sooner
 *   - Loyal: reasonable, will meet you close to the middle
 *   - Humble: easiest signature, happy well below their own market value
 */
export function evaluateContractOffer(
  fighter: Fighter,
  fightsOffered: number,
  purseOffered: number,
  promotionReputation: number = 50
): ContractOfferResult {
  const expected = computeExpectedPurse(fighter, promotionReputation);
  const ratio = purseOffered / expected;

  const thresholds = {
    Mercenary: { accept: 0.97, reject: 0.65, counterAt: 0.95 },
    Prideful: { accept: 0.9, reject: 0.7, counterAt: 0.88 },
    Loyal: { accept: 0.85, reject: 0.55, counterAt: 0.8 },
    Humble: { accept: 0.75, reject: 0.45, counterAt: 0.7 },
  }[fighter.personality];

  if (ratio >= thresholds.accept) {
    return {
      outcome: "accepted",
      message: `${fighter.name} signed a ${fightsOffered}-fight deal at $${purseOffered.toLocaleString()} per fight.`,
    };
  }

  if (ratio >= thresholds.reject) {
    const counterPurse = Math.round(expected * thresholds.counterAt);
    return {
      outcome: "countered",
      counterPurse,
      message: `${fighter.name}'s camp counters — they want $${counterPurse.toLocaleString()} per fight.`,
    };
  }

  return {
    outcome: "rejected",
    message:
      fighter.personality === "Prideful"
        ? `${fighter.name} is insulted by the offer and won't hear another number this week.`
        : `${fighter.name}'s camp turned down the offer, calling it disrespectful.`,
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
