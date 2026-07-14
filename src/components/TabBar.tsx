"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Swords, Newspaper, Trophy, Users } from "lucide-react";

const TABS = [
  { label: "Home", path: "/dashboard", icon: LayoutDashboard },
  { label: "Book", path: "/booking", icon: Swords },
  { label: "Roster", path: "/roster", icon: Users },
  { label: "Feed", path: "/feed", icon: Newspaper },
  { label: "Results", path: "/results", icon: Trophy },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on the start screen — nothing to navigate to before a game exists
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-800 flex z-40">
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              isActive ? "text-white" : "text-neutral-500"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
