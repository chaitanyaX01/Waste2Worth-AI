"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, role: userRole, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && userRole) {
      if (userRole === "ADMIN") router.push("/admin/dashboard");
      else if (userRole === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    }
  }, [isAuthenticated, userRole, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: phone ? phone.trim() : undefined,
        role,
        employee_code: employeeCode ? employeeCode.trim() : undefined,
      });
      if (role === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemoCitizen = () => {
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    setName(`Citizen User ${randomSuffix}`);
    setEmail(`user${randomSuffix}@waste2worth.org`);
    setPassword("password123");
    setPhone("+1-555-0123");
    setRole("CITIZEN");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 bg-black text-[#f5f5f7]">
      <div className="w-full max-w-sm mx-auto text-center animate-scale-up">
        <p className="text-[11px] font-semibold tracking-widest text-[#86868b] uppercase mb-2">
          WASTE2WORTH
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
          Create Account
        </h1>
        <p className="text-xs text-[#86868b] mb-6">
          Join the community waste intelligence network
        </p>

        {/* Quick autofill helper for mobile */}
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={fillQuickDemoCitizen}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Autofill New Account Details</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label htmlFor="reg-name" className="text-xs text-[#86868b]">
              Full Name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="reg-email" className="text-xs text-[#86868b]">
              Email Address
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="reg-password" className="text-xs text-[#86868b]">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="reg-phone" className="text-xs text-[#86868b]">
              Phone (Optional)
            </label>
            <input
              id="reg-phone"
              name="tel"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0188"
              className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="reg-role" className="text-xs text-[#86868b]">
              Account Role
            </label>
            <select
              id="reg-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value="CITIZEN">Citizen (Waste Reporter)</option>
              <option value="COLLECTOR">Waste Collector (Field Operations)</option>
            </select>
          </div>

          {role === "COLLECTOR" && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label htmlFor="reg-employee-code" className="text-xs text-[#86868b]">
                Employee Code
              </label>
              <input
                id="reg-employee-code"
                name="employee_code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="COL-101"
                className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5e7] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-xs text-[#86868b]">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
