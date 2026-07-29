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
import { generateFreeAgentPool } from "./generateRoster";
import { developFighter } from "./developmentSystem";
import { processWeeklyAgingAndRetirement } from "./retirement";
import { getFameTier, FAME_GAIN } from "./fame";
import { getEligibleSponsors, checkSingleFightObjective, SPONSOR_LIST } from "./sponsors";
import { rollRandomControversy, resolveControversyChoice as resolveControversyLogic } from "./controversy";
import { generateMilestoneNews } from "./milestones";
import {
  getPromotionHandle,
  cardAnnouncementPost,
  postCardRecapPost,
  newSigningPost,
  sponsorDealPost,
  weightMovePost,
  officialStatementPost,
  milestoneCongratsPost,
  businessMilestonePost,
  fotnAnnouncementPost,
  potnAnnouncementPost,
} from "./promotionAccount";
import { computeCardBonuses, BONUS_AMOUNTS } from "./fightBonuses";
import { generateEventName } from "./eventNaming";
import { WeightClass, Incident, IncidentChoice, Team } from "@/types/game";

// ============================================
// STORE SHAPE
// ============================================

interface GameStore extends GameState {
  // Setup
  initNewGame: (
    promotionName: string,
    promotionAbbreviation: string,
    roster: Fighter[],
    teams: Team[],
    freeAgents: Fighter[]
  ) => void;
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
  signFreeAgent: (fighterId: string) => void;

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
    abbreviation: "",
    money: 0,
    reputation: 50,
    currentWeek: 1,
    numberedEventCount: 0,
    fightNightCount: 0,
  },
  roster: [],
  freeAgents: [],
  teams: [],
  cards: [],
  feed: [],
  titleHistory: [],
  pendingIncident: null,
  pendingControversy: null,
  draftCard: [],

  // ---- setup ----
  initNewGame: (promotionName, promotionAbbreviation, roster, teams, freeAgents) => {
    const newState: GameState = {
      promotion: {
        name: promotionName,
        abbreviation: promotionAbbreviation,
        money: 500_000, // starting bankroll
        reputation: 50,
        currentWeek: 1,
        numberedEventCount: 0,
        fightNightCount: 0,
      },
      roster,
      freeAgents,
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
      promotion: { ...saved.promotion, abbreviation: saved.promotion?.abbreviation ?? "" },
      roster: saved.roster ?? [],
      freeAgents: saved.freeAgents ?? [],
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

    const hasTitleFight = draftCard.some((f) => f.isTitleFight);
    const { eventName, updatedPromotion: promotionWithEventCount } =
      generateEventName(promotion, hasTitleFight);

    const newCard: FightCard = {
      id: crypto.randomUUID(),
      week: targetWeek,
      tier: "Main Card",
      fights: draftCard,
      isSimulated: false,
      eventName,
    };

    // Booking only announces the card now — weigh-ins, press conferences,
    // and any incidents happen later, the actual week of the fight (see
    // advanceWeek), so a card booked months out doesn't spoil its own
    // buildup early.
    const rosterMap = new Map(roster.map((f) => [f.id, f]));
    const headliner = draftCard.find((f) => f.isMainEvent || f.isTitleFight);

    const newFeedItems: typeof feed = [];

    if (headliner) {
      const fighterA = rosterMap.get(headliner.fighterAId);
      const fighterB = rosterMap.get(headliner.fighterBId);
      if (fighterA && fighterB) {
        const promotionHandle = getPromotionHandle(get().promotion.name);
        newFeedItems.push({
          id: crypto.randomUUID(),
          type: "promotion",
          week: targetWeek,
          authorName: get().promotion.name,
          authorHandle: "@" + promotionHandle,
          content: cardAnnouncementPost(
            fighterA.name,
            fighterB.name,
            eventName,
            headliner.isTitleFight
          ),
          relatedFighterIds: [fighterA.id, fighterB.id],
        });
      }
    }

    set({
      cards: [...cards, newCard],
      feed: [...newFeedItems, ...feed],
      promotion: promotionWithEventCount,
      draftCard: [],
    });

    persistCurrentState(get());
    return { success: true, errors: [] };
  },

  // ---- week progression ----
  advanceWeek: () => {
    const { cards, roster, freeAgents, promotion, feed, titleHistory, pendingControversy, pendingIncident } = get();

    // Free agents age/develop on the same yearly cadence as the roster —
    // a scouted green prospect you passed on doesn't stay frozen in time.
    const shouldAgeFreeAgents = promotion.currentWeek > 0 && promotion.currentWeek % 52 === 0;
    const developedFreeAgents = shouldAgeFreeAgents
      ? freeAgents.map((f) => developFighter({ ...f, age: f.age + 1 }))
      : freeAgents;

    const dueCard = cards.find(
      (c) => c.week === promotion.currentWeek && !c.isSimulated
    );

    let result: FightCardResult | null = null;

    if (dueCard) {
      const cardIndex = cards.findIndex((c) => c.id === dueCard.id);

      // Fight-week hype (press conference, weigh-ins, incidents) fires now,
      // the actual week of the card — not back when it was booked, so a
      // card scheduled months out doesn't spoil its own buildup early.
      const preFightRosterMap = new Map(roster.map((f) => [f.id, f]));
      const headlinerFight =
        dueCard.fights.find((f) => f.isMainEvent || f.isTitleFight) ?? dueCard.fights[0];

      let fightWeekFeedItems: typeof feed = [];
      let fightWeekIncident: Incident | null = pendingIncident;

      if (headlinerFight) {
        const fighterA = preFightRosterMap.get(headlinerFight.fighterAId);
        const fighterB = preFightRosterMap.get(headlinerFight.fighterBId);
        if (fighterA && fighterB) {
          const weekResult = runFightWeek(headlinerFight, fighterA, fighterB, promotion.currentWeek);
          fightWeekFeedItems = weekResult.feedItems;
          if (weekResult.incident) {
            fightWeekIncident = weekResult.incident;
          }
        }
      }

      const { outcomes, updatedRoster } = simulateCard(
        dueCard.fights,
        roster,
        promotion.currentWeek
      );

      const cardBonuses = computeCardBonuses(dueCard.fights, outcomes, roster);

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

      const bonusCost =
        (cardBonuses.fotn ? BONUS_AMOUNTS.fotn : 0) +
        (cardBonuses.potn ? BONUS_AMOUNTS.potn : 0);
      const netRevenue = revenue - purseCost + sponsorPayout - bonusCost;

      // Bonus winners get a fan heat bump — a standout performance should
      // actually move the needle on how much fans want to see them again.
      const bonusFighterIds = new Set([
        ...(cardBonuses.fotn?.fighterIds ?? []),
        ...(cardBonuses.potn ? [cardBonuses.potn.fighterId] : []),
      ]);
      const rosterWithBonusHeat = rosterWithFame.map((f) =>
        bonusFighterIds.has(f.id)
          ? { ...f, fanHeat: Math.min(100, f.fanHeat + 5) }
          : f
      );

      const updatedCard: FightCard = {
        ...dueCard,
        isSimulated: true,
        revenue: netRevenue,
        outcomes,
        bonuses: cardBonuses,
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
        rosterWithBonusHeat,
        promotion.currentWeek
      );
      const ambientItems = generateAmbientNews(rosterWithBonusHeat, promotion.currentWeek);
      const milestoneItems = generateMilestoneNews(
        fightedFighterIds,
        roster,
        rosterWithBonusHeat,
        promotion.name,
        promotion.currentWeek
      );

      // Promotion's own account: recaps the card, and separately congratulates
      // anyone who just hit a milestone (piggybacks off the same detection
      // milestoneItems already did, just adds the promotion's own reaction).
      const promotionHandle = getPromotionHandle(promotion.name);
      const promotionFeedItems: typeof feed = [
        {
          id: crypto.randomUUID(),
          type: "promotion",
          week: promotion.currentWeek,
          authorName: promotion.name,
          authorHandle: "@" + promotionHandle,
          content: postCardRecapPost(revenue, dueCard.fights.length),
          relatedFighterIds: [],
        },
      ];

      if (cardBonuses.fotn) {
        const [idA, idB] = cardBonuses.fotn.fighterIds;
        const nameA = rosterWithBonusHeat.find((f) => f.id === idA)?.name;
        const nameB = rosterWithBonusHeat.find((f) => f.id === idB)?.name;
        if (nameA && nameB) {
          promotionFeedItems.push({
            id: crypto.randomUUID(),
            type: "promotion",
            week: promotion.currentWeek,
            authorName: promotion.name,
            authorHandle: "@" + promotionHandle,
            content: fotnAnnouncementPost(nameA, nameB, BONUS_AMOUNTS.fotn),
            relatedFighterIds: [idA, idB],
          });
        }
      }

      if (cardBonuses.potn) {
        const winnerName = rosterWithBonusHeat.find(
          (f) => f.id === cardBonuses.potn!.fighterId
        )?.name;
        if (winnerName) {
          promotionFeedItems.push({
            id: crypto.randomUUID(),
            type: "promotion",
            week: promotion.currentWeek,
            authorName: promotion.name,
            authorHandle: "@" + promotionHandle,
            content: potnAnnouncementPost(winnerName, BONUS_AMOUNTS.potn),
            relatedFighterIds: [cardBonuses.potn.fighterId],
          });
        }
      }
      for (const milestoneItem of milestoneItems) {
        if (milestoneItem.relatedFighterIds.length === 0) continue;
        const fighterName = rosterWithBonusHeat.find(
          (f) => f.id === milestoneItem.relatedFighterIds[0]
        )?.name;
        if (!fighterName) continue;
        promotionFeedItems.push({
          id: crypto.randomUUID(),
          type: "promotion",
          week: promotion.currentWeek,
          authorName: promotion.name,
          authorHandle: "@" + promotionHandle,
          content: milestoneCongratsPost(fighterName),
          relatedFighterIds: milestoneItem.relatedFighterIds,
        });
      }

      const simulatedCardCount = updatedCards.filter((c) => c.isSimulated).length;
      if (simulatedCardCount > 0 && simulatedCardCount % 10 === 0) {
        promotionFeedItems.push({
          id: crypto.randomUUID(),
          type: "promotion",
          week: promotion.currentWeek,
          authorName: promotion.name,
          authorHandle: "@" + promotionHandle,
          content: businessMilestonePost(simulatedCardCount),
          relatedFighterIds: [],
        });
      }

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
        rosterWithBonusHeat,
        newTitleHistory,
        promotion.currentWeek
      );
      const finalRoster = recalculateRankings(retirementResult.roster);

      const newControversy = pendingControversy
        ? pendingControversy
        : rollRandomControversy(finalRoster, promotion.currentWeek);

      set({
        roster: finalRoster,
        freeAgents: developedFreeAgents,
        cards: updatedCards,
        promotion: updatedPromotion,
        feed: [
          ...fightWeekFeedItems,
          ...promotionFeedItems,
          ...milestoneItems,
          ...retirementResult.feedItems,
          ...sponsorFeedItems,
          ...freeAgencyFeedItems,
          ...ambientItems,
          ...newFeedItems,
          ...feed,
        ],
        titleHistory: retirementResult.titleHistory,
        pendingIncident: fightWeekIncident,
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
        freeAgents: developedFreeAgents,
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

    const promotionHandle = getPromotionHandle(promotion.name);
    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "promotion" as const,
      week: promotion.currentWeek,
      authorName: promotion.name,
      authorHandle: "@" + promotionHandle,
      content: weightMovePost(
        fighter.name,
        direction,
        oldWeightClass,
        targetClass,
        vacatedTitle
      ),
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

    const promotionHandle = getPromotionHandle(promotion.name);
    // A fine is quiet, administrative housekeeping — nobody tweets about
    // paperwork. Letting it slide or hyping it up are actual PR moves the
    // public would notice, so those still make the feed.
    const newFeedItem =
      choice === "fine"
        ? null
        : {
            id: crypto.randomUUID(),
            type: "promotion" as const,
            week: promotion.currentWeek,
            authorName: promotion.name,
            authorHandle: "@" + promotionHandle,
            content: officialStatementPost(effect.resultMessage),
            relatedFighterIds: [pendingIncident.fighterAId, pendingIncident.fighterBId],
          };

    set({
      roster: updatedRoster,
      promotion: {
        ...promotion,
        reputation: Math.max(0, Math.min(100, promotion.reputation + effect.reputationDelta)),
      },
      feed: newFeedItem ? [newFeedItem, ...feed] : feed,
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

    const promotionHandle = getPromotionHandle(promotion.name);
    const hypePost = {
      id: crypto.randomUUID(),
      type: "promotion" as const,
      week: promotion.currentWeek,
      authorName: promotion.name,
      authorHandle: "@" + promotionHandle,
      content: newSigningPost(candidate.name, candidate.weightClass),
      relatedFighterIds: [candidate.id],
    };

    set({
      roster: [...roster, candidate],
      feed: [hypePost, newFeedItem, ...feed],
    });

    persistCurrentState(get());
  },

  signFreeAgent: (fighterId) => {
    const { roster, freeAgents, feed, promotion } = get();
    const candidate = freeAgents.find((f) => f.id === fighterId);
    if (!candidate) return;

    const signedCandidate: Fighter = {
      ...candidate,
      contractFightsRemaining: candidate.contractFightsRemaining ?? 4,
    };

    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "news" as const,
      week: promotion.currentWeek,
      authorName: "MMA Wire",
      content: `${signedCandidate.name} has signed with the promotion — ${signedCandidate.weightClass} division.`,
      relatedFighterIds: [signedCandidate.id],
    };

    const promotionHandle = getPromotionHandle(promotion.name);
    const hypePost = {
      id: crypto.randomUUID(),
      type: "promotion" as const,
      week: promotion.currentWeek,
      authorName: promotion.name,
      authorHandle: "@" + promotionHandle,
      content: newSigningPost(signedCandidate.name, signedCandidate.weightClass),
      relatedFighterIds: [signedCandidate.id],
    };

    // Backfill the pool so there's always something to browse — signing
    // one free agent doesn't drain the market to nothing.
    const replacement = generateFreeAgentPool(1)[0];

    set({
      roster: [...roster, signedCandidate],
      freeAgents: [...freeAgents.filter((f) => f.id !== fighterId), replacement],
      feed: [hypePost, newFeedItem, ...feed],
    });

    persistCurrentState(get());
  },

  signSponsor: (fighterId, sponsorId) => {
    const { roster, feed, promotion } = get();
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

    const promotionHandle = getPromotionHandle(promotion.name);
    const dealPost = {
      id: crypto.randomUUID(),
      type: "promotion" as const,
      week: promotion.currentWeek,
      authorName: promotion.name,
      authorHandle: "@" + promotionHandle,
      content: sponsorDealPost(fighter.name, sponsor.name),
      relatedFighterIds: [fighterId],
    };

    set({ roster: updatedRoster, feed: [dealPost, ...feed] });
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

    const promotionHandle = getPromotionHandle(promotion.name);
    const newFeedItem = {
      id: crypto.randomUUID(),
      type: "promotion" as const,
      week: promotion.currentWeek,
      authorName: promotion.name,
      authorHandle: "@" + promotionHandle,
      content: officialStatementPost(effect.resultMessage),
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
    freeAgents: state.freeAgents,
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
