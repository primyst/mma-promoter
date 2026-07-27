"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { ArrowLeft, Trophy, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

const HISTORY_WINDOW_WEEKS = 52; // "up to a year" — older cards still existed,
// just aren't browsable here; each fighter's own career log stays all-time
// regardless (wins/losses/title history never get pruned).

export default function HistoryScreen() {
  const router = useRouter();
  const cards = useGameStore((s) => s.cards);
  const roster = useGameStore((s) => s.roster);
  const promotion = useGameStore((s) => s.promotion);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rosterMap = useMemo(
    () => new Map(roster.map((f) => [f.id, f])),
    [roster]
  );

  const pastCards = useMemo(() => {
    return cards
      .filter(
        (c) =>
          c.isSimulated &&
          promotion.currentWeek - c.week <= HISTORY_WINDOW_WEEKS
      )
      .sort((a, b) => b.week - a.week);
  }, [cards, promotion.currentWeek]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Results History</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Last {HISTORY_WINDOW_WEEKS} weeks · {pastCards.length}{" "}
            {pastCards.length === 1 ? "card" : "cards"}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {pastCards.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-12">
            No cards run yet — book and simulate your first one.
          </p>
        )}

        {pastCards.map((card) => {
          const isExpanded = expandedId === card.id;
          const mainEvent = card.fights.find((f) => f.isMainEvent);
          const mainOutcome = card.outcomes?.find(
            (o) => o.fightId === mainEvent?.id
          );
          const mainWinner = mainOutcome
            ? rosterMap.get(mainOutcome.winnerId ?? "")
            : undefined;
          const mainLoserId = mainEvent
            ? mainEvent.fighterAId === mainOutcome?.winnerId
              ? mainEvent.fighterBId
              : mainEvent.fighterAId
            : undefined;
          const mainLoser = mainLoserId ? rosterMap.get(mainLoserId) : undefined;

          return (
            <div
              key={card.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : card.id)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-neutral-300">
                      Week {card.week}
                    </span>
                    {mainEvent?.isTitleFight && (
                      <Trophy className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  {mainWinner && mainLoser && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {mainWinner.name} def. {mainLoser.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {card.revenue != null && (
                    <span className="text-xs text-green-500 flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3" />
                      {card.revenue.toLocaleString()}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-600" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 border-t border-neutral-800 pt-3">
                  {card.fights.map((fight) => {
                    const outcome = card.outcomes?.find(
                      (o) => o.fightId === fight.id
                    );
                    const winner = outcome
                      ? rosterMap.get(outcome.winnerId ?? "")
                      : undefined;
                    const loserId =
                      fight.fighterAId === outcome?.winnerId
                        ? fight.fighterBId
                        : fight.fighterAId;
                    const loser = rosterMap.get(loserId);

                    const isFotn = card.bonuses?.fotn?.fightId === fight.id;
                    const isPotn = card.bonuses?.potn?.fightId === fight.id;

                    return (
                      <div
                        key={fight.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-neutral-300">
                          {winner?.name ?? "?"}{" "}
                          <span className="text-neutral-600">def.</span>{" "}
                          {loser?.name ?? "?"}
                          {isFotn && (
                            <span className="ml-1.5 text-[9px] uppercase text-yellow-500 border border-yellow-700/50 rounded px-1">
                              FOTN
                            </span>
                          )}
                          {isPotn && (
                            <span className="ml-1.5 text-[9px] uppercase text-purple-400 border border-purple-700/50 rounded px-1">
                              POTN
                            </span>
                          )}
                        </span>
                        <span className="text-neutral-500">
                          {outcome?.method}
                          {outcome?.method !== "Decision"
                            ? ` R${outcome?.round}`
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
