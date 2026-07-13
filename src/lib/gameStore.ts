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
import { generateAmbientNews } from "./ambientNews";
import { updateTitleHistory, initTitleHistoryFromRoster } from "./titleHistory";
import {
  checkWeightMoveEligibility,
  applyWeightClassMove,
  vacateTitle,
} from "./weightClassMove";
import { WeightClass } from "@/types/game";

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

  // Weight class movement
  moveFighterWeightClass: (
    fighterId: string,
    direction: "up" | "down",
    targetClass: WeightClass
  ) => { success: boolean; error?: string };
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
  titleHistory: [],
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
      titleHistory: initTitleHistoryFromRoster(roster, 1),
      scheduledCardId: null,
    };
    set({ ...newState, draftCard: [] });
    saveGame(newState);
  },

  loadFromSave: () => {
    const saved = loadGame();
    if (!saved) return false;
    // Defensive defaults — protects against old saves created before a field
    // (like `feed`) existed. Without this, a stale save silently breaks
    // whatever new feature was added since it was created.
    const safeState: GameState = {
      promotion: saved.promotion,
      roster: saved.roster ?? [],
      cards: saved.cards ?? [],
      feed: saved.feed ?? [],
      titleHistory: saved.titleHistory ?? [],
      scheduledCardId: saved.scheduledCardId ?? null,
    };
    set({ ...safeState, draftCard: [] });
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
    const { scheduledCardId, cards, roster, promotion, feed, titleHistory } = get();

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

        // Title lineage: uses `roster` (pre-fight state) to know who was
        // champion going in, since updatedRoster's isChampion isn't flipped yet.
        const newTitleHistory = updateTitleHistory(
          card.fights,
          outcomes,
          roster,
          titleHistory,
          promotion.currentWeek
        );

        // Flip isChampion flags on the roster to match the new title history
        const openReignByFighterId = new Map(
          newTitleHistory
            .filter((r) => r.endWeek === null)
            .map((r) => [r.championId, r])
        );
        const rosterWithChampions = updatedRoster.map((f) => ({
          ...f,
          isChampion: openReignByFighterId.has(f.id),
        }));

        const revenue = estimateRevenue(card, rosterWithChampions);

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
          rosterWithChampions,
          promotion.currentWeek
        );
        const ambientItems = generateAmbientNews(rosterWithChampions, promotion.currentWeek);

        set({
          roster: rosterWithChampions,
          cards: updatedCards,
          promotion: updatedPromotion,
          feed: [...ambientItems, ...newFeedItems, ...feed], // newest first
          titleHistory: newTitleHistory,
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

      const ambientItems = generateAmbientNews(tickedRoster, promotion.currentWeek);

      set({
        roster: tickedRoster,
        promotion: { ...promotion, currentWeek: promotion.currentWeek + 1 },
        feed: [...ambientItems, ...feed],
      });
    }

    persistCurrentState(get());
    return result;
  },

  moveFighterWeightClass: (fighterId, direction, targetClass) => {
    const { roster, titleHistory, feed, promotion } = get();
    const fighter = roster.find((f) => f.id === fighterId);

    if (!fighter) {
      return { success: false, error: "Fighter not found" };
    }

    const eligibility = checkWeightMoveEligibility(fighter);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }

    const oldWeightClass = fighter.weightClass;
    const { updatedFighter, vacatedTitle } = applyWeightClassMove(
      fighter,
      direction,
      targetClass
    );

    const updatedRoster = roster.map((f) =>
      f.id === fighterId ? updatedFighter : f
    );

    const updatedTitleHistory = vacatedTitle
      ? vacateTitle(titleHistory, fighterId, promotion.currentWeek)
      : titleHistory;

    const newsContent = vacatedTitle
      ? `${fighter.name} vacates the ${oldWeightClass} title, moving ${direction} to ${targetClass}.`
      : `${fighter.name} announces a move ${direction} to ${targetClass}, leaving ${oldWeightClass} behind.`;

    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "news" as const,
      week: promotion.currentWeek,
      authorName: "MMA Wire",
      content: newsContent,
      relatedFighterIds: [fighterId],
    };

    set({
      roster: updatedRoster,
      titleHistory: updatedTitleHistory,
      feed: [newFeedItem, ...feed],
    });

    persistCurrentState(get());
    return { success: true };
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
    titleHistory: state.titleHistory,
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
