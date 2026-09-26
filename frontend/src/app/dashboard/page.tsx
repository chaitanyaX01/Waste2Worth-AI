"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCitizenReports } from "@/lib/api";
import { WasteReport } from "@/lib/types";
import { Camera, ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("w2w_token");
    if (!isAuthenticated && !hasToken) {
      router.push("/login");
    } else if (isAuthenticated || hasToken) {
      getCitizenReports()
        .then(setReports)
        .catch((e) => console.log("Failed to load citizen reports", e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, isLoading]);

  const completedCount = reports.filter((r) => r.status === "COMPLETED").length;
  const activeCount = reports.filter((r) => r.status !== "COMPLETED" && r.status !== "REJECTED").length;
  const divertedKg = (completedCount * 1.55 + 0.4).toFixed(1);
  const points = user?.points_balance ?? 0;

  const firstName = user?.name ? user.name.split(" ")[0] : "Citizen";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Completed</span>;
      case "IN_PROGRESS":
      case "ASSIGNED":
        return <span className="text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">In Collection</span>;
      case "VERIFIED":
        return <span className="text-xs text-teal-400 font-medium px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">AI Verified</span>;
      default:
        return <span className="text-xs text-[#86868b] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">Submitted</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7] animate-fade-in-up">
      {/* Clean Apple Greeting */}
      <section className="mb-16">
        <h1 className="text-5xl sm:text-6xl font-semibold text-white tracking-tight mb-3">
          Good morning, {firstName}.
        </h1>
        <p className="text-2xl sm:text-3xl text-[#86868b] font-normal mb-8">
          Ready to make an impact?
        </p>

        <Link
          href="/scanner"
          className="inline-flex items-center gap-3 px-9 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-base transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/25 animate-pulse-glow"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          <span>Scan Waste</span>
        </Link>
      </section>

      {/* Your Impact Minimal Section */}
      <section className="py-14 border-t border-white/[0.06] mb-12">
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-8">
          Your Impact
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="text-6xl font-semibold tracking-tight text-emerald-400 font-sans mb-1">
              {points}
            </div>
            <div className="text-base text-white font-medium">Eco Points</div>
            <p className="text-xs sm:text-sm text-[#86868b] mt-1.5 leading-relaxed">
              Redeemable for community rewards &amp; transit vouchers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1">
            <div className="text-6xl font-semibold tracking-tight text-white font-sans mb-1">
              {completedCount}
            </div>
            <div className="text-base text-white font-medium">Reports Completed</div>
            <p className="text-xs sm:text-sm text-[#86868b] mt-1.5 leading-relaxed">
              Cleaned up and verified by municipal dispatch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1">
            <div className="text-6xl font-semibold tracking-tight text-white/90 font-sans mb-1">
              {divertedKg} <span className="text-2xl font-normal text-[#86868b]">kg</span>
            </div>
            <div className="text-base text-white font-medium">Diverted from Landfill</div>
            <p className="text-xs sm:text-sm text-[#86868b] mt-1.5 leading-relaxed">
              Estimated recyclable &amp; compostable mass redirected.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Activity — Clean Apple Timeline / List */}
      <section className="py-8 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase">
            Recent Activity
          </p>
          <Link
            href="/my-reports"
            className="text-sm text-[#86868b] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-[#86868b]">
            Loading your reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#86868b]">
            No reports yet. Capture your first waste item with the camera scanner!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {reports.slice(0, 5).map((report) => (
              <Link
                key={report.id}
                href={`/my-reports/${report.id}`}
                className="py-4.5 flex items-center justify-between group transition-all duration-200 hover:bg-white/[0.03] px-3 -mx-3 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 animate-pulse" />
                  <div>
                    <div className="text-base font-medium text-white capitalize group-hover:text-emerald-400 transition-colors">
                      {report.ai_prediction?.predicted_class || "Waste"} Waste
                    </div>
                    <div className="text-xs sm:text-sm text-[#86868b] max-w-xs sm:max-w-md truncate mt-0.5">
                      {report.location.address || `GPS: ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(report.status)}
                  <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
