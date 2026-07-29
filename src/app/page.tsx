"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { generateStarterRoster } from "@/lib/generateRoster";

export default function StartScreen() {
  const router = useRouter();
  const initNewGame = useGameStore((s) => s.initNewGame);
  const loadFromSave = useGameStore((s) => s.loadFromSave);

  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [promotionName, setPromotionName] = useState("");
  const [promotionAbbreviation, setPromotionAbbreviation] = useState("");

  function handleContinue() {
    if (loadFromSave()) {
      router.push("/dashboard");
    } else {
      alert("No save found — start a New Game.");
    }
  }

  function handleStartNewGame() {
    const name = promotionName.trim();
    const abbreviation = promotionAbbreviation.trim().toUpperCase();
    if (!name || !abbreviation) return;

    const { roster, teams, freeAgents } = generateStarterRoster();
    initNewGame(name, abbreviation, roster, teams, freeAgents);
    router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#F5F0E8] flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(201,162,39,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.06),transparent_50%)]" />

      <div className="relative z-10 w-full border-b border-[#2a2a2a] overflow-hidden py-2">
        <div className="flex gap-8 whitespace-nowrap animate-[scroll_18s_linear_infinite] font-mono text-[11px] tracking-widest text-[#8A8A8A]">
          {Array(4).fill(0).map((_, i) => (
            <span key={i} className="flex gap-8">
              <span>CARD #001</span>
              <span className="text-[#C9A227]">SANCTIONED</span>
              <span>ROSTER: BUILDING</span>
              <span className="text-[#B91C1C]">0 WINS · 0 LOSSES · 0 DRAWS</span>
              <span>YOUR PROMOTION AWAITS</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="font-mono text-xs tracking-[0.3em] text-[#C9A227] mb-4">
          MAIN EVENT
        </span>
        <h1
          className="text-6xl sm:text-8xl font-black uppercase leading-[0.9] tracking-tight"
          style={{ fontFamily: "'Arial Narrow', 'Helvetica Neue Condensed', sans-serif" }}
        >
          MMA
          <br />
          Promoter
        </h1>
        <div className="mt-5 flex items-center gap-3 text-[#8A8A8A] text-sm">
          <span className="h-px w-8 bg-[#8A8A8A]/40" />
          <span>Build the roster. Book the cards. Run the promotion.</span>
          <span className="h-px w-8 bg-[#8A8A8A]/40" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 pb-14 flex flex-col gap-3">
        <button
          onClick={handleContinue}
          className="group relative w-full py-4 bg-[#161616] border border-[#333] rounded-md font-semibold tracking-wide text-[#F5F0E8] hover:border-[#8A8A8A] transition-colors"
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#0A0A0A] border border-[#333]" />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-[#0A0A0A] border border-[#333]" />
          Continue Promotion
        </button>

        {!showNewGameForm ? (
          <button
            onClick={() => setShowNewGameForm(true)}
            className="group relative w-full py-4 bg-[#B91C1C] rounded-md font-semibold tracking-wide text-[#F5F0E8] hover:bg-[#a11818] transition-colors"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#0A0A0A]" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-[#0A0A0A]" />
            New Promotion
          </button>
        ) : (
          <div className="w-full bg-[#161616] border border-[#333] rounded-md p-4 flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A]">
                Promotion Name
              </label>
              <input
                autoFocus
                value={promotionName}
                onChange={(e) => setPromotionName(e.target.value)}
                placeholder="e.g. Apex Fighting Championship"
                maxLength={40}
                className="mt-1 w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-[#F5F0E8] placeholder:text-[#5a5a5a] focus:outline-none focus:border-[#8A8A8A]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8A8A8A]">
                Abbreviation
              </label>
              <input
                value={promotionAbbreviation}
                onChange={(e) => setPromotionAbbreviation(e.target.value.slice(0, 6))}
                placeholder="e.g. AFC"
                maxLength={6}
                className="mt-1 w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-[#F5F0E8] placeholder:text-[#5a5a5a] uppercase focus:outline-none focus:border-[#8A8A8A]"
              />
            </div>
            <button
              onClick={handleStartNewGame}
              disabled={!promotionName.trim() || !promotionAbbreviation.trim()}
              className="w-full py-3 bg-[#B91C1C] rounded-md font-semibold tracking-wide text-[#F5F0E8] hover:bg-[#a11818] disabled:opacity-40 disabled:hover:bg-[#B91C1C] transition-colors"
            >
              Launch Promotion
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
