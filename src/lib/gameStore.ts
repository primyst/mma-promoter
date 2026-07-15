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
import { runFightWeek, resolveIncident } from "./fightWeekEvents";
import { recalculateRankings } from "./rankings";
import { decrementContract, evaluateContractOffer } from "./contracts";
import { WeightClass, Incident, IncidentChoice, Team } from "@/types/game";

// ============================================
// STORE SHAPE
// ============================================

interface GameStore extends GameState {
  // Setup
  initNewGame: (promotionName: string, roster: Fighter[], teams: Team[]) => void;
  loadFromSave: () => boolean; // returns true if a save existed

  // Booking
  draftCard: BookedFight[]; // fights being assembled before submission
  addFightToDraft: (fight: BookedFight) => void;
  removeFightFromDraft: (fightId: string) => void;
  clearDraft: () => void;
  submitCard: (weeksAhead: number) => { success: boolean; errors: string[] };

  // Week progression
  advanceWeek: () => FightCardResult | null;

  // Weight class movement
  moveFighterWeightClass: (
    fighterId: string,
    direction: "up" | "down",
    targetClass: WeightClass
  ) => { success: boolean; error?: string };

  // Incident resolution
  resolveIncidentChoice: (choice: IncidentChoice) => void;

  // Contract negotiation
  offerContract: (
    fighterId: string,
    fightsOffered: number,
    purseOffered: number
  ) => { outcome: "accepted" | "rejected" | "countered"; counterPurse?: number; message: string };
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
  teams: [],
  cards: [],
  feed: [],
  titleHistory: [],
  pendingIncident: null,
  draftCard: [],

  // ---- setup ----
  initNewGame: (promotionName, roster, teams) => {
    const newState: GameState = {
      promotion: {
        name: promotionName,
        money: 500_000, // starting bankroll
        reputation: 50,
        currentWeek: 1,
      },
      roster,
      teams,
      cards: [],
      feed: [],
      titleHistory: initTitleHistoryFromRoster(roster, 1),
      pendingIncident: null,
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
      teams: saved.teams ?? [],
      cards: saved.cards ?? [],
      feed: saved.feed ?? [],
      titleHistory: saved.titleHistory ?? [],
      pendingIncident: saved.pendingIncident ?? null,
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

  submitCard: (weeksAhead: number) => {
    const { draftCard, promotion, cards, roster, feed } = get();
    const validation = validateCard(draftCard);

    if (!validation.valid) {
      return { success: false, errors: validation.blockers };
    }

    const targetWeek = promotion.currentWeek + Math.max(0, weeksAhead);

    const conflict = cards.find(
      (c) => c.week === targetWeek && !c.isSimulated
    );
    if (conflict) {
      return {
        success: false,
        errors: [`A card is already scheduled for week ${targetWeek}.`],
      };
    }

    const newCard: FightCard = {
      id: crypto.randomUUID(),
      week: targetWeek,
      tier: "Main Card",
      fights: draftCard,
      isSimulated: false,
    };

    // Fight week events (weigh-in + press conference) run for the headline
    // fight now, at booking time — this is the lead-up, before fight night.
    const rosterMap = new Map(roster.map((f) => [f.id, f]));
    const headliner = draftCard.find((f) => f.isMainEvent || f.isTitleFight);

    let newFeedItems: typeof feed = [];
    let newIncident: Incident | null = get().pendingIncident;

    if (headliner) {
      const fighterA = rosterMap.get(headliner.fighterAId);
      const fighterB = rosterMap.get(headliner.fighterBId);
      if (fighterA && fighterB) {
        const weekResult = runFightWeek(headliner, fighterA, fighterB, targetWeek);
        newFeedItems = weekResult.feedItems;
        if (weekResult.incident) {
          newIncident = weekResult.incident; // only one open incident at a time for now
        }
      }
    }

    set({
      cards: [...cards, newCard],
      feed: [...newFeedItems, ...feed],
      pendingIncident: newIncident,
      draftCard: [],
    });

    persistCurrentState(get());
    return { success: true, errors: [] };
  },

  // ---- week progression ----
  advanceWeek: () => {
    const { cards, roster, promotion, feed, titleHistory } = get();

    const dueCard = cards.find(
      (c) => c.week === promotion.currentWeek && !c.isSimulated
    );

    let result: FightCardResult | null = null;

    if (dueCard) {
      const cardIndex = cards.findIndex((c) => c.id === dueCard.id);

      const { outcomes, updatedRoster } = simulateCard(
        dueCard.fights,
        roster,
        promotion.currentWeek
      );

      const newTitleHistory = updateTitleHistory(
        dueCard.fights,
        outcomes,
        roster,
        titleHistory,
        promotion.currentWeek
      );

      const openReignByFighterId = new Map(
        newTitleHistory
          .filter((r) => r.endWeek === null)
          .map((r) => [r.championId, r])
      );
      const rosterWithChampions = updatedRoster.map((f) => ({
        ...f,
        isChampion: openReignByFighterId.has(f.id),
      }));

      // Rankings must be recalculated every time — a former champion needs
      // a real number again, a new champion needs their old number cleared,
      // and everyone else's win-loss shifts should reshuffle the ladder.
      const rosterWithRankings = recalculateRankings(rosterWithChampions);

      // Contracts: every fighter who actually competed uses up one fight
      // on their deal. If it hits zero, they become a free agent.
      const fightedFighterIds = new Set(
        dueCard.fights.flatMap((f) => [f.fighterAId, f.fighterBId])
      );
      const rosterWithContracts = rosterWithRankings.map((f) =>
        fightedFighterIds.has(f.id) ? decrementContract(f) : f
      );

      const expiredThisCard = rosterWithContracts.filter(
        (f) =>
          fightedFighterIds.has(f.id) &&
          f.contractFightsRemaining === null &&
          roster.find((orig) => orig.id === f.id)?.contractFightsRemaining !== null
      );

      // Purses: cost of booking this card, paid regardless of win/loss.
      const rosterMapForPurse = new Map(roster.map((f) => [f.id, f]));
      const purseCost = dueCard.fights.reduce((total, fight) => {
        const a = rosterMapForPurse.get(fight.fighterAId);
        const b = rosterMapForPurse.get(fight.fighterBId);
        return total + (a?.purse ?? 0) + (b?.purse ?? 0);
      }, 0);

      const revenue = estimateRevenue(dueCard, rosterWithContracts);
      const netRevenue = revenue - purseCost;

      const updatedCard: FightCard = {
        ...dueCard,
        isSimulated: true,
        revenue: netRevenue,
      };
      const updatedCards = [...cards];
      updatedCards[cardIndex] = updatedCard;

      const updatedPromotion: Promotion = {
        ...promotion,
        money: promotion.money + netRevenue,
        currentWeek: promotion.currentWeek + 1,
      };

      const newFeedItems = generateFeedForCard(
        outcomes,
        dueCard.fights,
        rosterWithContracts,
        promotion.currentWeek
      );
      const ambientItems = generateAmbientNews(rosterWithContracts, promotion.currentWeek);

      const freeAgencyFeedItems = expiredThisCard.map((f) => ({
        id: crypto.randomUUID(),
        type: "news" as const,
        week: promotion.currentWeek,
        authorName: "MMA Wire",
        content: `${f.name}'s contract has expired — now a free agent.`,
        relatedFighterIds: [f.id],
      }));

      set({
        roster: rosterWithContracts,
        cards: updatedCards,
        promotion: updatedPromotion,
        feed: [...freeAgencyFeedItems, ...ambientItems, ...newFeedItems, ...feed],
        titleHistory: newTitleHistory,
      });

      result = { card: updatedCard, outcomes };
    } else {
      // No card due this week — still tick the clock and cooldowns
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

  resolveIncidentChoice: (choice: IncidentChoice) => {
    const { pendingIncident, promotion, feed, roster } = get();
    if (!pendingIncident) return;

    const effect = resolveIncident(choice);

    const updatedRoster = roster.map((f) => {
      if (f.id === pendingIncident.fighterAId || f.id === pendingIncident.fighterBId) {
        return {
          ...f,
          fanHeat: Math.max(0, Math.min(100, f.fanHeat + effect.fanHeatDelta)),
        };
      }
      return f;
    });

    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "news" as const,
      week: promotion.currentWeek,
      authorName: "MMA Wire",
      content: effect.resultMessage,
      relatedFighterIds: [pendingIncident.fighterAId, pendingIncident.fighterBId],
    };

    set({
      roster: updatedRoster,
      promotion: {
        ...promotion,
        reputation: Math.max(0, Math.min(100, promotion.reputation + effect.reputationDelta)),
      },
      feed: [newFeedItem, ...feed],
      pendingIncident: null,
    });

    persistCurrentState(get());
  },

  offerContract: (fighterId, fightsOffered, purseOffered) => {
    const { roster, promotion, feed } = get();
    const fighter = roster.find((f) => f.id === fighterId);

    if (!fighter) {
      return { outcome: "rejected" as const, message: "Fighter not found" };
    }

    const result = evaluateContractOffer(fighter, fightsOffered, purseOffered);

    if (result.outcome === "accepted") {
      const updatedRoster = roster.map((f) =>
        f.id === fighterId
          ? { ...f, contractFightsRemaining: fightsOffered, purse: purseOffered }
          : f
      );

      const newFeedItem = {
        id: crypto.randomUUID(),
        type: "news" as const,
        week: promotion.currentWeek,
        authorName: "MMA Wire",
        content: result.message,
        relatedFighterIds: [fighterId],
      };

      set({
        roster: updatedRoster,
        feed: [newFeedItem, ...feed],
      });

      persistCurrentState(get());
    }

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
    teams: state.teams,
    cards: state.cards,
    feed: state.feed,
    titleHistory: state.titleHistory,
    pendingIncident: state.pendingIncident,
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
