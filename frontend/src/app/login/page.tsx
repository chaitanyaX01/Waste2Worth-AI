"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Sparkles, CheckCircle2, User, Truck, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, role, isLoading } = useAuth();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoleLoggingIn, setActiveRoleLoggingIn] = useState<string | null>(null);
  const [autofillSuccessMsg, setAutofillSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, automatically navigate to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    }
  }, [isAuthenticated, role, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalEmail = (emailInputRef.current?.value || email).trim();
    const finalPassword = (passwordInputRef.current?.value || password).trim();

    if (!finalEmail || !finalPassword) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      await login(finalEmail, finalPassword);
      const storedRole = localStorage.getItem("w2w_user")
        ? JSON.parse(localStorage.getItem("w2w_user")!).role
        : "CITIZEN";
      if (storedRole === "ADMIN") router.push("/admin/dashboard");
      else if (storedRole === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Tap Autofill & Direct Sign-in
  const handleAutofillDemo = async (demoRole: "CITIZEN" | "COLLECTOR" | "ADMIN", andSignIn: boolean = false) => {
    setError(null);
    let demoEmail = "citizen@waste2worth.org";
    let demoPass = "citizen123";
    let target = "/dashboard";
    let roleLabel = "Citizen (Alex Morgan)";

    if (demoRole === "COLLECTOR") {
      demoEmail = "collector@waste2worth.org";
      demoPass = "collector123";
      target = "/collector/dashboard";
      roleLabel = "Collector (David Rodriguez)";
    } else if (demoRole === "ADMIN") {
      demoEmail = "admin@waste2worth.org";
      demoPass = "admin123";
      target = "/admin/dashboard";
      roleLabel = "Admin (Sarah Jenkins)";
    }

    // Set state
    setEmail(demoEmail);
    setPassword(demoPass);

    // Set native DOM inputs directly
    if (emailInputRef.current) emailInputRef.current.value = demoEmail;
    if (passwordInputRef.current) passwordInputRef.current.value = demoPass;

    setAutofillSuccessMsg(`Autofilled: ${demoEmail}`);

    if (andSignIn) {
      setLoading(true);
      setActiveRoleLoggingIn(demoRole);
      try {
        await login(demoEmail, demoPass);
        router.push(target);
      } catch (err: any) {
        setError(err.message || "Authentication failed. Please verify connection.");
      } finally {
        setLoading(false);
        setActiveRoleLoggingIn(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-20 bg-black text-[#f5f5f7]">
      <div className="w-full max-w-sm mx-auto text-center animate-scale-up">
        {/* Apple ID Style Header */}
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-2">
          WASTE2WORTH
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-2">
          Sign In
        </h1>
        <p className="text-sm text-[#86868b] mb-6">
          Community Waste Intelligence
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-left">
            {error}
          </div>
        )}

        {/* 1-Tap Quick Role Sign-In Cards (Designed for Mobile) */}
        <div className="mb-6 p-4 rounded-3xl bg-[#0e0e12] border border-white/[0.08] text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Tap Demo Sign-In</span>
            </span>
            <span className="text-[10px] text-[#86868b]">Select your role</span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAutofillDemo("CITIZEN", true)}
              disabled={loading}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-emerald-500/15 hover:border-emerald-500/30 border border-white/[0.08] flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="text-left">
                  <div className="text-xs font-medium text-white">Citizen Portal</div>
                  <div className="text-[10px] text-[#86868b]">citizen@waste2worth.org</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">
                {activeRoleLoggingIn === "CITIZEN" ? "Signing in..." : "Enter →"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofillDemo("COLLECTOR", true)}
              disabled={loading}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-amber-500/15 hover:border-amber-500/30 border border-white/[0.08] flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="text-left">
                  <div className="text-xs font-medium text-white">Waste Collector</div>
                  <div className="text-[10px] text-[#86868b]">collector@waste2worth.org</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-amber-400">
                {activeRoleLoggingIn === "COLLECTOR" ? "Signing in..." : "Enter →"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofillDemo("ADMIN", true)}
              disabled={loading}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-purple-500/15 hover:border-purple-500/30 border border-white/[0.08] flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <div className="text-left">
                  <div className="text-xs font-medium text-white">Operations Admin</div>
                  <div className="text-[10px] text-[#86868b]">admin@waste2worth.org</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-purple-400">
                {activeRoleLoggingIn === "ADMIN" ? "Signing in..." : "Enter →"}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback pill if autofilled */}
        {autofillSuccessMsg && (
          <div className="mb-4 py-2 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{autofillSuccessMsg}</span>
          </div>
        )}

        {/* Standard Form with Mobile DOM Autofill Attributes */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-email" className="text-xs text-[#86868b]">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofillDemo("CITIZEN", false)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Fill Citizen
                </button>
                <span className="text-[#86868b]/40 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => handleAutofillDemo("COLLECTOR", false)}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Fill Collector
                </button>
              </div>
            </div>
            <input
              ref={emailInputRef}
              id="login-email"
              name="email"
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs text-[#86868b]">
              Password
            </label>
            <input
              ref={passwordInputRef}
              id="login-password"
              name="password"
              type="password"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e5e5e7] disabled:opacity-50 transition-all active:scale-[0.97] shadow-lg shadow-white/10"
          >
            {loading ? "Signing In..." : "Sign In with Credentials"}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#86868b]">
          Don't have an account?{" "}
          <Link href="/register" className="text-white hover:underline font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
