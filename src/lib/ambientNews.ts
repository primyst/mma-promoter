import { Fighter, FeedItem } from "@/types/game";

// ============================================
// RANDOM HELPERS
// ============================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

const OUTLETS = ["MMA Wire", "Cage Report", "Fight Central", "The Scrap Sheet"];

// ============================================
// AMBIENT NEWS TEMPLATES
// ============================================

type AmbientKind =
  | "cooldown_frustration"
  | "retirement_rumor"
  | "rival_org_tease"
  | "callout_chatter";

const COOLDOWN_TEMPLATES = [
  (f: Fighter) => `Sources say ${f.name} is growing frustrated with time on the sidelines.`,
  (f: Fighter) => `${f.name}'s team reportedly pushing for a return date soon.`,
  (f: Fighter) => `Fans asking when ${f.name} will be cleared to fight again.`,
];

const RETIREMENT_TEMPLATES = [
  (f: Fighter) => `Speculation grows about whether ${f.name} has enough left in the tank.`,
  (f: Fighter) => `Insiders wonder if ${f.name}'s next fight could be their last.`,
  (f: Fighter) => `${f.name} addressed retirement rumors this week, staying noncommittal.`,
];

const RIVAL_ORG_TEMPLATES = [
  (f: Fighter) => `Rival promotion reportedly reached out to ${f.name}'s camp.`,
  (f: Fighter) => `${f.name} said to be "keeping options open" amid competing offers.`,
  (f: Fighter) => `Chatter of a rival org circling ${f.name} continues to grow.`,
];

const CALLOUT_CHATTER_TEMPLATES = [
  (a: Fighter, b: Fighter) => `Fans are already building the case for ${a.name} vs ${b.name}.`,
  (a: Fighter, b: Fighter) => `Pressure mounting on the promotion to book ${a.name} vs ${b.name}.`,
  (a: Fighter, b: Fighter) => `${a.name} and ${b.name} circling each other on social media this week.`,
];

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Generates 0 or 1 ambient news item for the week. Called regardless of
 * whether a card was booked — keeps the world feeling alive during quiet
 * weeks without overwhelming the feed with noise.
 */
export function generateAmbientNews(
  roster: Fighter[],
  week: number,
  chance: number = 0.6
): FeedItem[] {
  if (!maybe(chance)) return [];

  const active = roster.filter((f) => !f.isRetired);
  if (active.length === 0) return [];

  const kindPool: AmbientKind[] = [];

  const onCooldown = active.filter((f) => f.weeksUntilAvailable >= 4);
  if (onCooldown.length > 0) kindPool.push("cooldown_frustration");

  const retirementCandidates = active.filter(
    (f) => f.wins + f.losses >= 15 || f.losses >= 5
  );
  if (retirementCandidates.length > 0) kindPool.push("retirement_rumor");

  const heatedFighters = active.filter((f) => f.fanHeat >= 60);
  if (heatedFighters.length > 0) kindPool.push("rival_org_tease");

  const rankedByClass = new Map<string, Fighter[]>();
  active.forEach((f) => {
    if (f.ranking == null && !f.isChampion) return;
    const list = rankedByClass.get(f.weightClass) ?? [];
    list.push(f);
    rankedByClass.set(f.weightClass, list);
  });
  const classesWithMultiple = Array.from(rankedByClass.values()).filter(
    (list) => list.length >= 2
  );
  if (classesWithMultiple.length > 0) kindPool.push("callout_chatter");

  if (kindPool.length === 0) return [];

  const kind = pick(kindPool);
  let content: string;
  let relatedIds: string[];

  switch (kind) {
    case "cooldown_frustration": {
      const f = pick(onCooldown);
      content = pick(COOLDOWN_TEMPLATES)(f);
      relatedIds = [f.id];
      break;
    }
    case "retirement_rumor": {
      const f = pick(retirementCandidates);
      content = pick(RETIREMENT_TEMPLATES)(f);
      relatedIds = [f.id];
      break;
    }
    case "rival_org_tease": {
      const f = pick(heatedFighters);
      content = pick(RIVAL_ORG_TEMPLATES)(f);
      relatedIds = [f.id];
      break;
    }
    case "callout_chatter": {
      const pair = pick(classesWithMultiple);
      const shuffled = [...pair].sort(() => Math.random() - 0.5);
      const [a, b] = shuffled;
      content = pick(CALLOUT_CHATTER_TEMPLATES)(a, b);
      relatedIds = [a.id, b.id];
      break;
    }
  }

  return [
    {
      id: crypto.randomUUID(),
      type: "news",
      week,
      authorName: pick(OUTLETS),
      content,
      relatedFighterIds: relatedIds,
    },
  ];
}
