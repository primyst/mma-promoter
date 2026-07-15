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
import { scoutForTalent as scoutForTalentLogic, ScoutTier } from "./scouting";
import { processWeeklyAgingAndRetirement } from "./retirement";
import { getFameTier, FAME_GAIN } from "./fame";
import { getEligibleSponsors, checkSingleFightObjective, SPONSOR_LIST } from "./sponsors";
import { rollRandomControversy, resolveControversyChoice as resolveControversyLogic } from "./controversy";
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

  // Controversy resolution
  resolveControversyChoice: (choiceId: string) => void;

  // Contract negotiation
  offerContract: (
    fighterId: string,
    fightsOffered: number,
    purseOffered: number
  ) => { outcome: "accepted" | "rejected" | "countered"; counterPurse?: number; message: string };

  // Scouting
  scoutForTalent: (
    weightClass: WeightClass,
    tier: ScoutTier
  ) => { success: boolean; error?: string; candidates?: Fighter[] };
  signProspect: (candidate: Fighter) => void;

  // Sponsors
  signSponsor: (fighterId: string, sponsorId: string) => { success: boolean; error?: string };
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
  pendingControversy: null,
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
      pendingControversy: null,
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
      pendingControversy: saved.pendingControversy ?? null,
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
    const { cards, roster, promotion, feed, titleHistory, pendingControversy } = get();

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

      // Title-specific fame bonuses — winning a belt for the first time
      // pays more fame than just defending one already held, since it
      // doesn't know at the generic per-fight level whether this was a
      // title fight at all.
      const titleFameBonuses = new Map<string, number>();
      for (const fight of dueCard.fights.filter((f) => f.isTitleFight)) {
        const outcome = outcomes.find((o) => o.fightId === fight.id);
        if (!outcome || !outcome.winnerId) continue;
        const preFightWinner = rosterMapForPurse.get(outcome.winnerId);
        if (!preFightWinner) continue;
        const bonus = preFightWinner.isChampion
          ? FAME_GAIN.titleDefense
          : FAME_GAIN.titleWin;
        titleFameBonuses.set(
          outcome.winnerId,
          (titleFameBonuses.get(outcome.winnerId) ?? 0) + bonus
        );
      }

      // Sponsor objectives — check every fighter with an active sponsor
      // deal who competed this card; payout goes to the promotion if met.
      let sponsorPayout = 0;
      const sponsorFeedItems: typeof feed = [];
      const rosterWithSponsorClears = rosterWithContracts.map((f) => {
        if (!f.activeSponsorId || !fightedFighterIds.has(f.id)) return f;

        const fight = dueCard.fights.find(
          (bf) => bf.fighterAId === f.id || bf.fighterBId === f.id
        );
        const outcome = outcomes.find((o) => o.fightId === fight?.id);
        if (!fight || !outcome) return f;

        const sponsor = SPONSOR_LIST.find((s) => s.id === f.activeSponsorId);
        if (!sponsor) return f;

        const originalFighter = rosterMapForPurse.get(f.id);
        const wasChampionGoingIn = originalFighter?.isChampion ?? false;
        const fighterWon = outcome.winnerId === f.id;

        const fulfilled = checkSingleFightObjective(
          sponsor,
          fighterWon,
          wasChampionGoingIn,
          outcome
        );

        if (fulfilled) {
          sponsorPayout += sponsor.payout;
          sponsorFeedItems.push({
            id: crypto.randomUUID(),
            type: "news" as const,
            week: promotion.currentWeek,
            authorName: "MMA Wire",
            content: `${f.name} delivered on their ${sponsor.name} deal — bonus paid out.`,
            relatedFighterIds: [f.id],
          });
          return { ...f, activeSponsorId: null };
        }
        // Objective not met this fight — deal ends either way, one shot only
        return { ...f, activeSponsorId: null };
      });

      // Apply title fame bonuses on top of the base fame already added in
      // applyFightResult inside simulateCard.
      const rosterWithFame = rosterWithSponsorClears.map((f) =>
        titleFameBonuses.has(f.id)
          ? { ...f, fame: f.fame + (titleFameBonuses.get(f.id) ?? 0) }
          : f
      );

      const revenue = estimateRevenue(dueCard, rosterWithFame);
      const netRevenue = revenue - purseCost + sponsorPayout;

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
        rosterWithFame,
        promotion.currentWeek
      );
      const ambientItems = generateAmbientNews(rosterWithFame, promotion.currentWeek);

      const freeAgencyFeedItems = expiredThisCard.map((f) => ({
        id: crypto.randomUUID(),
        type: "news" as const,
        week: promotion.currentWeek,
        authorName: "MMA Wire",
        content: `${f.name}'s contract has expired — now a free agent.`,
        relatedFighterIds: [f.id],
      }));

      // Aging + retirement rolls happen every week regardless of a card —
      // run it now using the week we're advancing FROM (before increment),
      // so age-ups line up with the year that just ended.
      const retirementResult = processWeeklyAgingAndRetirement(
        rosterWithFame,
        newTitleHistory,
        promotion.currentWeek
      );
      const finalRoster = recalculateRankings(retirementResult.roster);

      const newControversy = pendingControversy
        ? pendingControversy
        : rollRandomControversy(finalRoster, promotion.currentWeek);

      set({
        roster: finalRoster,
        cards: updatedCards,
        promotion: updatedPromotion,
        feed: [
          ...retirementResult.feedItems,
          ...sponsorFeedItems,
          ...freeAgencyFeedItems,
          ...ambientItems,
          ...newFeedItems,
          ...feed,
        ],
        titleHistory: retirementResult.titleHistory,
        pendingControversy: newControversy,
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

      const retirementResult = processWeeklyAgingAndRetirement(
        tickedRoster,
        titleHistory,
        promotion.currentWeek
      );
      const finalTickedRoster = recalculateRankings(retirementResult.roster);

      const newControversy = pendingControversy
        ? pendingControversy
        : rollRandomControversy(finalTickedRoster, promotion.currentWeek);

      set({
        roster: finalTickedRoster,
        promotion: { ...promotion, currentWeek: promotion.currentWeek + 1 },
        feed: [...retirementResult.feedItems, ...ambientItems, ...feed],
        titleHistory: retirementResult.titleHistory,
        pendingControversy: newControversy,
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

  scoutForTalent: (weightClass, tier) => {
    const { promotion } = get();
    const result = scoutForTalentLogic(weightClass, tier);

    if (promotion.money < result.cost) {
      return {
        success: false,
        error: `Not enough money — scouting costs $${result.cost.toLocaleString()}.`,
      };
    }

    set({
      promotion: { ...promotion, money: promotion.money - result.cost },
    });

    persistCurrentState(get());
    return { success: true, candidates: result.candidates };
  },

  signProspect: (candidate) => {
    const { roster, feed, promotion } = get();

    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "news" as const,
      week: promotion.currentWeek,
      authorName: "MMA Wire",
      content: `${candidate.name} has signed with the promotion — ${candidate.weightClass} division.`,
      relatedFighterIds: [candidate.id],
    };

    set({
      roster: [...roster, candidate],
      feed: [newFeedItem, ...feed],
    });

    persistCurrentState(get());
  },

  signSponsor: (fighterId, sponsorId) => {
    const { roster } = get();
    const fighter = roster.find((f) => f.id === fighterId);

    if (!fighter) {
      return { success: false, error: "Fighter not found" };
    }
    if (fighter.activeSponsorId) {
      return { success: false, error: "Already has an active sponsor deal" };
    }

    const sponsor = SPONSOR_LIST.find((s) => s.id === sponsorId);
    if (!sponsor) {
      return { success: false, error: "Sponsor not found" };
    }

    const { tier } = getFameTier(fighter.fame);
    if (tier < sponsor.minFameTier) {
      return { success: false, error: "Fighter isn't famous enough for this sponsor yet" };
    }

    const updatedRoster = roster.map((f) =>
      f.id === fighterId ? { ...f, activeSponsorId: sponsorId } : f
    );

    set({ roster: updatedRoster });
    persistCurrentState(get());
    return { success: true };
  },

  resolveControversyChoice: (choiceId) => {
    const { pendingControversy, promotion, feed, roster } = get();
    if (!pendingControversy) return;

    const effect = resolveControversyLogic(choiceId);

    const updatedRoster = pendingControversy.fighterId
      ? roster.map((f) =>
          f.id === pendingControversy.fighterId
            ? { ...f, fanHeat: Math.max(0, Math.min(100, f.fanHeat + effect.fanHeatDelta)) }
            : f
        )
      : roster;

    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "news" as const,
      week: promotion.currentWeek,
      authorName: "MMA Wire",
      content: effect.resultMessage,
      relatedFighterIds: pendingControversy.fighterId ? [pendingControversy.fighterId] : [],
    };

    set({
      roster: updatedRoster,
      promotion: {
        ...promotion,
        reputation: Math.max(0, Math.min(100, promotion.reputation + effect.reputationDelta)),
        money: promotion.money + effect.moneyDelta,
      },
      feed: [newFeedItem, ...feed],
      pendingControversy: null,
    });

    persistCurrentState(get());
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
    pendingControversy: state.pendingControversy,
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
