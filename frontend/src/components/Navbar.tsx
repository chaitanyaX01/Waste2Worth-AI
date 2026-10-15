"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { checkBackendHealth } from "@/lib/api";
import BackendConfigModal from "./BackendConfigModal";
import {
  Camera,
  LogOut,
  User,
  Activity,
} from "lucide-react";

export default function Navbar() {
  const { user, role, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth()
      .then((res) => setBackendOnline(res.ok))
      .catch(() => setBackendOnline(false));
  }, [pathname]);

  const getLinks = () => {
    if (role === "ADMIN") {
      return [
        { label: "Operations", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/reports" },
        { label: "Hotspot Map", href: "/admin/map" },
        { label: "Tasks", href: "/admin/tasks" },
        { label: "Analytics", href: "/admin/analytics" },
      ];
    }
    if (role === "COLLECTOR") {
      return [
        { label: "Active Task", href: "/collector/dashboard" },
        { label: "Queue", href: "/collector/tasks" },
        { label: "Route Map", href: "/collector/map" },
        { label: "Profile", href: "/collector/profile" },
      ];
    }
    return [
      { label: "Overview", href: "/" },
      { label: "Impact", href: "/dashboard" },
      { label: "Scan Waste", href: "/scanner", isSpecial: true },
      { label: "Report", href: "/report" },
      { label: "My Reports", href: "/my-reports" },
      { label: "Rewards", href: "/rewards" },
    ];
  };

  const links = getLinks();

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Apple Style Logo with Backend Status Indicator */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-semibold tracking-tight text-white font-sans">
                  WASTE<span className="text-emerald-400">2</span>WORTH
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#86868b] uppercase">
                  AI
                </span>
              </div>
            </Link>

            {/* Quick Backend Connectivity Indicator / Config Button */}
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-[#86868b] hover:text-white transition-all ml-1.5 active:scale-95"
              title="Click to view or set live backend server connection URL"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline === true
                    ? "bg-emerald-400"
                    : backendOnline === false
                    ? "bg-rose-400"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className="hidden sm:inline">
                {backendOnline === true
                  ? "AI Online"
                  : backendOnline === false
                  ? "AI Offline"
                  : "Checking AI..."}
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              if (link.isSpecial) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                      isActive
                        ? "bg-emerald-500 text-black font-semibold shadow-sm"
                        : "bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/[0.08]"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-all duration-150 ${
                    isActive
                      ? "text-white font-medium bg-white/[0.1]"
                      : "text-[#86868b] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Eco Points Pill for Citizens */}
            {role === "CITIZEN" && user && (
              <Link
                href="/rewards"
                className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.09] hover:border-emerald-500/40 text-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white font-mono text-xs sm:text-sm">
                  {user.points_balance}
                </span>
                <span className="text-[#86868b] text-xs">pts</span>
              </Link>
            )}

            {/* Authenticated User Status Badge */}
            {isAuthenticated && role && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    role === "ADMIN"
                      ? "bg-purple-400"
                      : role === "COLLECTOR"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="font-medium text-white tracking-tight">
                  {role === "ADMIN" ? "Admin" : role === "COLLECTOR" ? "Collector" : "Citizen"}
                </span>
              </div>
            )}

            {/* User Profile / Logout or Sign In / Register */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href={role === "COLLECTOR" ? "/collector/profile" : "/profile"}
                  className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors"
                  title={user?.name || "Profile"}
                >
                  <User className="w-4 h-4 text-[#86868b]" />
                </Link>
                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-rose-500/20 text-[#86868b] hover:text-rose-400 flex items-center justify-center transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1 rounded-full text-xs font-medium text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#e5e5e7] transition-all active:scale-[0.97]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <BackendConfigModal
        isOpen={configOpen}
        onClose={() => {
          setConfigOpen(false);
          checkBackendHealth().then((res) => setBackendOnline(res.ok));
        }}
      />
    </header>
  );
}
