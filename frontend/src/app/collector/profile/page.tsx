"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCollectorProfile } from "@/lib/api";
import { CollectorProfile } from "@/lib/types";

export default function CollectorProfilePage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (role !== "COLLECTOR" && role !== "ADMIN")) {
      router.push("/collector/login");
      return;
    }
    getCollectorProfile().then(setProfile).catch((e) => console.log(e));
  }, [isAuthenticated, role, isLoading]);

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <section className="mb-10 border-b border-white/[0.06] pb-8">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-1">
          Field Profile
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
          {user?.name || "Sanitation Operator"}
        </h1>
        <p className="text-xs text-[#86868b]">{user?.email}</p>
        <div className="flex items-center gap-3 mt-3 text-xs font-mono text-[#86868b]">
          <span>Code: {profile?.employee_code || "COL-101"}</span>
          <span>·</span>
          <span>Sector: {profile?.service_area || "Downtown"}</span>
        </div>
      </section>

      {/* Field Activity Metrics */}
      <section className="grid grid-cols-2 gap-6 mb-12">
        <div className="space-y-1">
          <div className="text-4xl font-semibold text-white font-sans tracking-tight">
            {profile?.assigned_tasks_count || 0}
          </div>
          <div className="text-xs text-[#86868b]">Active Tasks</div>
        </div>

        <div className="space-y-1">
          <div className="text-4xl font-semibold text-emerald-400 font-sans tracking-tight">
            {profile?.completed_tasks_count || 0}
          </div>
          <div className="text-xs text-[#86868b]">Cleanups Completed</div>
        </div>
      </section>

      {/* Sign Out */}
      <section className="pt-8 border-t border-white/[0.06] mt-auto">
        <button
          onClick={logout}
          className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
        >
          Sign Out of Collector Hub →
        </button>
      </section>
    </div>
  );
}
