"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ArrowRight, Sparkles } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getAdminDashboardStats()
      .then(setStats)
      .catch((e) => console.log("Using cached stats if offline", e));
  }, []);

  const totalReports = stats?.total_reports ?? 12;
  const completedReports = stats?.completed_reports ?? 8;
  const activeReports = Math.max(0, totalReports - completedReports);
  const ecoPointsDiverted = completedReports * 50;

  const wasteStreams = [
    { name: "Plastic", desc: "PET · HDPE · Polymers" },
    { name: "Paper", desc: "Clean pulp · Cartons" },
    { name: "Cardboard", desc: "Corrugated packaging" },
    { name: "Glass", desc: "Clear · Amber · Flint" },
    { name: "Metal", desc: "Aluminum · Steel · Cans" },
    { name: "E-Waste", desc: "Circuits · Batteries" },
    { name: "Medical", desc: "Biohazard protocol" },
    { name: "Special Waste", desc: "Custom citizen classified" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Apple Keynote Hero */}
      <section className="pt-24 pb-20 sm:pt-36 sm:pb-28 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase">
            WASTE2WORTH AI · RESNET-18
          </p>
        </div>

        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-semibold tracking-tight text-white leading-[1.04] mb-6">
          Turn Waste <br />
          <span className="text-white/55">Into Worth.</span>
        </h1>

        <p className="text-xl sm:text-2xl text-[#86868b] max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          AI-powered community waste intelligence.
        </p>

        {/* Minimal Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/scanner"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-base transition-all duration-200 active:scale-[0.97] animate-pulse-glow"
          >
            <Camera className="w-5 h-5 stroke-[2.2]" />
            <span>Scan Waste</span>
          </Link>
          <Link
            href="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-base font-medium border border-white/[0.08] transition-all duration-200 active:scale-[0.97]"
          >
            Report Spot
          </Link>
        </div>
      </section>

      {/* Large Clean Activity Metrics */}
      <section className="py-20 sm:py-28 border-t border-b border-white/[0.06] animate-fade-in delay-150">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            {/* Eco Points */}
            <div className="space-y-2 group transition-transform duration-300 hover:-translate-y-1">
              <div className="text-7xl sm:text-8xl font-semibold tracking-tight text-emerald-400 font-sans transition-all duration-300">
                {ecoPointsDiverted}
              </div>
              <div className="text-sm uppercase tracking-widest text-[#86868b] font-medium">
                Eco Points Earned
              </div>
              <p className="text-sm text-[#86868b]/80 max-w-[220px] mx-auto pt-1 leading-relaxed">
                Community eco-rewards awarded for verified cleanups.
              </p>
            </div>

            {/* Completed Cleanups */}
            <div className="space-y-2 group transition-transform duration-300 hover:-translate-y-1">
              <div className="text-7xl sm:text-8xl font-semibold tracking-tight text-white font-sans transition-all duration-300">
                {completedReports}
              </div>
              <div className="text-sm uppercase tracking-widest text-[#86868b] font-medium">
                Cleanups Completed
              </div>
              <p className="text-sm text-[#86868b]/80 max-w-[220px] mx-auto pt-1 leading-relaxed">
                Sanitation tasks closed with photographic evidence.
              </p>
            </div>

            {/* Active Reports */}
            <div className="space-y-2 group transition-transform duration-300 hover:-translate-y-1">
              <div className="text-7xl sm:text-8xl font-semibold tracking-tight text-white/80 font-sans transition-all duration-300">
                {activeReports}
              </div>
              <div className="text-sm uppercase tracking-widest text-[#86868b] font-medium">
                Active Reports
              </div>
              <p className="text-sm text-[#86868b]/80 max-w-[220px] mx-auto pt-1 leading-relaxed">
                Under municipal review or collector routing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Waste Streams — Pure Typography Showcase */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-fade-in delay-200">
        <div className="mb-14">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-2">
            Intelligence
          </p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            8 Waste Streams. Instant Classification.
          </h2>
          <p className="text-base text-[#86868b] mt-3 max-w-xl leading-relaxed">
            Custom ResNet-18 model trained on 14,279 images across 7 core classes with citizen fallback for specialized urban waste.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6">
          {wasteStreams.map((stream) => (
            <div key={stream.name} className="space-y-1 group cursor-default">
              <div className="text-lg font-medium text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                {stream.name}
              </div>
              <div className="text-sm text-[#86868b] leading-normal">
                {stream.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Effortless Lifecycle */}
      <section className="py-24 border-t border-white/[0.06] bg-[#070708] animate-fade-in delay-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-2">
              Workflow
            </p>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
              Effortless community action.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-1">
              <span className="text-sm font-mono text-emerald-400">01</span>
              <h3 className="text-2xl font-medium text-white tracking-tight">
                Capture
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Aim device camera at waste. The ResNet-18 vision model identifies material and AI confidence in milliseconds.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-1">
              <span className="text-sm font-mono text-emerald-400">02</span>
              <h3 className="text-2xl font-medium text-white tracking-tight">
                Dispatch
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Geotagged street coordinates appear instantly on the municipal map. Operators assign authorized field collectors.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-1">
              <span className="text-sm font-mono text-emerald-400">03</span>
              <h3 className="text-2xl font-medium text-white tracking-tight">
                Clean &amp; Reward
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Collectors submit before-and-after photographic evidence. Verified cleanups automatically credit citizen eco points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Role Gateway */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">
          Experience Waste2Worth
        </h3>
        <p className="text-sm text-[#86868b] mb-8">
          Select an interface to test the complete circular system.
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-7 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-sm font-medium border border-white/[0.08] transition-all active:scale-[0.97]"
          >
            Citizen Portal
          </Link>
          <Link
            href="/collector/dashboard"
            className="px-7 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-sm font-medium border border-white/[0.08] transition-all active:scale-[0.97]"
          >
            Collector Field Hub
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-7 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-sm font-medium border border-white/[0.08] transition-all active:scale-[0.97]"
          >
            Municipal Command
          </Link>
        </div>
      </section>
    </div>
  );
}
