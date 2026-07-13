"use client";

import { useGameStore } from "@/lib/gameStore";
import { AlertTriangle } from "lucide-react";

export default function IncidentModal() {
  const pendingIncident = useGameStore((s) => s.pendingIncident);
  const resolveIncidentChoice = useGameStore((s) => s.resolveIncidentChoice);

  if (!pendingIncident) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-white">Incident at the Presser</h2>
        </div>
        <p className="text-sm text-neutral-300 mb-5">
          {pendingIncident.description}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => resolveIncidentChoice("fine")}
            className="w-full py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-medium text-left px-4"
          >
            Fine both fighters
            <span className="block text-xs text-neutral-500">
              Protects reputation, fans lose a little interest
            </span>
          </button>
          <button
            onClick={() => resolveIncidentChoice("let_it_slide")}
            className="w-full py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-medium text-left px-4"
          >
            Let it slide
            <span className="block text-xs text-neutral-500">
              Fans love the drama, but it looks unprofessional
            </span>
          </button>
          <button
            onClick={() => resolveIncidentChoice("hype_it_up")}
            className="w-full py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium text-left px-4"
          >
            Hype it up for ticket sales
            <span className="block text-xs text-red-200">
              Biggest fan heat boost, biggest reputation risk
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
