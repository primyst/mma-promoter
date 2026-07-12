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
  const winnerWasFavorite =
    (winner.ranking ?? 99) <= (loser.ranking ?? 99) || winner.isChampion;

  if (!winnerWasFavorite) return "upset";

  if (outcome.method !== "Decision" && outcome.round <= 2) return "brutal_finish";

  const rankGap = Math.abs((winner.ranking ?? 50) - (loser.ranking ?? 50));
  if (rankGap >= 5) return "squash";

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
  ],
  brutal_finish: [
    "Lights out. Next.",
    "That's what happens when you disrespect me.",
    "I told him it wouldn't go long.",
    "Business handled. Who's next.",
  ],
  close_decision: [
    "Wasn't pretty but a win's a win.",
    "Tough fight, tougher man. On to the next.",
    "Give me a real challenge next time.",
    "Ready to run it back if he wants smoke.",
  ],
  dominant_win: [
    "Just another day at the office.",
    "Told y'all this was easy work.",
    "Ready for the real competition now.",
  ],
  squash: [
    "Give me someone in my league next time.",
    "That wasn't a fight, that was a paycheck.",
    "I need real challenges, not tune-ups.",
  ],
};

const LOSER_TWEET_FRAGMENTS: Record<FightNarrative, string[]> = {
  upset: [
    "No excuses. Back to the drawing board.",
    "Didn't see that coming. Respect to him, I'll be back.",
    "Hurts, but I'll be better for it.",
  ],
  brutal_finish: [
    "Caught me clean. Happens to everyone.",
    "I'll be back stronger, watch.",
    "Not the ending I wanted but I'll learn from it.",
  ],
  close_decision: [
    "Thought I did enough. Judges saw it different.",
    "Close one. Run it back anytime.",
    "I'll take that on the chin, close fight though.",
  ],
  dominant_win: [
    "Wasn't my night. Back to the gym.",
    "He was just better today. I'll be back.",
  ],
  squash: [
    "Took the fight on short notice, no excuses though.",
    "Not my best performance, back to work.",
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
  ],
  brutal_finish: [
    (w, l, o) => `${w.name} ends it early, finishes ${l.name} via ${o.method} in round ${o.round}`,
    (w, l) => `Brutal night for ${l.name} as ${w.name} secures a violent finish`,
  ],
  close_decision: [
    (w, l) => `${w.name} edges out ${l.name} in a fight that could've gone either way`,
    (w, l) => `Split opinions as ${w.name} takes a close decision over ${l.name}`,
  ],
  dominant_win: [
    (w, l) => `${w.name} handles business, defeats ${l.name} as expected`,
    (w, l) => `Another win for ${w.name}, cruises past ${l.name}`,
  ],
  squash: [
    (w, l) => `Questions raised over matchmaking as ${w.name} steamrolls overmatched ${l.name}`,
    (w, l) => `${w.name} makes quick work of an outclassed ${l.name}`,
  ],
};

// ============================================
// CALLOUT TEMPLATES (post-win, targets someone else in division)
// ============================================

const CALLOUT_FRAGMENTS = [
  "and I'm calling out {target} next. Let's see what he's got.",
  "{target}, you're up. Don't duck me.",
  "somebody get {target} on the phone, I'm coming for that spot.",
  "I want {target} next, no games.",
];

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

    // Callout — only sometimes, and only if there's a same-weight-class target
    const possibleTargets = roster.filter(
      (f) =>
        f.weightClass === winner.weightClass &&
        f.id !== winner.id &&
        f.id !== loser.id &&
        !f.isRetired
    );
    if (possibleTargets.length > 0 && maybe(0.4)) {
      const target = pick(possibleTargets);
      const calloutText =
        pick(WINNER_TWEET_FRAGMENTS[narrative]) +
        " " +
        pick(CALLOUT_FRAGMENTS).replace("{target}", target.name);

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
