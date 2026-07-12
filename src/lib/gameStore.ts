import { create } from "zustand";
import {
  GameState,
  Fighter,
  FightCard,
  BookedFight,
  Promotion,
  saveGame,
  loadGame,
} from "@/types/game";
import { simulateCard } from "./fightSim";
import { validateCard } from "./booking";
import { generateFeedForCard } from "./feedGenerator";

// ============================================
// STORE SHAPE
// ============================================

interface GameStore extends GameState {
  // Setup
  initNewGame: (promotionName: string, roster: Fighter[]) => void;
  loadFromSave: () => boolean; // returns true if a save existed

  // Booking
  draftCard: BookedFight[]; // fights being assembled before submission
  addFightToDraft: (fight: BookedFight) => void;
  removeFightFromDraft: (fightId: string) => void;
  clearDraft: () => void;
  submitCard: () => { success: boolean; errors: string[] };

  // Week progression
  advanceWeek: () => FightCardResult | null;
}

export interface FightCardResult {
  card: FightCard;
  outcomes: ReturnType<typeof simulateCard>["outcomes"];
}

// ============================================
// STORE
// ============================================

export const useGameStore = create<GameStore>((set, get) => ({
  // ---- initial state ----
  promotion: {
    name: "",
    money: 0,
    reputation: 50,
    currentWeek: 1,
  },
  roster: [],
  cards: [],
  feed: [],
  scheduledCardId: null,
  draftCard: [],

  // ---- setup ----
  initNewGame: (promotionName, roster) => {
    const newState: GameState = {
      promotion: {
        name: promotionName,
        money: 500_000, // starting bankroll
        reputation: 50,
        currentWeek: 1,
      },
      roster,
      cards: [],
      feed: [],
      scheduledCardId: null,
    };
    set({ ...newState, draftCard: [] });
    saveGame(newState);
  },

  loadFromSave: () => {
    const saved = loadGame();
    if (!saved) return false;
    set({ ...saved, draftCard: [] });
    return true;
  },

  // ---- booking draft ----
  addFightToDraft: (fight) => {
    set((state) => ({ draftCard: [...state.draftCard, fight] }));
  },

  removeFightFromDraft: (fightId) => {
    set((state) => ({
      draftCard: state.draftCard.filter((f) => f.id !== fightId),
    }));
  },

  clearDraft: () => set({ draftCard: [] }),

  submitCard: () => {
    const { draftCard, promotion, cards } = get();
    const validation = validateCard(draftCard);

    if (!validation.valid) {
      return { success: false, errors: validation.blockers };
    }

    const newCard: FightCard = {
      id: crypto.randomUUID(),
      week: promotion.currentWeek,
      tier: "Main Card", // refined by suggestCardTier() in the booking UI if desired
      fights: draftCard,
      isSimulated: false,
    };

    const updatedCards = [...cards, newCard];
    set({
      cards: updatedCards,
      scheduledCardId: newCard.id,
      draftCard: [],
    });

    persistCurrentState(get());
    return { success: true, errors: [] };
  },

  // ---- week progression ----
  advanceWeek: () => {
    const { scheduledCardId, cards, roster, promotion, feed } = get();

    let result: FightCardResult | null = null;

    if (scheduledCardId) {
      const cardIndex = cards.findIndex((c) => c.id === scheduledCardId);
      const card = cards[cardIndex];

      if (card && !card.isSimulated) {
        const { outcomes, updatedRoster } = simulateCard(
          card.fights,
          roster,
          promotion.currentWeek
        );

        const revenue = estimateRevenue(card, updatedRoster);

        const updatedCard: FightCard = {
          ...card,
          isSimulated: true,
          revenue,
        };
        const updatedCards = [...cards];
        updatedCards[cardIndex] = updatedCard;

        const updatedPromotion: Promotion = {
          ...promotion,
          money: promotion.money + revenue,
          currentWeek: promotion.currentWeek + 1,
        };

        const newFeedItems = generateFeedForCard(
          outcomes,
          card.fights,
          updatedRoster,
          promotion.currentWeek
        );

        set({
          roster: updatedRoster,
          cards: updatedCards,
          promotion: updatedPromotion,
          feed: [...newFeedItems, ...feed], // newest first
          scheduledCardId: null,
        });

        result = { card: updatedCard, outcomes };
      }
    } else {
      // No card this week — still tick the clock and cooldowns
      const tickedRoster = roster.map((f) => ({
        ...f,
        weeksUntilAvailable: Math.max(0, f.weeksUntilAvailable - 1),
        health:
          f.weeksUntilAvailable <= 1 && f.health !== "fine"
            ? ("fine" as const)
            : f.health,
      }));

      set({
        roster: tickedRoster,
        promotion: { ...promotion, currentWeek: promotion.currentWeek + 1 },
      });
    }

    persistCurrentState(get());
    return result;
  },
}));

// ============================================
// HELPERS
// ============================================

function persistCurrentState(state: GameStore) {
  saveGame({
    promotion: state.promotion,
    roster: state.roster,
    cards: state.cards,
    feed: state.feed,
    scheduledCardId: state.scheduledCardId,
  });
}

/**
 * Rough revenue model for v0.1: base gate + per-fight fan heat bonus,
 * doubled for title fights. Refined once sponsors/PPV land in v0.3.
 */
function estimateRevenue(card: FightCard, roster: Fighter[]): number {
  const rosterMap = new Map(roster.map((f) => [f.id, f]));
  let revenue = 50_000; // base gate

  for (const fight of card.fights) {
    const a = rosterMap.get(fight.fighterAId);
    const b = rosterMap.get(fight.fighterBId);
    const combinedHeat = (a?.fanHeat ?? 0) + (b?.fanHeat ?? 0);
    const multiplier = fight.isTitleFight ? 2 : fight.isMainEvent ? 1.5 : 1;
    revenue += combinedHeat * 500 * multiplier;
  }

  return Math.round(revenue);
}
