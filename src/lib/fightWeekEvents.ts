import { Fighter, BookedFight, FeedItem, Incident, IncidentChoice } from "@/types/game";

// ============================================
// TYPES
// ============================================

export interface WeighInResult {
  fighterId: string;
  fighterName: string;
  missedWeight: boolean;
}

export interface FightWeekResult {
  weighIns: WeighInResult[];
  feedItems: FeedItem[];
  incident: Incident | null; // null if press conference was routine
}

// ============================================
// RANDOM HELPERS
// ============================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

// ============================================
// WEIGH-IN
// ============================================

const OUTLETS = ["MMA Wire", "Cage Report", "Fight Central", "The Scrap Sheet"];

/**
 * A fighter is more likely to miss weight if they're not at full health
 * (health field doubles as a proxy for how hard their camp/cut is going)
 * or if they recently moved weight classes (represented by a low cardio
 * value relative to their other stats, since a bad cut drains cardio).
 */
function checkWeighIn(fighter: Fighter): WeighInResult {
  let missChance = 0.03; // baseline — even healthy fighters occasionally miss
  if (fighter.health === "nursing") missChance += 0.12;
  if (fighter.cardio < 45) missChance += 0.15; // signals a rough weight cut

  return {
    fighterId: fighter.id,
    fighterName: fighter.name,
    missedWeight: maybe(missChance),
  };
}

// ============================================
// PRESS CONFERENCE FLAVOR
// ============================================

const ROUTINE_PRESSER_TEMPLATES = [
  (a: Fighter, b: Fighter) =>
    `${a.name} and ${b.name} kept things professional at today's press conference.`,
  (a: Fighter, b: Fighter) =>
    `Mutual respect on display as ${a.name} and ${b.name} faced off for the cameras.`,
  (a: Fighter, b: Fighter) =>
    `${a.name} talked up the matchup with ${b.name}, calling it "the biggest fight of my career."`,
  (a: Fighter, b: Fighter) =>
    `${b.name} stayed quiet at the presser, letting the fight do the talking.`,
];

const INCIDENT_TEMPLATES = [
  (a: Fighter, b: Fighter) =>
    `Things got heated between ${a.name} and ${b.name} — a shove at the staredown has fans buzzing.`,
  (a: Fighter, b: Fighter) =>
    `${a.name} threw a water bottle at ${b.name} during a tense press conference exchange.`,
  (a: Fighter, b: Fighter) =>
    `${a.name} called ${b.name} a coward on the mic, promotion officials had to step in.`,
];

// ============================================
// INCIDENT RESOLUTION EFFECTS
// ============================================

export interface IncidentResolution {
  fanHeatDelta: number;
  reputationDelta: number;
  resultMessage: string;
}

/**
 * Applies the consequence of how the promoter handled an incident.
 * Fining protects reputation but costs some fan heat (fans like drama).
 * Letting it slide boosts fan heat but hurts reputation (looks unprofessional).
 * Hyping it up maximizes fan heat but risks reputation the most.
 */
export function resolveIncident(choice: IncidentChoice): IncidentResolution {
  switch (choice) {
    case "fine":
      return {
        fanHeatDelta: -2,
        reputationDelta: 3,
        resultMessage: "Fighters were fined. Promotion seen as keeping order.",
      };
    case "let_it_slide":
      return {
        fanHeatDelta: 5,
        reputationDelta: -3,
        resultMessage: "No punishment issued — fans loved the chaos, but some call it unprofessional.",
      };
    case "hype_it_up":
      return {
        fanHeatDelta: 10,
        reputationDelta: -6,
        resultMessage: "The promotion leaned into the drama for ticket sales. Bold move.",
      };
  }
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Runs fight week for a single main event / title fight.
 * Call this once per qualifying fight when a card is booked (not simulated
 * yet — this happens in the lead-up, before the actual fight night sim).
 */
export function runFightWeek(
  fight: BookedFight,
  fighterA: Fighter,
  fighterB: Fighter,
  week: number
): FightWeekResult {
  const weighIns = [checkWeighIn(fighterA), checkWeighIn(fighterB)];
  const feedItems: FeedItem[] = [];

  for (const weighIn of weighIns) {
    if (weighIn.missedWeight) {
      feedItems.push({
        id: crypto.randomUUID(),
        type: "news",
        week,
        authorName: pick(OUTLETS),
        content: `${weighIn.fighterName} missed weight for this week's card — fans and media react.`,
        relatedFighterIds: [weighIn.fighterId],
      });
    }
  }

  let incident: Incident | null = null;

  if (maybe(0.15)) {
    incident = {
      id: crypto.randomUUID(),
      week,
      fighterAId: fighterA.id,
      fighterBId: fighterB.id,
      fighterAName: fighterA.name,
      fighterBName: fighterB.name,
      description: pick(INCIDENT_TEMPLATES)(fighterA, fighterB),
      resolved: false,
    };
    feedItems.push({
      id: crypto.randomUUID(),
      type: "news",
      week,
      authorName: pick(OUTLETS),
      content: incident.description,
      relatedFighterIds: [fighterA.id, fighterB.id],
    });
  } else {
    feedItems.push({
      id: crypto.randomUUID(),
      type: "news",
      week,
      authorName: pick(OUTLETS),
      content: pick(ROUTINE_PRESSER_TEMPLATES)(fighterA, fighterB),
      relatedFighterIds: [fighterA.id, fighterB.id],
    });
  }

  return { weighIns, feedItems, incident };
}
