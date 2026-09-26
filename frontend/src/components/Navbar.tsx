"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Camera,
  ChevronDown,
  LogOut,
  User
} from "lucide-react";

export default function Navbar() {
  const { user, role, logout, quickLogin, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (newRole: "CITIZEN" | "COLLECTOR" | "ADMIN") => {
    setRoleDropdownOpen(false);
    if (role === newRole && isAuthenticated) {
      if (newRole === "CITIZEN") router.push("/dashboard");
      else if (newRole === "COLLECTOR") router.push("/collector/dashboard");
      else if (newRole === "ADMIN") router.push("/admin/dashboard");
      return;
    }
    setIsSwitching(true);
    try {
      await quickLogin(newRole);
      if (newRole === "CITIZEN") router.push("/dashboard");
      else if (newRole === "COLLECTOR") router.push("/collector/dashboard");
      else if (newRole === "ADMIN") router.push("/admin/dashboard");
    } catch (e) {
      console.warn("Direct role switch fallback:", e);
      logout();
      if (newRole === "CITIZEN") router.push("/login");
      else if (newRole === "COLLECTOR") router.push("/collector/login");
      else if (newRole === "ADMIN") router.push("/admin/login");
    } finally {
      setIsSwitching(false);
    }
  };

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
          {/* Apple Style Logo */}
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

            {/* Apple Role Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                disabled={isSwitching}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-sm text-white transition-colors"
                aria-label="Switch Role"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSwitching
                      ? "bg-sky-400 animate-ping"
                      : role === "ADMIN"
                      ? "bg-purple-400"
                      : role === "COLLECTOR"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="text-xs sm:text-sm font-medium tracking-tight">
                  {isSwitching ? "Switching..." : role ? (role === "ADMIN" ? "Admin" : role === "COLLECTOR" ? "Collector" : "Citizen") : "Citizen"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#86868b]" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#121214] border border-white/[0.14] shadow-2xl p-2 z-50 animate-scale-up">
                  <div className="text-xs text-[#86868b] px-3 py-1.5 font-medium tracking-tight border-b border-white/[0.06] flex items-center justify-between">
                    <span>Select Portal Role</span>
                    <span className="text-[10px] text-emerald-400 font-normal">1-Tap Switch</span>
                  </div>
                  <button
                    onClick={() => handleRoleSwitch("CITIZEN")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      role === "CITIZEN"
                        ? "bg-white/[0.09] text-white font-medium"
                        : "text-[#86868b] hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>Citizen Portal</span>
                    {role === "CITIZEN" && <span className="text-emerald-400 text-xs font-medium">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch("COLLECTOR")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      role === "COLLECTOR"
                        ? "bg-white/[0.09] text-white font-medium"
                        : "text-[#86868b] hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>Waste Collector</span>
                    {role === "COLLECTOR" && <span className="text-amber-400 text-xs font-medium">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch("ADMIN")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      role === "ADMIN"
                        ? "bg-white/[0.09] text-white font-medium"
                        : "text-[#86868b] hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>Operations Admin</span>
                    {role === "ADMIN" && <span className="text-purple-400 text-xs font-medium">Active</span>}
                  </button>
                  <div className="text-[11px] text-[#86868b] px-3 py-2 border-t border-white/[0.06] mt-1 flex items-center gap-1.5">
                    <span>⚡ Instant role switch (no credentials re-asked)</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Logout */}
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
              <Link
                href="/login"
                className="px-3 py-1 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#e5e5e7] transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
