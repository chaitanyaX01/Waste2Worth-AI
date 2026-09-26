"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAdminDashboardStats, getAdminReports } from "@/lib/api";
import { DashboardStats, WasteReport } from "@/lib/types";
import { ChevronRight, ArrowUpRight } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("w2w_token");
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("w2w_user") : null;
    let effectiveRole = role;
    if (!effectiveRole && storedUser) {
      try {
        effectiveRole = JSON.parse(storedUser).role;
      } catch (_) {}
    }

    if ((!isAuthenticated && !hasToken) || (effectiveRole && effectiveRole !== "ADMIN")) {
      router.push("/admin/login");
    } else if (isAuthenticated || hasToken) {
      Promise.all([getAdminDashboardStats(), getAdminReports()])
        .then(([s, r]) => {
          setStats(s);
          setRecentReports(r.slice(0, 5));
        })
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

  const totalReports = stats?.total_reports ?? 10;
  const completedReports = stats?.completed_reports ?? 4;
  const activeReports = Math.max(0, totalReports - completedReports);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Completed</span>;
      case "IN_PROGRESS":
      case "ASSIGNED":
        return <span className="text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">Assigned</span>;
      case "VERIFIED":
        return <span className="text-xs text-teal-400 font-medium px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">Verified</span>;
      default:
        return <span className="text-xs text-[#86868b] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">Pending</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7] animate-fade-in-up">
      {/* Executive Minimal Header */}
      <section className="mb-16">
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-1">
          Waste2Worth
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold text-white tracking-tight mb-10">
          Operations
        </h1>

        {/* Today's Key Indicators */}
        <div>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-5">
            Today
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1">
              <div className="text-6xl font-semibold tracking-tight text-white font-sans mb-1">
                {totalReports}
              </div>
              <div className="text-sm text-[#86868b]">Total Reports</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-400/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-6xl font-semibold tracking-tight text-amber-400 font-sans mb-1">
                {activeReports}
              </div>
              <div className="text-sm text-[#86868b]">Active in Pipeline</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-400/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-6xl font-semibold tracking-tight text-emerald-400 font-sans mb-1">
                {completedReports}
              </div>
              <div className="text-sm text-[#86868b]">Cleanups Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections with Progressive Disclosure */}

      {/* 1. Recent Reports Section */}
      <section className="py-12 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Recent Reports
          </h2>
          <Link
            href="/admin/reports"
            className="text-sm text-[#86868b] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>View all</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-[#86868b]">Loading reports...</div>
        ) : recentReports.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#86868b]">No reports recorded.</div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {recentReports.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                href={`/admin/reports?id=${r.id}`}
                className="py-4 flex items-center justify-between group transition-colors px-2 hover:bg-white/[0.02] rounded-xl"
              >
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-sm font-mono font-medium text-white group-hover:text-purple-400 transition-colors">
                      {r.report_code}
                    </span>
                    <span className="text-sm text-[#86868b] capitalize">
                      {r.ai_prediction?.predicted_class || "Waste"} · {((r.ai_prediction?.confidence ?? 0.92) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#86868b] truncate max-w-xs sm:max-w-md mt-1">
                    {r.location.address || `GPS: ${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}`}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(r.status)}
                  <span className="text-sm text-[#86868b] group-hover:text-white transition-colors">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 2. Live Hotspots Gateway */}
      <section className="py-12 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Live Hotspots
            </h2>
            <p className="text-sm text-[#86868b] mt-1 leading-relaxed">
              Interactive Google Maps telemetry with real-time street clusters.
            </p>
          </div>

          <Link
            href="/admin/map"
            className="px-6 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-sm font-medium transition-all active:scale-[0.97]"
          >
            Launch Map
          </Link>
        </div>
      </section>

      {/* 3. AI Classification Stream Distribution */}
      {stats?.waste_distribution && stats.waste_distribution.length > 0 && (
        <section className="py-12 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              AI Classification
            </h2>
            <Link
              href="/admin/analytics"
              className="text-sm text-[#86868b] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Analytics</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.waste_distribution.map((item) => (
              <div
                key={item.category}
                className="apple-card p-5 space-y-1.5"
              >
                <div className="text-xs text-[#86868b] uppercase tracking-wider font-mono">
                  {item.category}
                </div>
                <div className="text-3xl font-semibold text-white font-sans">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
