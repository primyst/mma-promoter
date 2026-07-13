// ============================================
// FIGHTER
// ============================================

export type WeightClass =
  | "Flyweight"
  | "Bantamweight"
  | "Featherweight"
  | "Lightweight"
  | "Welterweight"
  | "Middleweight"
  | "Light Heavyweight"
  | "Heavyweight";

// Ordered lightest to heaviest — used to determine adjacent divisions
// when a fighter moves up or down in weight.
export const WEIGHT_CLASS_ORDER: WeightClass[] = [
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
];

export type Momentum = "hot" | "neutral" | "cold";

export type HealthStatus = "fine" | "nursing" | "injured";

export type FightResultType = "win" | "loss" | "draw" | "no_contest";

export type FinishMethod = "KO/TKO" | "Submission" | "Decision" | "DQ";

export interface FightRecord {
  opponentId: string;
  opponentName: string;
  result: FightResultType;
  method: FinishMethod;
  week: number;
}

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  weightClass: WeightClass;

  // Record
  wins: number;
  losses: number;
  draws: number;
  recentFights: FightRecord[]; // last ~5, most recent first

  // Core stats (drive fight sim outcomes)
  striking: number; // 1-100
  grappling: number; // 1-100
  cardio: number; // 1-100
  chin: number; // 1-100, resistance to being finished
  ranking: number | null; // 1 = #1 contender, null = unranked

  // State that gates eligibility
  momentum: Momentum;
  health: HealthStatus;
  weeksUntilAvailable: number; // 0 = available now, gated by injury/cooldown

  // Business-side stats
  fanHeat: number; // 0-100, how much fans want to see them
  // fameTier: number;      // v0.3 hook — unlocks sponsor tiers
  // sponsorIds: string[];  // v0.3 hook

  isChampion: boolean;
  isRetired: boolean;
}

// ============================================
// EVENTS / CARDS
// ============================================

export type CardTier = "Main Card" | "Numbered Event" | "Title Fight";

export interface BookedFight {
  id: string;
  fighterAId: string;
  fighterBId: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
}

export interface FightCard {
  id: string;
  week: number;
  tier: CardTier;
  fights: BookedFight[];
  isSimulated: boolean;
  revenue?: number; // filled in after simulation
}

// ============================================
// FIGHT RESULTS (output of the sim)
// ============================================

export interface FightOutcome {
  fightId: string;
  winnerId: string | null; // null if draw/no_contest
  result: FightResultType;
  method: FinishMethod;
  round: number;
  // narrative: string;   // v0.2 hook — feeds the news/tweet generator
}

// ============================================
// PROMOTION (the player)
// ============================================

export interface Promotion {
  name: string;
  money: number;
  reputation: number; // 0-100, affects fighter willingness to sign/re-sign
  currentWeek: number;
}

// ============================================
// FEED (news + social posts)
// ============================================

export type FeedItemType = "tweet" | "news" | "callout";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  week: number;
  authorName: string; // fighter name, or outlet name like "MMA Wire"
  authorHandle?: string; // for tweets, e.g. "@ivanlarsen"
  content: string;
  relatedFighterIds: string[]; // for filtering/context
}

// ============================================
// TITLE HISTORY
// ============================================

export interface TitleReign {
  weightClass: WeightClass;
  championId: string;
  championName: string;
  startWeek: number;
  endWeek: number | null; // null = still reigning
  defenses: number;
}

// ============================================
// FIGHT WEEK / INCIDENTS
// ============================================

export type IncidentChoice = "fine" | "let_it_slide" | "hype_it_up";

export interface Incident {
  id: string;
  week: number;
  fighterAId: string;
  fighterBId: string;
  fighterAName: string;
  fighterBName: string;
  description: string;
  resolved: boolean;
}

// ============================================
// GAME STATE (root object, this is what gets persisted)
// ============================================

export interface GameState {
  promotion: Promotion;
  roster: Fighter[];
  cards: FightCard[]; // history AND future scheduled cards, keyed by card.week
  feed: FeedItem[];
  titleHistory: TitleReign[];
  pendingIncident: Incident | null;
}

// ============================================
// SAVE / LOAD HELPERS
// ============================================

const SAVE_KEY = "mma-promoter-save-v1";

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save game:", err);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (err) {
    console.error("Failed to load game:", err);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
