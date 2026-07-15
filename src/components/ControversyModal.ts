"use client";

import { useGameStore } from "@/lib/gameStore";
import { Flame } from "lucide-react";

export default function ControversyModal() {
  const pendingControversy = useGameStore((s) => s.pendingControversy);
  const resolveControversyChoice = useGameStore((s) => s.resolveControversyChoice);

  if (!pendingControversy) return null;

  const containerClass = "fixed inset-0 bg-black z-50 flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-4";
  const innerClass = "bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-full max-w-sm";
  const headerClass = "flex items-center gap-2 mb-3";
  const titleClass = "font-semibold text-white";
  const descClass = "text-sm text-neutral-300 mb-5";
  const optionsClass = "space-y-2";
  const buttonClass = "w-full py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-medium text-left px-4";
  const hintClass = "block text-xs text-neutral-500";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        <div className={headerClass}>
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className={titleClass}>
            {pendingControversy.title}
          </h2>
        </div>
        <p className={descClass}>
          {pendingControversy.description}
        </p>
        <div className={optionsClass}>
          {pendingControversy.options.map((option) => (
            <button
              key={option.id}
              onClick={() => resolveControversyChoice(option.id)}
              className={buttonClass}
            >
              {option.label}
              <span className={hintClass}>
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}