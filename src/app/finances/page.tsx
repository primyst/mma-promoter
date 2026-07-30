"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { FinanceEntry } from "@/types/game";
import {
  ArrowLeft,
  Ticket,
  HandCoins,
  Gift,
  Award,
  Binoculars,
  Wallet,
} from "lucide-react";

const CATEGORY_META: Record<
  FinanceEntry["category"],
  { label: string; icon: typeof Ticket }
> = {
  gate: { label: "Gate Revenue", icon: Ticket },
  purses: { label: "Fighter Purses", icon: HandCoins },
  sponsors: { label: "Sponsor Payouts", icon: Gift },
  bonuses: { label: "Fight Night Bonuses", icon: Award },
  scouting: { label: "Scouting Spend", icon: Binoculars },
};

export default function FinancesScreen() {
  const router = useRouter();
  const promotion = useGameStore((s) => s.promotion);
  const financeLedger = useGameStore((s) => s.financeLedger);

  const totalsByCategory = useMemo(() => {
    const totals = new Map<FinanceEntry["category"], number>();
    for (const entry of financeLedger) {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    }
    return totals;
  }, [financeLedger]);

  const recent = [...financeLedger].reverse().slice(0, 30);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-neutral-500" /> Finances
          </h1>
          <p className="text-xs text-neutral-500">
            Bankroll: ${promotion.money.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Breakdown
          </h2>
          <div className="space-y-1.5">
            {(Object.keys(CATEGORY_META) as FinanceEntry["category"][]).map((category) => {
              const total = totalsByCategory.get(category) ?? 0;
              const { label, icon: Icon } = CATEGORY_META[category];
              if (total === 0 && !financeLedger.some((e) => e.category === category)) {
                return null;
              }
              return (
                <div
                  key={category}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      total >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {total >= 0 ? "+" : ""}
                    ${total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Recent Transactions
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center mt-8">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recent.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-300 truncate">{entry.description}</p>
                    <p className="text-[10px] text-neutral-600">Week {entry.week}</p>
                  </div>
                  <span
                    className={`text-xs font-medium shrink-0 ml-2 ${
                      entry.amount >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {entry.amount >= 0 ? "+" : ""}
                    ${entry.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
