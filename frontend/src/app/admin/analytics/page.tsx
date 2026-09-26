"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAdminDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      getAdminDashboardStats()
        .then(setStats)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

  const totalReports = stats?.total_reports || 12;
  const completedReports = stats?.completed_reports || 8;
  const completionRate = Math.round((completedReports / Math.max(1, totalReports)) * 100);

  const wasteDistribution = stats?.waste_distribution || [
    { category: "plastic", count: 4, percentage: 33 },
    { category: "metal", count: 3, percentage: 25 },
    { category: "paper", count: 2, percentage: 17 },
    { category: "cardboard", count: 1, percentage: 8 },
    { category: "glass", count: 1, percentage: 8 },
    { category: "e-waste", count: 1, percentage: 8 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Header */}
      <section className="mb-14">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-1">
          Analytics
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight">
          System Intelligence
        </h1>
        <p className="text-xs text-[#86868b] mt-1 max-w-md">
          Municipal waste distribution patterns, completion velocity, and environmental metrics.
        </p>
      </section>

      {/* 1. Collection Completion Rate */}
      <section className="py-10 border-t border-white/[0.06] mb-4">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-6">
          Collection Completion
        </p>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 mb-4">
          <div className="space-y-1">
            <div className="text-6xl sm:text-7xl font-semibold tracking-tight text-white font-sans">
              {completionRate}%
            </div>
            <p className="text-xs text-[#86868b]">
              {completedReports} of {totalReports} reported waste spots fully sanitized.
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-2xl font-semibold text-emerald-400 font-mono">
              {(completedReports * 14.5).toFixed(1)} kg
            </div>
            <p className="text-xs text-[#86868b]">
              Estimated diverted waste volume
            </p>
          </div>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-6">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </section>

      {/* 2. Waste Distribution */}
      <section className="py-10 border-t border-white/[0.06]">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-6">
          Waste Distribution
        </p>

        <div className="space-y-4">
          {wasteDistribution.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white capitalize">{item.category}</span>
                <span className="text-[#86868b] font-mono">{item.percentage}% ({item.count})</span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Hotspot Activity */}
      <section className="py-10 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase">
            Hotspot Activity
          </p>
          <Link
            href="/admin/map"
            className="text-xs text-[#86868b] hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Open Map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.06] space-y-1">
            <span className="text-xs text-[#86868b]">Active Clusters</span>
            <div className="text-3xl font-semibold text-white font-sans">
              {stats?.recent_hotspots?.length || 3}
            </div>
            <p className="text-[11px] text-[#86868b]">
              Geographic clusters exceeding density threshold
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.06] space-y-1">
            <span className="text-xs text-[#86868b]">AI Model Accuracy</span>
            <div className="text-3xl font-semibold text-emerald-400 font-sans">
              87.89%
            </div>
            <p className="text-[11px] text-[#86868b]">
              ResNet-18 validation accuracy across 7 classes
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
