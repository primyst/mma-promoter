import { Fighter, WeightClass } from "@/types/game";

// ============================================
// NAME POOLS (for random generation)
// ============================================

const FIRST_NAMES = [
  "Marcus", "Diego", "Kai", "Viktor", "Amir", "Jonas", "Rafael", "Dmitri",
  "Theo", "Malik", "Sione", "Bruno", "Kenji", "Emeka", "Lucas", "Andre",
  "Nasir", "Tomas", "Hassan", "Ivan",
];

const LAST_NAMES = [
  "Reyes", "Volkov", "Silva", "Okafor", "Kowalski", "Petrov", "Santos",
  "Hall", "Nakamura", "Costa", "Duarte", "Novak", "Adeyemi", "Brennan",
  "Fischer", "Moreau", "Tanaka", "Osei", "Larsen", "Vance",
];

const NICKNAMES = [
  "The Hammer", "Iceman", "Relentless", "The Ghost", "Bulldozer",
  "The Surgeon", "Chaos", "The Machine", "Smoke", "The Wolf",
  "No Mercy", "The Storm", "Reaper", "The Wall", "Vandal",
];

const WEIGHT_CLASSES: WeightClass[] = [
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
];

// ============================================
// HELPERS
// ============================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(): { name: string; nickname?: string } {
  const first = randomFrom(FIRST_NAMES);
  const last = randomFrom(LAST_NAMES);
  const hasNickname = Math.random() > 0.4;
  return {
    name: `${first} ${last}`,
    nickname: hasNickname ? randomFrom(NICKNAMES) : undefined,
  };
}

// ============================================
// SINGLE FIGHTER GENERATOR
// ============================================

export interface GenerateFighterOptions {
  weightClass?: WeightClass;
  tier?: "prospect" | "contender" | "champion"; // affects stat range + ranking
}

export function generateFighter(options: GenerateFighterOptions = {}): Fighter {
  const { name, nickname } = randomName();
  const weightClass = options.weightClass ?? randomFrom(WEIGHT_CLASSES);
  const tier = options.tier ?? "prospect";

  const statRange =
    tier === "champion"
      ? [78, 95]
      : tier === "contender"
      ? [65, 85]
      : [45, 70];

  const [min, max] = statRange;

  const wins =
    tier === "champion"
      ? randomInRange(15, 24)
      : tier === "contender"
      ? randomInRange(8, 16)
      : randomInRange(0, 6);

  const losses =
    tier === "champion"
      ? randomInRange(0, 2)
      : tier === "contender"
      ? randomInRange(1, 5)
      : randomInRange(0, 4);

  return {
    id: crypto.randomUUID(),
    name,
    nickname,
    weightClass,

    wins,
    losses,
    draws: Math.random() > 0.9 ? 1 : 0,
    recentFights: [],

    striking: randomInRange(min, max),
    grappling: randomInRange(min, max),
    cardio: randomInRange(min, max),
    chin: randomInRange(min, max),
    ranking: null, // assigned later by assignRankings()

    momentum: randomFrom(["hot", "neutral", "cold"] as const),
    health: "fine",
    weeksUntilAvailable: 0,

    fanHeat:
      tier === "champion"
        ? randomInRange(70, 95)
        : tier === "contender"
        ? randomInRange(40, 70)
        : randomInRange(10, 40),

    isChampion: false, // assigned later by assignRankings()
    isRetired: false,
  };
}

// ============================================
// FULL ROSTER GENERATOR
// ============================================

/**
 * Generates a starter roster: one champion + a handful of contenders/prospects
 * per weight class. Keeps v0.1 focused — you don't need all 8 weight classes
 * fully stacked to test the loop, so this defaults to a lean spread.
 */
export function generateStarterRoster(
  weightClasses: WeightClass[] = ["Lightweight", "Welterweight", "Middleweight"]
): Fighter[] {
  const roster: Fighter[] = [];

  for (const wc of weightClasses) {
    const champion = generateFighter({ weightClass: wc, tier: "champion" });
    const contenders = Array.from({ length: 3 }, () =>
      generateFighter({ weightClass: wc, tier: "contender" })
    );
    const prospects = Array.from({ length: 4 }, () =>
      generateFighter({ weightClass: wc, tier: "prospect" })
    );

    const divisionFighters = [champion, ...contenders, ...prospects];
    assignRankings(divisionFighters, champion.id);
    roster.push(...divisionFighters);
  }

  return roster;
}

/**
 * Assigns ranking numbers within a division based on wins - losses,
 * and flags the champion. Call this after generating a division so
 * ranking != null matches something meaningful.
 */
function assignRankings(fighters: Fighter[], championId: string): void {
  const sorted = [...fighters].sort(
    (a, b) => b.wins - b.losses - (a.wins - a.losses)
  );

  sorted.forEach((fighter, index) => {
    fighter.ranking = fighter.id === championId ? null : index; // champ is unranked-by-number, flagged separately
    fighter.isChampion = fighter.id === championId;
  });
}
