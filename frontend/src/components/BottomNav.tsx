"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  Camera,
  Layers,
  Award,
  User,
  Truck,
  MapPin,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  // Hide bottom nav on full-screen scanner view on mobile to maximize camera area
  if (pathname === "/scanner") return null;

  if (role === "ADMIN") {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2.5 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/admin/dashboard"
                ? "text-purple-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs tracking-tight">Today</span>
          </Link>

          <Link
            href="/admin/reports"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname.startsWith("/admin/reports")
                ? "text-purple-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs tracking-tight">Reports</span>
          </Link>

          <Link
            href="/admin/map"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/admin/map"
                ? "text-purple-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs tracking-tight">Map</span>
          </Link>

          <Link
            href="/admin/analytics"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/admin/analytics"
                ? "text-purple-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs tracking-tight">Analytics</span>
          </Link>
        </div>
      </div>
    );
  }

  if (role === "COLLECTOR") {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2.5 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            href="/collector/dashboard"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/collector/dashboard"
                ? "text-amber-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <Truck className="w-5 h-5" />
            <span className="text-xs tracking-tight">Active</span>
          </Link>

          <Link
            href="/collector/tasks"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/collector/tasks"
                ? "text-amber-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs tracking-tight">Queue</span>
          </Link>

          <Link
            href="/collector/map"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/collector/map"
                ? "text-amber-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs tracking-tight">Route</span>
          </Link>

          <Link
            href="/collector/profile"
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
              pathname === "/collector/profile"
                ? "text-amber-400 font-semibold"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs tracking-tight">Profile</span>
          </Link>
        </div>
      </div>
    );
  }

  // Default: Citizen Bottom Tab Bar
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2.5 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            pathname === "/"
              ? "text-emerald-400 font-semibold"
              : "text-[#86868b] hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs tracking-tight">Home</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            pathname === "/dashboard"
              ? "text-emerald-400 font-semibold"
              : "text-[#86868b] hover:text-white"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-xs tracking-tight">Impact</span>
        </Link>

        {/* Emphasized Center Scan Button */}
        <Link
          href="/scanner"
          className="flex flex-col items-center -mt-6 group"
          aria-label="Launch AI Waste Scanner"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-all duration-200 animate-pulse-glow">
            <Camera className="w-6 h-6 stroke-[2.3]" />
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-1">Scan</span>
        </Link>

        <Link
          href="/my-reports"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            pathname.startsWith("/my-reports")
              ? "text-emerald-400 font-semibold"
              : "text-[#86868b] hover:text-white"
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-xs tracking-tight">Reports</span>
        </Link>

        <Link
          href="/rewards"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            pathname === "/rewards"
              ? "text-emerald-400 font-semibold"
              : "text-[#86868b] hover:text-white"
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-xs tracking-tight">Rewards</span>
        </Link>
      </div>
    </div>
  );
}
