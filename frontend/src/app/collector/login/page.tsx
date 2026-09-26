"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff } from "lucide-react";

export default function CollectorLoginPage() {
  const router = useRouter();
  const { login, logout, isAuthenticated, role, isLoading } = useAuth();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as collector/admin, auto-navigate
  useEffect(() => {
    if (!isLoading && isAuthenticated && (role === "COLLECTOR" || role === "ADMIN")) {
      router.push("/collector/dashboard");
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
        : null;
      if (storedRole !== "COLLECTOR" && storedRole !== "ADMIN") {
        logout();
        setError("Access Denied: This account is not registered as a Waste Collector.");
        return;
      }
      router.push("/collector/dashboard");
    } catch (err: any) {
      setError(err.message || "Collector login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 bg-black text-[#f5f5f7]">
      <div className="w-full max-w-sm mx-auto text-center animate-scale-up">
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-2">
          COLLECTOR PORTAL
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-2">
          Field Dispatch
        </h1>
        <p className="text-sm text-[#86868b] mb-8">
          Authorized Municipal Workforce
        </p>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label htmlFor="col-email" className="text-xs text-[#86868b]">
              Worker Email
            </label>
            <input
              ref={emailInputRef}
              id="col-email"
              name="email"
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collector@waste2worth.org"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="col-password" className="text-xs text-[#86868b]">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="col-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e5e5e7] disabled:opacity-50 transition-all active:scale-[0.97]"
          >
            {loading ? "Authenticating..." : "Sign In to Dispatch"}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#86868b]">
          Looking for another portal?{" "}
          <Link href="/login" className="text-white hover:underline font-medium">
            Citizen Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
