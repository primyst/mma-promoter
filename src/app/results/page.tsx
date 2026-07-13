"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { FightCardResult } from "@/lib/gameStore";
import {
  Trophy,
  Zap,
  Hand,
  Scale,
  DollarSign,
  ChevronRight,
  Crown,
  MessageCircle,
  Newspaper,
  Megaphone,
} from "lucide-react";

// ============================================
// METHOD ICON HELPER
// ============================================

function MethodIcon({ method }: { method: string }) {
  if (method === "KO/TKO") return <Zap className="w-4 h-4 text-red-500" />;
  if (method === "Submission") return <Hand className="w-4 h-4 text-purple-500" />;
  return <Scale className="w-4 h-4 text-neutral-400" />;
}

// ============================================
// FEED PREVIEW (shows this week's reactions inline)
// ============================================

function FeedTypeIcon({ type }: { type: string }) {
  if (type === "news") return <Newspaper className="w-3.5 h-3.5 text-blue-400" />;
  if (type === "callout") return <Megaphone className="w-3.5 h-3.5 text-red-500" />;
  return <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />;
}

function FeedPreview({ week }: { week: number }) {
  const feed = useGameStore((s) => s.feed);
  const router = useRouter();
  const thisWeek = feed.filter((f) => f.week === week).slice(0, 4);

  if (thisWeek.length === 0) return null;

  return (
    <div className="px-4 py-2 space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
        Reactions
      </h2>
      {thisWeek.map((item) => (
        <div
          key={item.id}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <FeedTypeIcon type={item.type} />
            <span className="text-xs font-medium">{item.authorName}</span>
          </div>
          <p className="text-xs text-neutral-300">{item.content}</p>
        </div>
      ))}
      <button
        onClick={() => router.push("/feed")}
        className="text-xs text-neutral-500 underline"
      >
        See full feed
      </button>
    </div>
  );
}

// ============================================
// MAIN RESULTS SCREEN
// ============================================

export default function ResultsScreen() {
  const router = useRouter();
  const roster = useGameStore((s) => s.roster);
  const promotion = useGameStore((s) => s.promotion);
  const advanceWeek = useGameStore((s) => s.advanceWeek);

  const [result, setResult] = useState<FightCardResult | null>(null);
  const [hasAdvanced, setHasAdvanced] = useState(false);

  const rosterMap = new Map(roster.map((f) => [f.id, f]));

  function handleAdvance() {
    const outcome = advanceWeek();
    setResult(outcome);
    setHasAdvanced(true);
  }

  // ---- Pre-advance state: just the button ----
  if (!hasAdvanced) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-neutral-500 text-sm">Week {promotion.currentWeek}</p>
        <button
          onClick={handleAdvance}
          className="w-full max-w-sm py-4 bg-red-600 rounded-lg font-semibold text-lg"
        >
          Advance Week
        </button>
      </div>
    );
  }

  // ---- No card was scheduled this week ----
  if (!result) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-neutral-400">
          No card was booked this week. Fighters rested and cooldowns ticked
          down.
        </p>
        <button
          onClick={() => router.push("/booking")}
          className="w-full max-w-sm py-3 bg-white text-black rounded-lg font-medium flex items-center justify-center gap-2"
        >
          Book Next Card <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ---- Card results ----
  const mainEventOutcome = result.outcomes.find(
    (o) =>
      result.card.fights.find((f) => f.id === o.fightId)?.isMainEvent
  );

  return (
    <div className="min-h-screen bg-black text-white pb-36">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold">Fight Night Results</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Week {result.card.week}
        </p>
      </div>

      {/* Revenue banner */}
      <div className="mx-4 mt-4 bg-neutral-900 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Card Revenue</p>
          <p className="text-xl font-bold text-green-500">
            ${result.card.revenue?.toLocaleString()}
          </p>
        </div>
        <DollarSign className="w-8 h-8 text-green-500/40" />
      </div>

      {/* Fight results */}
      <div className="px-4 py-4 space-y-3">
        {result.outcomes.map((outcome) => {
          const fight = result.card.fights.find((f) => f.id === outcome.fightId);
          if (!fight) return null;

          const winner = rosterMap.get(outcome.winnerId ?? "");
          const loser =
            fight.fighterAId === outcome.winnerId
              ? rosterMap.get(fight.fighterBId)
              : rosterMap.get(fight.fighterAId);

          const isMainEvent = fight.isMainEvent;

          return (
            <div
              key={outcome.fightId}
              className={`rounded-lg p-4 border ${
                isMainEvent
                  ? "border-yellow-600 bg-yellow-950/20"
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {fight.isTitleFight && (
                  <Crown className="w-3.5 h-3.5 text-yellow-500" />
                )}
                {isMainEvent && (
                  <span className="text-[10px] uppercase tracking-wide text-yellow-500 font-medium">
                    Main Event
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="font-semibold">{winner?.name}</span>
                </div>
                <span className="text-neutral-600 text-xs">def.</span>
                <span className="text-neutral-400">{loser?.name}</span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                <MethodIcon method={outcome.method} />
                {outcome.method}
                {outcome.method !== "Decision" && `, Round ${outcome.round}`}
              </div>

              {outcome.summary && (
                <p className="text-xs text-neutral-400 mt-2 italic">
                  {outcome.summary}
                </p>
              )}

              {outcome.judgeScores && (
                <div className="mt-3 pt-3 border-t border-neutral-800 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-600 mb-1">
                    Judges' Scorecards
                  </p>
                  {outcome.judgeScores.map((card, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs text-neutral-500"
                    >
                      <span>{card.judgeName}</span>
                      <span>
                        {card.winnerScore}-{card.loserScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FeedPreview week={result.card.week} />

      {/* Sticky continue bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-black border-t border-neutral-800 z-30">
        <button
          onClick={() => router.push("/booking")}
          className="w-full py-3 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center gap-2"
        >
          Book Next Card <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
