import { Fighter, ControversyEvent, ControversyChoiceOption } from "@/types/game";

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
// SCENARIO TEMPLATES
// ============================================

interface ScenarioTemplate {
  needsFighter: boolean;
  title: string;
  description: (fighterName?: string) => string;
  options: ControversyChoiceOption[];
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    needsFighter: true,
    title: "Backstage Dispute",
    description: (name) =>
      `${name} is reportedly unhappy about their position on the last card and has been venting to media.`,
    options: [
      { id: "address", label: "Address it publicly", hint: "+reputation, small fan heat cost" },
      { id: "ignore", label: "Ignore it", hint: "no immediate cost, risk of it festering" },
      { id: "private_meeting", label: "Handle it privately", hint: "+small reputation, fighter's fan heat steadies" },
    ],
  },
  {
    needsFighter: true,
    title: "Supplement Rumors",
    description: (name) =>
      `Rumors are swirling online about ${name}'s supplement use ahead of their next fight. Nothing confirmed, just chatter.`,
    options: [
      { id: "defend", label: "Publicly defend them", hint: "+fan heat if rumors fade, risk if they don't" },
      { id: "distance", label: "Stay neutral, let it blow over", hint: "small reputation gain, fighter's fan heat dips" },
      { id: "investigate", label: "Order an internal review", hint: "+reputation, costs a little money" },
    ],
  },
  {
    needsFighter: false,
    title: "Media Accusation",
    description: () =>
      `A prominent outlet is accusing the promotion of favoritism in recent matchmaking decisions.`,
    options: [
      { id: "rebut", label: "Publicly rebut the claim", hint: "+reputation if it lands, risk if it backfires" },
      { id: "no_comment", label: "No comment", hint: "avoids escalation, small reputation dip" },
      { id: "transparency", label: "Publish matchmaking rationale", hint: "+reputation, takes real effort" },
    ],
  },
  {
    needsFighter: false,
    title: "Fan Backlash",
    description: () =>
      `Fans are calling recent cards "predictable" and demanding fresher matchups on social media.`,
    options: [
      { id: "acknowledge", label: "Acknowledge the criticism", hint: "+reputation, shows you're listening" },
      { id: "defend_booking", label: "Defend your booking choices", hint: "risk — could read as dismissive" },
      { id: "ignore", label: "Say nothing", hint: "no change either way" },
    ],
  },
  {
    needsFighter: true,
    title: "Social Media Incident",
    description: (name) =>
      `${name} posted something inflammatory about a rival fighter online, and it's gaining traction.`,
    options: [
      { id: "fine", label: "Fine them for conduct", hint: "+reputation, fighter's fan heat drops a bit" },
      { id: "let_it_ride", label: "Let it ride, drama sells", hint: "+fan heat, reputation risk" },
      { id: "apology", label: "Have them issue an apology", hint: "safe middle ground" },
    ],
  },
];

// ============================================
// CONSEQUENCE MAP
// ============================================

export interface ControversyResolution {
  reputationDelta: number;
  fanHeatDelta: number; // applied to the tied fighter if one exists
  moneyDelta: number;
  resultMessage: string;
}

const CONSEQUENCES: Record<string, ControversyResolution> = {
  address: { reputationDelta: 4, fanHeatDelta: -2, moneyDelta: 0, resultMessage: "Handled publicly — mostly smoothed over." },
  ignore: { reputationDelta: -2, fanHeatDelta: 0, moneyDelta: 0, resultMessage: "Left alone — it may resurface later." },
  private_meeting: { reputationDelta: 3, fanHeatDelta: 2, moneyDelta: 0, resultMessage: "Resolved quietly behind the scenes." },
  defend: { reputationDelta: -1, fanHeatDelta: 6, moneyDelta: 0, resultMessage: "Public defense landed — fans rallied behind them." },
  distance: { reputationDelta: 3, fanHeatDelta: -4, moneyDelta: 0, resultMessage: "Stayed neutral — rumors faded on their own." },
  investigate: { reputationDelta: 5, fanHeatDelta: 0, moneyDelta: -5000, resultMessage: "Internal review completed, no findings — reputation intact." },
  rebut: { reputationDelta: 5, fanHeatDelta: 0, moneyDelta: 0, resultMessage: "The rebuttal landed well with media and fans." },
  no_comment: { reputationDelta: -2, fanHeatDelta: 0, moneyDelta: 0, resultMessage: "Silence read as an admission to some." },
  transparency: { reputationDelta: 8, fanHeatDelta: 0, moneyDelta: -8000, resultMessage: "Transparency won real goodwill." },
  acknowledge: { reputationDelta: 4, fanHeatDelta: 0, moneyDelta: 0, resultMessage: "Fans appreciated being heard." },
  defend_booking: { reputationDelta: -3, fanHeatDelta: 0, moneyDelta: 0, resultMessage: "Came across as dismissive to critics." },
  fine: { reputationDelta: 5, fanHeatDelta: -3, moneyDelta: 2000, resultMessage: "Fine issued — promotion seen as keeping order." },
  let_it_ride: { reputationDelta: -4, fanHeatDelta: 8, moneyDelta: 0, resultMessage: "Drama drove engagement, but it wasn't a clean look." },
  apology: { reputationDelta: 2, fanHeatDelta: -1, moneyDelta: 0, resultMessage: "A tidy, unremarkable resolution." },
};

export function resolveControversyChoice(choiceId: string): ControversyResolution {
  return (
    CONSEQUENCES[choiceId] ?? {
      reputationDelta: 0,
      fanHeatDelta: 0,
      moneyDelta: 0,
      resultMessage: "Nothing came of it either way.",
    }
  );
}

// ============================================
// GENERATION
// ============================================

/**
 * Rolls for a random controversy event. Small weekly chance — this should
 * feel like an occasional real event, not a constant drumbeat.
 */
export function rollRandomControversy(
  roster: Fighter[],
  week: number,
  chance: number = 0.12
): ControversyEvent | null {
  if (!maybe(chance)) return null;

  const template = pick(SCENARIOS);

  let fighter: Fighter | null = null;
  if (template.needsFighter) {
    const eligible = roster.filter((f) => !f.isRetired);
    if (eligible.length === 0) return null;
    fighter = pick(eligible);
  }

  return {
    id: crypto.randomUUID(),
    week,
    title: template.title,
    description: template.description(fighter?.name),
    fighterId: fighter?.id ?? null,
    fighterName: fighter?.name ?? null,
    options: template.options,
  };
}
