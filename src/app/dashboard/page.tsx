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
} from "lucide-react";

export default function DashboardScreen() {
  const router = useRouter();
  const promotion = useGameStore((s) => s.promotion);
  const roster = useGameStore((s) => s.roster);
  const cards = useGameStore((s) => s.cards);
  const feed = useGameStore((s) => s.feed);

  const upcomingCards = cards.filter((c) => !c.isSimulated).length;
  const availableFighters = roster.filter(
    (f) => f.weeksUntilAvailable === 0 && f.health !== "injured" && !f.isRetired
  ).length;
  const recentFeed = feed.slice(0, 3);

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
          onClick={() => router.push("/booking")}
          className="w-full flex items-center gap-3 bg-red-600 rounded-lg px-4 py-3 font-medium text-sm"
        >
          <Swords className="w-4 h-4" /> Book a Card
        </button>
      </div>

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
