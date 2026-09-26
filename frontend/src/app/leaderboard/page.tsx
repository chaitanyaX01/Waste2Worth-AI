"use client";

import React, { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api";
import { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <section className="mb-14">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-1">
          Community
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight">
          Leaderboard
        </h1>
        <p className="text-xs text-[#86868b] mt-1 max-w-md">
          Recognizing the top environmental guardians turning community waste into worth.
        </p>
      </section>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading rankings...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No rankings recorded yet. Submit your first report to claim the top rank!
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className="py-4.5 flex items-center justify-between px-2 -mx-2 hover:bg-white/[0.02] transition-colors rounded-xl"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-mono font-medium text-[#86868b]">
                  {entry.rank <= 3 ? (
                    <span className="text-white font-semibold">{entry.rank}</span>
                  ) : (
                    entry.rank
                  )}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {entry.display_name}
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    {entry.verified_reports_count} verified · {entry.badge_count} badges
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-400 font-mono">
                  {entry.points_balance} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
