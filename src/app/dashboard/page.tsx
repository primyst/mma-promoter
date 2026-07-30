"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import {
  Swords,
  Users,
  Newspaper,
  Trophy,
  DollarSign,
  Calendar,
  History,
  Wallet,
  Landmark,
  UserPlus,
} from "lucide-react";

export default function DashboardScreen() {
  const router = useRouter();
  const promotion = useGameStore((s) => s.promotion);
  const roster = useGameStore((s) => s.roster);
  const freeAgents = useGameStore((s) => s.freeAgents);
  const cards = useGameStore((s) => s.cards);
  const feed = useGameStore((s) => s.feed);
  const advanceWeek = useGameStore((s) => s.advanceWeek);
  const signFreeAgent = useGameStore((s) => s.signFreeAgent);

  const upcomingCards = cards.filter((c) => !c.isSimulated).length;
  const availableFighters = roster.filter(
    (f) => f.weeksUntilAvailable === 0 && f.health !== "injured" && !f.isRetired
  ).length;
  const recentFeed = feed.slice(0, 3);

  const dueCard = cards.find(
    (c) => c.week === promotion.currentWeek && !c.isSimulated
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold">{promotion.name}</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Week {promotion.currentWeek}
        </p>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="bg-neutral-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Bankroll
          </div>
          <p className="text-xl font-bold text-green-500">
            ${promotion.money.toLocaleString()}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Users className="w-3.5 h-3.5" /> Roster
          </div>
          <p className="text-xl font-bold">
            {availableFighters}/{roster.length}
          </p>
          <p className="text-[10px] text-neutral-600">available now</p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" /> Upcoming Cards
          </div>
          <p className="text-xl font-bold">{upcomingCards}</p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Trophy className="w-3.5 h-3.5" /> Reputation
          </div>
          <p className="text-xl font-bold">{promotion.reputation}/100</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 space-y-2 mb-4">
        <button
          onClick={() => {
            if (dueCard) {
              router.push("/results");
            } else {
              advanceWeek();
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-600 rounded-lg px-4 py-3 font-semibold text-sm"
        >
          {dueCard ? "Start Fight Night" : "Continue"}
        </button>
        <button
          onClick={() => router.push("/booking")}
          className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <Swords className="w-4 h-4" /> Book a Card
        </button>
        <button
          onClick={() => router.push("/history")}
          className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <History className="w-4 h-4" /> Results History
        </button>
        <button
          onClick={() => router.push("/rival")}
          className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <Swords className="w-4 h-4" /> Rival Promotion
        </button>
        <button
          onClick={() => router.push("/finances")}
          className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <Wallet className="w-4 h-4" /> Finances
        </button>
        <button
          onClick={() => router.push("/hall-of-fame")}
          className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <Landmark className="w-4 h-4" /> Hall of Fame
        </button>
      </div>

      {/* Free agents */}
      {freeAgents.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-wide text-neutral-500">
              Free Agents
            </h2>
            <span className="text-[10px] text-neutral-600">
              {freeAgents.length} unsigned
            </span>
          </div>
          <div className="space-y-2 overflow-x-visible">
            {freeAgents.slice(0, 5).map((fighter) => (
              <div
                key={fighter.id}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fighter.countryFlag} {fighter.name}
                    {fighter.nickname && (
                      <span className="text-neutral-500"> &ldquo;{fighter.nickname}&rdquo;</span>
                    )}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {fighter.weightClass} · {fighter.wins}-{fighter.losses}
                    {fighter.draws > 0 ? `-${fighter.draws}` : ""} · Age {fighter.age}
                  </p>
                </div>
                <button
                  onClick={() => signFreeAgent(fighter.id)}
                  className="shrink-0 flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 rounded-md px-3 py-1.5 text-xs font-medium ml-3"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign
                </button>
              </div>
            ))}
          </div>
          {freeAgents.length > 5 && (
            <p className="text-[10px] text-neutral-600 mt-2">
              +{freeAgents.length - 5} more available in Scouting
            </p>
          )}
        </div>
      )}

      {/* Recent feed preview */}
      {recentFeed.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-wide text-neutral-500">
              Latest
            </h2>
            <button
              onClick={() => router.push("/feed")}
              className="text-xs text-neutral-500 underline"
            >
              See all
            </button>
          </div>
          <div className="space-y-2">
            {recentFeed.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Newspaper className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs font-medium">{item.authorName}</span>
                </div>
                <p className="text-xs text-neutral-400">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
