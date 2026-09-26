"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCitizenBadges, getCitizenReports } from "@/lib/api";
import { BadgeItem, WasteReport } from "@/lib/types";
import { Award, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [reports, setReports] = useState<WasteReport[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    getCitizenBadges().then(setBadges).catch((e) => console.log(e));
    getCitizenReports().then(setReports).catch((e) => console.log(e));
  }, [isAuthenticated, isLoading]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <section className="mb-12 border-b border-white/[0.06] pb-10">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-1">
          Account
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-2">
          {user?.name || "Citizen Profile"}
        </h1>
        <p className="text-xs text-[#86868b]">{user?.email}</p>
      </section>

      {/* Stats summary */}
      <section className="grid grid-cols-2 gap-6 mb-12">
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-semibold text-emerald-400 font-sans tracking-tight">
            {user?.points_balance || 0}
          </div>
          <div className="text-xs text-[#86868b]">Eco Points Balance</div>
        </div>

        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-semibold text-white font-sans tracking-tight">
            {reports.length}
          </div>
          <div className="text-xs text-[#86868b]">Community Reports</div>
        </div>
      </section>

      {/* Badges */}
      {badges.length > 0 && (
        <section className="py-10 border-t border-white/[0.06]">
          <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-6">
            Badges
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/[0.06] space-y-1"
              >
                <div className="text-xs font-medium text-white">{b.name}</div>
                <p className="text-[11px] text-[#86868b] leading-tight">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sign Out */}
      <section className="pt-8 border-t border-white/[0.06]">
        <button
          onClick={logout}
          className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
        >
          Sign Out of Account →
        </button>
      </section>
    </div>
  );
}
