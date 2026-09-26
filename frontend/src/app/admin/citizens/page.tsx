"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAdminCitizens } from "@/lib/api";
import { ChevronLeft } from "lucide-react";

export default function AdminCitizensPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      getAdminCitizens()
        .then(setCitizens)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <div className="mb-10">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Operations</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
          Citizen Network
        </h1>
        <p className="text-xs text-[#86868b] mt-1">
          Registered community reporters and eco points ledger.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading citizen directory...
        </div>
      ) : citizens.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No citizens registered yet.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {citizens.map((c) => (
            <div
              key={c.id}
              className="py-4.5 px-2 -mx-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-xl"
            >
              <div>
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="text-xs text-[#86868b]">{c.email}</div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-400 font-mono">
                  {c.points_balance || 0} pts
                </div>
                <div className="text-[11px] text-[#86868b]">
                  {c.reports_count || 0} reports
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
