"use client";

import { useGameStore } from "@/lib/gameStore";
import { Flame } from "lucide-react";

export default function ControversyModal() {
  const pendingControversy = useGameStore((s) => s.pendingControversy);
  const resolveControversyChoice = useGameStore((s) => s.resolveControversyChoice);

  if (!pendingControversy) return null;

  return (
<>
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-white">{pendingControversy.title}</h2>
        </div>
        <p className="text-sm text-neutral-300 mb-5">
          {pendingControversy.description}
        </p>
        <div className="space-y-2">
          {pendingControversy.options.map((option) => (
            <button
              key={option.id}
              onClick={() => resolveControversyChoice(option.id)}
              className="w-full py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-medium text-left px-4"
            >
              {option.label}
              <span className="block text-xs text-neutral-500">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
</>
  );
}