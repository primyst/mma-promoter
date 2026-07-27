import { Promotion } from "@/types/game";

/**
 * All-caps acronym for event branding — distinct from the lowercase
 * @handle used for the social account. "My Promotion" -> "MP".
 */
export function getPromotionAcronym(promotionName: string): string {
  const words = promotionName.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toUpperCase();
  }
  return (words[0] ?? "PROMO").toUpperCase().slice(0, 4);
}

export interface EventNameResult {
  eventName: string;
  updatedPromotion: Promotion;
}

/**
 * Generates the branded name for a card and bumps the relevant counter.
 * Title fights get the flagship numbered treatment ("MP 12") since that's
 * genuinely the biggest kind of show; everything else is a "Fight Night"
 * with its own separate counter — matches how real promotions split their
 * numbered PPV-tier events from undercard-only shows.
 */
export function generateEventName(
  promotion: Promotion,
  hasTitleFight: boolean
): EventNameResult {
  const acronym = getPromotionAcronym(promotion.name);
  const currentNumbered = promotion.numberedEventCount ?? 0;
  const currentFightNight = promotion.fightNightCount ?? 0;

  if (hasTitleFight) {
    const number = currentNumbered + 1;
    return {
      eventName: `${acronym} ${number}`,
      updatedPromotion: { ...promotion, numberedEventCount: number },
    };
  }

  const number = currentFightNight + 1;
  return {
    eventName: `${acronym} Fight Night ${number}`,
    updatedPromotion: { ...promotion, fightNightCount: number },
  };
}
