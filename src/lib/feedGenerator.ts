import { Fighter, FightOutcome, BookedFight, FeedItem, FinishMethod } from "@/types/game";

// ============================================
// RANDOM HELPERS
// ============================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

function handleFromName(name: string): string {
  return "@" + name.toLowerCase().replace(/[^a-z]/g, "");
}

// ============================================
// CONTEXT CLASSIFICATION
// ============================================

type FightNarrative =
  | "dominant_win" // big stat/ranking gap, expected result
  | "upset" // underdog (lower ranked / cold streak) wins
  | "close_decision" // decision between closely matched fighters
  | "brutal_finish" // KO/Sub, especially early round
  | "squash" // huge mismatch, warning-flagged in booking

function classifyFight(
  winner: Fighter,
  loser: Fighter,
  outcome: FightOutcome
): FightNarrative {
  // Champion always counts as favorite. Otherwise compare ranking with a
  // buffer — being one spot better isn't really "the favorite," it's a
  // pick 'em. Only count as favorite if the gap is real (2+ spots).
  const winnerRank = winner.ranking ?? 50;
  const loserRank = loser.ranking ?? 50;
  const rankGap = loserRank - winnerRank; // positive = winner was better ranked

  const winnerWasFavorite = winner.isChampion || rankGap >= 2;
  const closeRanking = Math.abs(rankGap) < 2;

  if (!winnerWasFavorite && !closeRanking) return "upset";

  if (outcome.method !== "Decision" && outcome.round <= 2) return "brutal_finish";

  // Squash requires both a big ranking gap AND a decisive finish —
  // a close decision between a #1 and #7 isn't a squash, it's just a fight.
  if (rankGap >= 6 && outcome.method !== "Decision") return "squash";

  if (outcome.method === "Decision") return "close_decision";

  return "dominant_win";
}

// ============================================
// TWEET TEMPLATES (fighter voice)
// ============================================

const WINNER_TWEET_FRAGMENTS: Record<FightNarrative, string[]> = {
  upset: [
    "They doubted me. Not anymore.",
    "Nobody believed in me except my team. Book the next one.",
    "Underdog no more. I told y'all.",
    "Respect is earned, not given. Just earned mine.",
    "Everybody had me losing tonight. Check the scoreboard.",
    "Bet against me one more time, I dare you.",
    "This is what happens when you sleep on the wrong guy.",
    "Doubt me again, I'll do it again.",
  ],
  brutal_finish: [
    "Lights out. Next.",
    "That's what happens when you disrespect me.",
    "I told him it wouldn't go long.",
    "Business handled. Who's next.",
    "Told my team I'd end it early. Promise kept.",
    "Some people learn the hard way.",
    "Fast work tonight. On to bigger things.",
    "Didn't even need the judges for that one.",
  ],
  close_decision: [
    "Wasn't pretty but a win's a win.",
    "Tough fight, tougher man. On to the next.",
    "Give me a real challenge next time.",
    "Ready to run it back if he wants smoke.",
    "Close one but I'll take it every time.",
    "Not my cleanest performance, still got the W.",
    "Give credit where it's due, that was a battle.",
    "Judges saw what I saw. On to the next one.",
  ],
  dominant_win: [
    "Just another day at the office.",
    "Told y'all this was easy work.",
    "Ready for the real competition now.",
    "Nothing to it. Book the next name.",
    "Another one in the books, no drama.",
    "That's how it's supposed to look.",
  ],
  squash: [
    "Give me someone in my league next time.",
    "That wasn't a fight, that was a paycheck.",
    "I need real challenges, not tune-ups.",
    "Somebody book me an actual test next time.",
    "That was a formality, not a fight.",
  ],
};

const LOSER_TWEET_FRAGMENTS: Record<FightNarrative, string[]> = {
  upset: [
    "No excuses. Back to the drawing board.",
    "Didn't see that coming. Respect to him, I'll be back.",
    "Hurts, but I'll be better for it.",
    "Give him credit, he showed up tonight.",
    "That one stings. Time to regroup.",
    "Wasn't my night. Back in the gym tomorrow.",
  ],
  brutal_finish: [
    "Caught me clean. Happens to everyone.",
    "I'll be back stronger, watch.",
    "Not the ending I wanted but I'll learn from it.",
    "He got me. Credit where it's due.",
    "Rough one. Already looking ahead.",
  ],
  close_decision: [
    "Thought I did enough. Judges saw it different.",
    "Close one. Run it back anytime.",
    "I'll take that on the chin, close fight though.",
    "Felt like I won that one, but it's not my call.",
    "Battle either way. Respect to him.",
  ],
  dominant_win: [
    "Wasn't my night. Back to the gym.",
    "He was just better today. I'll be back.",
    "Nothing to say, he outworked me.",
  ],
  squash: [
    "Took the fight on short notice, no excuses though.",
    "Not my best performance, back to work.",
    "Off night. I'll be better next time out.",
  ],
};

// ============================================
// NEWS TEMPLATES (formal outlet voice)
// ============================================

const NEWS_OUTLETS = ["MMA Wire", "Cage Report", "Fight Central", "The Scrap Sheet"];

const NEWS_HEADLINE_TEMPLATES: Record<FightNarrative, ((w: Fighter, l: Fighter, outcome: FightOutcome) => string)[]> = {
  upset: [
    (w, l) => `UPSET: ${w.name} shocks the division with a win over ${l.name}`,
    (w, l) => `${w.name} stuns everyone, defeats heavily favored ${l.name}`,
    (w, l) => `Nobody saw it coming: ${w.name} takes down ${l.name}`,
    (w, l) => `${l.name} caught off guard as ${w.name} pulls the upset`,
  ],
  brutal_finish: [
    (w, l, o) => `${w.name} ends it early, finishes ${l.name} via ${o.method} in round ${o.round}`,
    (w, l) => `Brutal night for ${l.name} as ${w.name} secures a violent finish`,
    (w, l, o) => `${w.name} sends a message with a round ${o.round} finish over ${l.name}`,
    (w, l) => `Vicious performance from ${w.name} puts ${l.name} away in a hurry`,
  ],
  close_decision: [
    (w, l) => `${w.name} edges out ${l.name} in a fight that could've gone either way`,
    (w, l) => `Split opinions as ${w.name} takes a close decision over ${l.name}`,
    (w, l) => `Instant classic: ${w.name} and ${l.name} go the distance in a nail-biter`,
    (w, l) => `Judges give it to ${w.name} after a razor-close bout with ${l.name}`,
  ],
  dominant_win: [
    (w, l) => `${w.name} handles business, defeats ${l.name} as expected`,
    (w, l) => `Another win for ${w.name}, cruises past ${l.name}`,
    (w, l) => `${w.name} keeps rolling with a solid win over ${l.name}`,
    (w, l) => `As expected, ${w.name} gets past ${l.name} without much trouble`,
  ],
  squash: [
    (w, l) => `Questions raised over matchmaking as ${w.name} steamrolls overmatched ${l.name}`,
    (w, l) => `${w.name} makes quick work of an outclassed ${l.name}`,
    (w, l) => `Mismatch on paper proves true as ${w.name} dismantles ${l.name}`,
    (w, l) => `Fans call for better competition after ${w.name} blows past ${l.name}`,
  ],
};

// ============================================
// CALLOUT TEMPLATES (post-win, targets someone else in division)
// ============================================

// Contenders are hungry and blocked — accusing someone of ducking is their
// energy, not the champion's. This is the "I want it and I'm not getting it" voice.
const CONTENDER_CALLOUT_FRAGMENTS = [
  "and I'm calling out {target} next. Let's see what he's got.",
  "{target}, you're up. Don't duck me.",
  "somebody get {target} on the phone, I'm coming for that spot.",
  "I want {target} next, no games.",
  "{target} knows where to find me. Stop stalling.",
];

// Champions don't need to convince anyone — they've already got the belt.
// The tone here is dismissive and secure, not desperate.
const CHAMPION_CALLOUT_FRAGMENTS = [
  "The belt's staying right here. {target}, come get it whenever you're ready.",
  "I'll fight whoever they put in front of me. {target}, your move.",
  "Been waiting on {target}. No rush, I'm not going anywhere.",
  "{target} wants smoke? Line it up, doesn't change anything for me.",
];

function getCalloutFragments(isChampion: boolean): string[] {
  return isChampion ? CHAMPION_CALLOUT_FRAGMENTS : CONTENDER_CALLOUT_FRAGMENTS;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateFeedForCard(
  outcomes: FightOutcome[],
  fights: BookedFight[],
  roster: Fighter[],
  week: number
): FeedItem[] {
  const rosterMap = new Map(roster.map((f) => [f.id, f]));
  const items: FeedItem[] = [];

  for (const outcome of outcomes) {
    const fight = fights.find((f) => f.id === outcome.fightId);
    if (!fight) continue;

    const winner = rosterMap.get(outcome.winnerId ?? "");
    const loserId =
      fight.fighterAId === outcome.winnerId ? fight.fighterBId : fight.fighterAId;
    const loser = rosterMap.get(loserId);
    if (!winner || !loser) continue;

    const narrative = classifyFight(winner, loser, outcome);

    // Winner tweet
    items.push({
      id: crypto.randomUUID(),
      type: "tweet",
      week,
      authorName: winner.name,
      authorHandle: handleFromName(winner.name),
      content: pick(WINNER_TWEET_FRAGMENTS[narrative]),
      relatedFighterIds: [winner.id, loser.id],
    });

    // Loser tweet (not always — sometimes fighters go quiet after a loss)
    if (maybe(0.7)) {
      items.push({
        id: crypto.randomUUID(),
        type: "tweet",
        week,
        authorName: loser.name,
        authorHandle: handleFromName(loser.name),
        content: pick(LOSER_TWEET_FRAGMENTS[narrative]),
        relatedFighterIds: [winner.id, loser.id],
      });
    }

    // News headline
    const headlineFn = pick(NEWS_HEADLINE_TEMPLATES[narrative]);
    items.push({
      id: crypto.randomUUID(),
      type: "news",
      week,
      authorName: pick(NEWS_OUTLETS),
      content: headlineFn(winner, loser, outcome),
      relatedFighterIds: [winner.id, loser.id],
    });

    // Callout — only sometimes, and only if there's a same-weight-class target.
    // Realistic targeting: prefer fighters ranked close to the winner (the
    // actual "next contender" conversation), rather than a fully random pick
    // that can read as the winner ducking the real #1 contender.
    const sameDivision = roster.filter(
      (f) =>
        f.weightClass === winner.weightClass &&
        f.id !== winner.id &&
        f.id !== loser.id &&
        !f.isRetired
    );

    const winnerRank = winner.isChampion ? 0 : (winner.ranking ?? 50) + 1;
    const nearbyTargets = sameDivision
      .filter((f) => f.ranking != null || f.isChampion)
      .sort((a, b) => {
        const rankA = a.isChampion ? 0 : (a.ranking ?? 50) + 1;
        const rankB = b.isChampion ? 0 : (b.ranking ?? 50) + 1;
        return Math.abs(rankA - winnerRank) - Math.abs(rankB - winnerRank);
      })
      .slice(0, 3); // the 3 closest-ranked fighters — realistic next-fight pool

    const possibleTargets = nearbyTargets.length > 0 ? nearbyTargets : sameDivision;

    if (possibleTargets.length > 0 && maybe(0.4)) {
      const target = pick(possibleTargets);
      const calloutText =
        pick(WINNER_TWEET_FRAGMENTS[narrative]) +
        " " +
        pick(getCalloutFragments(winner.isChampion)).replace("{target}", target.name);

      items.push({
        id: crypto.randomUUID(),
        type: "callout",
        week,
        authorName: winner.name,
        authorHandle: handleFromName(winner.name),
        content: calloutText,
        relatedFighterIds: [winner.id, loser.id, target.id],
      });
    }
  }

  return items;
}
