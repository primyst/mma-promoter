import { Fighter, WeightClass, Team } from "@/types/game";
import { randomCountryProfile, CountryProfile } from "./countryProfiles";

// ============================================
// NAME POOLS (for random generation)
// ============================================

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

/**
 * Picks a random country profile, then a matching name and hometown from
 * that same country — so a fighter's name, nationality, and hometown are
 * always coherent (no "Kenji Tanaka from Dublin").
 */
function randomNameAndOrigin(): {
  name: string;
  nickname?: string;
  country: string;
  countryFlag: string;
  hometown: string;
} {
  const profile: CountryProfile = randomCountryProfile();
  const first = randomFrom(profile.firstNames);
  const last = randomFrom(profile.lastNames);
  const hasNickname = Math.random() > 0.4;

  return {
    name: `${first} ${last}`,
    nickname: hasNickname ? randomFrom(NICKNAMES) : undefined,
    country: profile.country,
    countryFlag: profile.flag,
    hometown: randomFrom(profile.hometowns),
  };
}

const TEAM_NAMES = [
  "Iron Fortress MMA",
  "Blacktop Combat Club",
  "Northside Fight Team",
  "Apex Grappling Academy",
  "Steel City Fighters",
  "Riverside Combat Lab",
  "The Pit MMA",
  "Vantage Point Training",
];

const COACH_NAMES = [
  "Coach Reggie Malone",
  "Coach Sofia Reyes",
  "Coach Dmitri Volkov",
  "Coach Amara Okonkwo",
  "Coach Liam Fitzgerald",
  "Coach Priya Nair",
  "Coach Hiroshi Tanaka",
  "Coach Elena Marchetti",
];

/**
 * Generates a fixed pool of camps for the game world. Not every fighter
 * belongs to one — plenty of real fighters train independently or at
 * small local gyms not worth modeling individually.
 */
export function generateTeams(startWeek: number = 1): Team[] {
  return TEAM_NAMES.map((name, i) => ({
    id: crypto.randomUUID(),
    name,
    headCoach: COACH_NAMES[i],
    foundedWeek: startWeek,
    reputation: randomInRange(30, 60),
  }));
}



export interface GenerateFighterOptions {
  weightClass?: WeightClass;
  tier?: "prospect" | "contender" | "champion" | "breakout"; // affects stat range + ranking
}

export function generateFighter(options: GenerateFighterOptions = {}): Fighter {
  const { name, nickname, country, countryFlag, hometown } = randomNameAndOrigin();
  const weightClass = options.weightClass ?? randomFrom(WEIGHT_CLASSES);
  const tier = options.tier ?? "prospect";

  // "breakout" is a rare scouting find — a young fighter with elite raw
  // stats but no real record yet to prove it. High ceiling, unproven.
  const statRange =
    tier === "champion"
      ? [78, 95]
      : tier === "breakout"
      ? [75, 92]
      : tier === "contender"
      ? [65, 85]
      : [45, 70];

  const [min, max] = statRange;

  const wins =
    tier === "champion"
      ? randomInRange(15, 24)
      : tier === "contender"
      ? randomInRange(8, 16)
      : tier === "breakout"
      ? randomInRange(0, 2) // barely any record — the hype is all in the stats
      : randomInRange(0, 6);

  const losses =
    tier === "champion"
      ? randomInRange(0, 2)
      : tier === "contender"
      ? randomInRange(1, 5)
      : tier === "breakout"
      ? 0 // undefeated, that's part of the hype
      : randomInRange(0, 4);

  const fanHeat =
    tier === "champion"
      ? randomInRange(70, 95)
      : tier === "breakout"
      ? randomInRange(45, 65) // buzz without a real body of work yet
      : tier === "contender"
      ? randomInRange(40, 70)
      : randomInRange(10, 40);

  // Purse scales with how big a draw this fighter is — champions and
  // hot-heat fighters cost real money to book, prospects are cheap.
  const purse =
    2000 +
    fanHeat * 300 +
    (tier === "champion" ? 15000 : 0);

  // Age scales roughly with tier — champions and contenders have had time
  // to build a record, breakouts are young hype, prospects span a wider
  // range since not everyone breaks through at the same age.
  const age =
    tier === "champion"
      ? randomInRange(27, 36)
      : tier === "breakout"
      ? randomInRange(20, 24)
      : tier === "contender"
      ? randomInRange(24, 33)
      : randomInRange(21, 30);

  return {
    id: crypto.randomUUID(),
    name,
    nickname,
    weightClass,
    teamId: null, // assigned by generateStarterRoster after team pool exists
    age,
    hometown,
    country,
    countryFlag,

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

    fanHeat,

    contractFightsRemaining: randomInRange(3, 8), // everyone starts signed

    // Starting fame roughly reflects what their existing record would have
    // earned under the same gain rules — a champion didn't just appear at
    // fame 0, but this is a seed, not a live formula; from here it only
    // grows through new actions.
    fame:
      tier === "champion"
        ? randomInRange(90, 160)
        : tier === "breakout"
        ? randomInRange(20, 45)
        : tier === "contender"
        ? randomInRange(35, 80)
        : randomInRange(5, 25),
    activeSponsorId: null,
    purse,

    // Starting Elo — champions rate highest, breakouts get a speculative
    // bump (raw talent, unproven), everyone else scales with tier. This is
    // what actually drives ranking movement, not win-loss totals.
    eloRating:
      tier === "champion"
        ? randomInRange(1650, 1750)
        : tier === "breakout"
        ? randomInRange(1500, 1600)
        : tier === "contender"
        ? randomInRange(1450, 1600)
        : randomInRange(1250, 1450),

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
export interface StarterRosterResult {
  roster: Fighter[];
  teams: Team[];
}

/**
 * Starts a promotion with an empty roster and zero fighters signed —
 * only the world's camps/teams exist on day one. Every fighter from here
 * on comes through scouting or free agency, nothing is handed to you.
 */
export function generateStarterRoster(
  weightClasses: WeightClass[] = ["Lightweight", "Welterweight", "Middleweight"]
): StarterRosterResult {
  const teams = generateTeams(1);
  return { roster: [], teams };
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

/**
 * Assigns ranking numbers within a division based on wins - losses,
 * and flags the champion. Call this after generating a division so
 * ranking != null matches something meaningful.
 */
function assignRankings(fighters: Fighter[], championId: string): void {
  const contenders = fighters
    .filter((f) => f.id !== championId)
    .sort((a, b) => b.eloRating - a.eloRating);

  contenders.forEach((fighter, index) => {
    fighter.ranking = index; // #1 contender gets index 0, displayed as #1
  });

  fighters.forEach((fighter) => {
    fighter.isChampion = fighter.id === championId;
    if (fighter.id === championId) fighter.ranking = null;
  });
}
