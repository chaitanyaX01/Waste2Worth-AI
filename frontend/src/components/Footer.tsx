import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.06] text-[#86868b] text-[11px] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="space-y-1">
            <span className="text-white font-medium text-xs tracking-tight">
              Waste2Worth AI
            </span>
            <p className="text-[#86868b] max-w-xl text-[11px] leading-relaxed">
              AI-powered community waste intelligence. ResNet-18 computer vision classification, geotagged reporting, verified collection workflows, and eco-rewards.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ResNet-18 · 87.89% Accuracy
            </span>
            <span className="text-white/[0.2]">|</span>
            <span className="text-[#86868b]">PostgreSQL 18 Audited</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[10px]">
          <div>
            Copyright © 2026 Waste2Worth AI. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#86868b]">
            <Link href="/dashboard" className="hover:text-white transition-colors">Citizen</Link>
            <Link href="/collector/dashboard" className="hover:text-white transition-colors">Collector</Link>
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin</Link>
            <Link href="/scanner" className="hover:text-white transition-colors">Camera AI</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
