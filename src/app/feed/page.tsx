"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { FeedItem, FeedItemType } from "@/types/game";
import { Newspaper, MessageCircle, Megaphone, Mic, Users } from "lucide-react";

// ============================================
// FEED ITEM ICON + STYLE
// ============================================

function FeedIcon({ type }: { type: FeedItemType }) {
  if (type === "news") return <Newspaper className="w-4 h-4 text-blue-400" />;
  if (type === "callout") return <Megaphone className="w-4 h-4 text-red-500" />;
  if (type === "pundit") return <Mic className="w-4 h-4 text-purple-400" />;
  if (type === "fan") return <Users className="w-4 h-4 text-green-400" />;
  return <MessageCircle className="w-4 h-4 text-neutral-400" />;
}

function sentimentColor(sentiment?: "good" | "neutral" | "bad"): string {
  if (sentiment === "good") return "border-l-2 border-l-green-600";
  if (sentiment === "bad") return "border-l-2 border-l-red-600";
  return "";
}

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-lg p-4 ${sentimentColor(item.sentiment)}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <FeedIcon type={item.type} />
        <span className="text-sm font-medium">{item.authorName}</span>
        {item.authorHandle && (
          <span className="text-xs text-neutral-500">{item.authorHandle}</span>
        )}
        <span className="text-[10px] text-neutral-600 ml-auto">
          Week {item.week}
        </span>
      </div>
      <p className="text-sm text-neutral-200 leading-relaxed">{item.content}</p>
    </div>
  );
}

// ============================================
// MAIN FEED SCREEN
// ============================================

const FILTERS: { label: string; value: FeedItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tweets", value: "tweet" },
  { label: "News", value: "news" },
  { label: "Callouts", value: "callout" },
  { label: "Pundits", value: "pundit" },
  { label: "Fans", value: "fan" },
];

export default function FeedScreen() {
  const feed = useGameStore((s) => s.feed);
  const [filter, setFilter] = useState<FeedItemType | "all">("all");

  const filtered = filter === "all" ? feed : feed.filter((f) => f.type === filter);

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold">The Feed</h1>
        <p className="text-xs text-neutral-500 mt-1">
          {feed.length} {feed.length === 1 ? "post" : "posts"}
        </p>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
              filter === f.value
                ? "bg-white text-black border-white"
                : "border-neutral-700 text-neutral-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-12">
            Nothing here yet — book a card and see what happens.
          </p>
        )}
        {filtered.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
