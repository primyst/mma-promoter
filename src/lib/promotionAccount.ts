import { Fighter } from "@/types/game";

// ============================================
// HANDLE DERIVATION
// ============================================

/**
 * Turns a promotion name into a handle — multi-word names become initials
 * ("Apex Fighting Championship" -> "@afc"), single-word names get
 * lowercased and trimmed ("Vanguard" -> "@vanguard").
 */
export function getPromotionHandle(promotionName: string): string {
  const words = promotionName.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toLowerCase();
  }
  return (words[0] ?? "promo").toLowerCase().slice(0, 14);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// CARD ANNOUNCEMENT (fires when a card is booked)
// ============================================

export function cardAnnouncementPost(
  fighterAName: string,
  fighterBName: string,
  eventName: string,
  isTitleFight: boolean
): string {
  const templates = isTitleFight
    ? [
        `TWO EPIC TITLE FIGHTS 🏆 ${fighterAName} vs ${fighterBName} headlines ${eventName}. The belt is on the line.`,
        `Championship gold is up for grabs — ${fighterAName} vs ${fighterBName} set for ${eventName}. Get your tickets. 🎟️`,
        `The wait is over. ${fighterAName} vs ${fighterBName} for the title at ${eventName}. This is the one.`,
      ]
    : [
        `Locked in: ${fighterAName} vs ${fighterBName} at ${eventName}. Don't miss this one.`,
        `New matchup announced — ${fighterAName} takes on ${fighterBName} at ${eventName}.`,
        `Card update: ${fighterAName} vs ${fighterBName} is official for ${eventName}. 🔥`,
        `Just booked: ${fighterAName} vs ${fighterBName}. See you at ${eventName}.`,
      ];
  return pick(templates);
}

// ============================================
// POST-CARD RECAP (fires after a card resolves)
// ============================================

export function postCardRecapPost(revenue: number, fightCount: number): string {
  const templates = [
    `What a night. ${fightCount} fights, and the fans showed up big. Thank you all. 🙏`,
    `Another card in the books. On to the next one — the momentum's building.`,
    `Big night for the promotion. Gate numbers came in strong — appreciate every one of you.`,
    `That's a wrap on tonight's card. Already looking at what's next.`,
    revenue > 150000
      ? `Records falling at the box office too — huge night financially, thank you fans.`
      : `Solid night all around. Building this thing one card at a time.`,
  ];
  return pick(templates);
}

// ============================================
// NEW SIGNING HYPE (fires alongside the factual news post)
// ============================================

export function newSigningPost(fighterName: string, weightClass: string): string {
  const templates = [
    `Welcome to the family, ${fighterName}. Big things ahead in the ${weightClass} division. 🤝`,
    `Just added ${fighterName} to the roster. This ${weightClass} division just got a lot more interesting.`,
    `Excited to announce ${fighterName} is officially signed. Let's get to work.`,
    `${fighterName} is now part of this promotion. ${weightClass} contenders, take notice.`,
  ];
  return pick(templates);
}

// ============================================
// SPONSOR DEAL ANNOUNCEMENT
// ============================================

export function sponsorDealPost(fighterName: string, sponsorName: string): string {
  const templates = [
    `Proud to see ${fighterName} land a deal with ${sponsorName}. Hard work paying off. 💰`,
    `${fighterName} x ${sponsorName} — official. This is what fame tier growth looks like.`,
    `Big business news: ${fighterName} just signed with ${sponsorName}.`,
  ];
  return pick(templates);
}

// ============================================
// WEIGHT CLASS MOVE (official statement, replaces generic news framing)
// ============================================

export function weightMovePost(
  fighterName: string,
  direction: "up" | "down",
  oldClass: string,
  newClass: string,
  vacatedTitle: boolean
): string {
  if (vacatedTitle) {
    return pick([
      `${fighterName} is vacating the ${oldClass} title and moving ${direction} to ${newClass}. Respect the decision — wish them well in the new weight class.`,
      `Tough news: ${fighterName} vacates the belt to chase a new challenge at ${newClass}. The ${oldClass} division picture just changed.`,
    ]);
  }
  return pick([
    `${fighterName} is officially moving ${direction} to ${newClass}. New chapter, new challenges.`,
    `Roster update: ${fighterName} leaves ${oldClass} behind for a fresh start at ${newClass}.`,
  ]);
}

// ============================================
// CONTROVERSY / INCIDENT STATEMENTS (official promotion voice)
// ============================================

export function officialStatementPost(resultMessage: string): string {
  // The specific consequence text already carries the substance — this
  // just frames it as coming from the promotion itself, not a news outlet.
  const openers = [
    `Official statement: `,
    `Promotion response: `,
    `Our stance: `,
    ``, // sometimes no preamble, just states it directly
  ];
  return `${pick(openers)}${resultMessage}`;
}

// ============================================
// MILESTONE CONGRATULATIONS (promotion reacts to records/streaks)
// ============================================

export function milestoneCongratsPost(fighterName: string): string {
  const templates = [
    `Congratulations to ${fighterName} on a huge milestone tonight. This is why we do this. 🏆`,
    `Take a bow, ${fighterName}. History made under our banner.`,
    `Proud to have ${fighterName} on this roster. What a moment.`,
    `${fighterName} just wrote themselves into the record books. Incredible.`,
  ];
  return pick(templates);
}

// ============================================
// FIGHT BONUSES (Fight of the Night / Performance of the Night)
// ============================================

export function fotnAnnouncementPost(
  fighterAName: string,
  fighterBName: string,
  amount: number
): string {
  const templates = [
    `Fight of the Night goes to ${fighterAName} and ${fighterBName}. That's an extra $${amount.toLocaleString()} each — they earned every cent. 🥊`,
    `That's what Fight of the Night looks like. Bonus checks going out to ${fighterAName} and ${fighterBName}.`,
    `${fighterAName} vs ${fighterBName} takes home Fight of the Night. Absolute war.`,
  ];
  return pick(templates);
}

export function potnAnnouncementPost(fighterName: string, amount: number): string {
  const templates = [
    `Performance of the Night: ${fighterName}. That finish earns an extra $${amount.toLocaleString()}. 💥`,
    `${fighterName} just picked up a nice bonus for that performance. Well deserved.`,
    `Performance bonus goes to ${fighterName} tonight. That's how you make a statement.`,
  ];
  return pick(templates);
}

export function businessMilestonePost(cardCount: number): string {
  const templates = [
    `${cardCount} cards in the books. Grateful for every fan who's been here since day one.`,
    `Hard to believe we've run ${cardCount} events already. Onward.`,
    `${cardCount} cards down. This promotion isn't slowing down anytime soon.`,
  ];
  return pick(templates);
}
