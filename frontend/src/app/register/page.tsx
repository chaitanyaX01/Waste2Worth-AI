"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, role: userRole, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    // Strictly validate 10-digit mobile number
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Mobile phone number is compulsory and must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: cleanPhone,
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

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label htmlFor="reg-name" className="text-xs text-[#86868b]">
              Full Name <span className="text-rose-400">*</span>
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
              Email Address <span className="text-rose-400">*</span>
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
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-4 pr-11 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="reg-phone" className="text-xs text-[#86868b]">
                Mobile Phone Number <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[11px] font-mono transition-colors ${
                  phone.length === 10
                    ? "text-emerald-400 font-semibold"
                    : "text-[#86868b]"
                }`}
              >
                {phone.length === 10 ? "✓ 10 Digits" : `${phone.length}/10 Digits (Required)`}
              </span>
            </div>
            <input
              id="reg-phone"
              name="tel"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit mobile number"
              className={`w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border text-xs text-white placeholder-[#86868b]/50 focus:outline-none tracking-wider font-mono transition-colors ${
                phone.length > 0 && phone.length < 10
                  ? "border-amber-500/50 focus:border-amber-400"
                  : phone.length === 10
                  ? "border-emerald-500/50 focus:border-emerald-400"
                  : "border-white/[0.1] focus:border-white/30"
              }`}
            />
            <p className="text-[10px] text-[#86868b]">
              Compulsory 10-digit mobile number required to complete registration.
            </p>
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
            disabled={loading || phone.length !== 10}
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
