"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { sendWhatsAppOtp } from "@/lib/api";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  MessageCircle,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithOtp, user, logout, isAuthenticated, role: userRole, isLoading } = useAuth();

  const [regMethod, setRegMethod] = useState<"phone" | "email">("phone");

  // Registration form state (Email/Password + Phone)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [employeeCode, setEmployeeCode] = useState("");

  // OTP Verification state for standard registration
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Google 2-Step Registration State
  const [isGoogleStep, setIsGoogleStep] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<{
    email: string;
    name: string;
    idToken: string;
  } | null>(null);
  const [googlePhone, setGooglePhone] = useState("");
  const [googleOtpCode, setGoogleOtpCode] = useState("");
  const [googleOtpSent, setGoogleOtpSent] = useState(false);
  const [googleOtpMessage, setGoogleOtpMessage] = useState<string | null>(null);
  const [googleCountdown, setGoogleCountdown] = useState(60);
  const [googleCanResend, setGoogleCanResend] = useState(false);
  const [googleSendingOtp, setGoogleSendingOtp] = useState(false);
  const [googleVerifying, setGoogleVerifying] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer for standard OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Timer for Google step OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (googleOtpSent && googleCountdown > 0) {
      timer = setInterval(() => setGoogleCountdown((prev) => prev - 1), 1000);
    } else if (googleCountdown === 0) {
      setGoogleCanResend(true);
    }
    return () => clearInterval(timer);
  }, [googleOtpSent, googleCountdown]);

  // Initiate Google Sign-In with 2-step phone verification
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();

      if (res.success) {
        const storedRole = localStorage.getItem("w2w_user")
          ? JSON.parse(localStorage.getItem("w2w_user")!).role
          : "CITIZEN";
        if (storedRole === "ADMIN") router.push("/admin/dashboard");
        else if (storedRole === "COLLECTOR") router.push("/collector/dashboard");
        else router.push("/dashboard");
        return;
      }

      if (res.requiresPhoneVerification && res.googleUser) {
        // Transition directly to Step 2: Mobile Phone Verification
        setGoogleUserData(res.googleUser);
        setIsGoogleStep(true);
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        return;
      }
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain")) {
        const domain = typeof window !== "undefined" ? window.location.hostname : "this domain";
        setError(
          `Domain Authorization Required: '${domain}' is not added to Firebase Authorized Domains. To enable Google Sign-In, add '${domain}' in Firebase Console (Authentication > Settings > Authorized domains). In the meantime, use the WhatsApp OTP tab below to register instantly!`
        );
        return;
      }
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Dispatch OTP for Google phone verification
  const handleSendGoogleOtp = async () => {
    setError(null);
    const cleanPhone = googlePhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setGoogleSendingOtp(true);
    try {
      const formatted = `+91${cleanPhone}`;
      const res = await sendWhatsAppOtp(formatted);
      setGoogleOtpSent(true);
      setGoogleCountdown(60);
      setGoogleCanResend(false);
      setGoogleOtpMessage(res.message);
      // Keep input empty so user enters the code themselves
      setGoogleOtpCode("");
    } catch (err: any) {
      setError(err.message || "Failed to send WhatsApp OTP. Please ensure your number joined the sandbox.");
    } finally {
      setGoogleSendingOtp(false);
    }
  };

  // Complete Google Registration with verified OTP
  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = googlePhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Mobile phone number is compulsory and must be exactly 10 digits.");
      return;
    }

    if (!googleOtpCode || googleOtpCode.trim().length < 4) {
      setError("Please enter the 6-digit WhatsApp verification code.");
      return;
    }

    if (!googleUserData) {
      setError("Google session expired. Please sign in with Google again.");
      setIsGoogleStep(false);
      return;
    }

    setGoogleVerifying(true);
    try {
      const res = await loginWithGoogle({
        idToken: googleUserData.idToken,
        customEmail: googleUserData.email,
        customName: googleUserData.name,
        phone: cleanPhone,
        otp_code: googleOtpCode.trim(),
        role: role,
      });

      if (res.success) {
        const storedRole = localStorage.getItem("w2w_user")
          ? JSON.parse(localStorage.getItem("w2w_user")!).role
          : role;
        if (storedRole === "ADMIN") router.push("/admin/dashboard");
        else if (storedRole === "COLLECTOR" || role === "COLLECTOR") router.push("/collector/dashboard");
        else router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete Google registration. Please verify your OTP code.");
    } finally {
      setGoogleVerifying(false);
    }
  };

  // Dispatch OTP for standard registration
  const handleSendOtp = async () => {
    setError(null);
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number before requesting an OTP code.");
      return;
    }

    setSendingOtp(true);
    try {
      const formatted = `+91${cleanPhone}`;
      const res = await sendWhatsAppOtp(formatted);
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
      setOtpMessage(res.message);
      // Keep input empty so user enters the code themselves
      setOtpCode("");
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      setError(err.message || "Failed to send WhatsApp OTP. Please verify your mobile number.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit standard registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Mobile phone number is compulsory and must be exactly 10 digits.");
      return;
    }

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the 6-digit verification code sent to your mobile phone.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: cleanPhone,
        otp_code: otpCode.trim(),
        role,
        employee_code: employeeCode ? employeeCode.trim() : undefined,
      });
      if (role === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Submit quick OTP-only registration
  const handleQuickOtpRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit WhatsApp verification code.");
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(cleanPhone, otpCode.trim(), name.trim(), role);
      if (role === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 bg-black text-[#f5f5f7] overflow-hidden">
      {/* Ambient Aurora Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[130px] pointer-events-none animate-aurora-mesh" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-auto text-center animate-scale-up">
        <p className="text-[11px] font-semibold tracking-widest text-[#86868b] uppercase mb-2">
          WASTE2WORTH
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
          Create Account
        </h1>
        <p className="text-xs text-[#86868b] mb-4">
          Verified community waste intelligence network
        </p>

        {/* Optional Active Session Pill - Keeps Register Options Visible */}
        {isAuthenticated && user && (
          <div className="mb-6 p-3 rounded-2xl bg-[#141416] border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in shadow-lg shadow-emerald-500/5">
            <div className="text-left">
              <span className="text-emerald-400 font-semibold text-[11px] block">Currently Signed In</span>
              <span className="text-white font-medium text-xs truncate max-w-[150px] block">{user.name} ({userRole})</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (userRole === "ADMIN") router.push("/admin/dashboard");
                  else if (userRole === "COLLECTOR") router.push("/collector/dashboard");
                  else router.push("/dashboard");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-semibold"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 text-[#86868b] hover:text-white text-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Accountability & Verification Purpose Notice */}
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 text-left space-y-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Why Mobile Verification is Compulsory</span>
          </div>
          <ul className="text-[11px] text-[#86868b] space-y-1.5 pl-1 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong className="text-white">Spot Coordination:</strong> Field collectors and admins can easily locate reported spots and call/WhatsApp you directly for quick access.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong className="text-white">Zero Fake Reports:</strong> Verified phone numbers hold everyone accountable. Strict action is taken against fake reports, ensuring real community impact.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left animate-in fade-in">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: GOOGLE MOBILE PHONE & OTP VERIFICATION SECTION         */}
        {/* ------------------------------------------------------------- */}
        {isGoogleStep && googleUserData ? (
          <div className="p-5 rounded-3xl bg-[#141416] border border-emerald-500/30 text-left space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Google Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white truncate max-w-[190px]">
                    {googleUserData.name}
                  </p>
                  <p className="text-[11px] text-[#86868b] truncate max-w-[190px]">
                    {googleUserData.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGoogleStep(false);
                  setGoogleUserData(null);
                  setGoogleOtpSent(false);
                  setGoogleOtpCode("");
                }}
                className="text-[11px] text-[#86868b] hover:text-white underline"
              >
                Change
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Step 2 of 2: Mobile Phone Verification
              </span>
              <p className="text-xs text-[#86868b]">
                Waste2Worth requires a verified mobile number for waste report coordination & community rewards.
              </p>
            </div>

            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-3.5 pt-1">
              {/* Role Selection for Google Account */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs text-[#86868b] flex items-center justify-between">
                  <span>Select Account Role <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-emerald-400 font-medium">Choose Persona</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("CITIZEN")}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      role === "CITIZEN"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10"
                        : "bg-[#0c0c0e] border-white/[0.08] text-[#86868b] hover:text-white"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-white">🌱 Citizen</span>
                    <span className="block text-[10px] text-[#86868b] mt-0.5">Report waste & earn points</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("COLLECTOR")}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      role === "COLLECTOR"
                        ? "bg-teal-500/15 border-teal-500 text-teal-300 font-bold shadow-md shadow-teal-500/10"
                        : "bg-[#0c0c0e] border-white/[0.08] text-[#86868b] hover:text-white"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-white">🚛 Waste Collector</span>
                    <span className="block text-[10px] text-[#86868b] mt-0.5">Assigned cleanups by Admin</span>
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#86868b]">
                  {role === "COLLECTOR" ? (
                    <span className="text-teal-300">
                      🚛 <strong>Field Collector:</strong> You will be listed in the Admin Portal for cleanup dispatch and map route tasks.
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      🌱 <strong>Eco Citizen:</strong> Submit waste reports with GPS coordinates, earn rewards, and redeem vouchers.
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Phone Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#86868b] flex items-center justify-between">
                  <span>Mobile Phone Number <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <MessageCircle className="w-2.5 h-2.5" /> WhatsApp OTP
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-[#86868b] font-mono flex items-center justify-center">
                    +91
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    disabled={googleOtpSent}
                    value={googlePhone}
                    onChange={(e) => setGooglePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/40 font-mono tracking-wider focus:outline-none focus:border-emerald-400"
                  />
                  {!googleOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendGoogleOtp}
                      disabled={googleSendingOtp || googlePhone.length !== 10}
                      className="px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium whitespace-nowrap transition-all disabled:opacity-40"
                    >
                      {googleSendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP Input box once sent */}
              {googleOtpSent && (
                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">
                        {googleOtpMessage || `WhatsApp OTP sent to +91 ${googlePhone}`}
                      </p>
                      <p className="text-[11px] text-emerald-300/80">
                        Check your WhatsApp for the 6-digit code.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      value={googleOtpCode}
                      onChange={(e) => setGoogleOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-4 py-2 rounded-xl bg-[#0c0c0e] border border-white/[0.15] text-center text-lg tracking-[0.3em] font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                    <span>
                      {googleCountdown > 0 ? (
                        `Resend in ${googleCountdown}s`
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendGoogleOtp}
                          disabled={googleSendingOtp}
                          className="text-emerald-400 hover:underline font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend OTP
                        </button>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleOtpSent(false);
                        setGoogleOtpCode("");
                      }}
                      className="text-[#86868b] hover:text-white underline"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  googleVerifying ||
                  googleSendingOtp ||
                  googlePhone.length !== 10 ||
                  (googleOtpSent && googleOtpCode.length !== 6)
                }
                className="w-full py-3.5 mt-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                {googleVerifying
                  ? "Verifying & Linking Account..."
                  : !googleOtpSent
                  ? "Send WhatsApp OTP to Continue"
                  : "Complete Registration"}
              </button>
            </form>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* STANDARD REGISTRATION VIEW                                    */
          /* ------------------------------------------------------------- */
          <>
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading || sendingOtp}
              className="w-full py-4 px-4 mb-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? "Connecting with Google..." : "Sign up with Google"}</span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.1]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-3 text-[#86868b] tracking-wider font-semibold text-[11px]">
                  or choose registration method
                </span>
              </div>
            </div>

            {/* Registration Method Switcher Tabs */}
            <div className="flex rounded-2xl bg-[#141416] p-1.5 mb-5 border border-white/[0.1] gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setRegMethod("phone");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  regMethod === "phone"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>📱 WhatsApp OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegMethod("email");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  regMethod === "email"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>✉️ Email & Password</span>
              </button>
            </div>

            {/* 1. FAST WHATSAPP OTP REGISTRATION */}
            {regMethod === "phone" ? (
              <form onSubmit={handleQuickOtpRegister} className="space-y-4 text-left">
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="quick-reg-name" className="text-xs text-[#86868b]">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="quick-reg-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#86868b]">Select Your Account Role <span className="text-rose-400">*</span></label>
                    <span className="text-[10px] text-emerald-400 font-medium">Select Persona</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("CITIZEN")}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        role === "CITIZEN"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10"
                          : "bg-[#0c0c0e] border-white/[0.08] text-[#86868b] hover:text-white"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-white">🌱 Citizen</span>
                      <span className="block text-[10px] text-[#86868b] mt-0.5">Report waste & earn points</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("COLLECTOR")}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        role === "COLLECTOR"
                          ? "bg-teal-500/15 border-teal-500 text-teal-300 font-bold shadow-md shadow-teal-500/10"
                          : "bg-[#0c0c0e] border-white/[0.08] text-[#86868b] hover:text-white"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-white">🚛 Waste Collector</span>
                      <span className="block text-[10px] text-[#86868b] mt-0.5">Field operator & dispatch</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#86868b]">
                    {role === "COLLECTOR" ? (
                      <span className="text-teal-300">
                        🚛 <strong>Field Collector:</strong> You will be listed in the Admin Portal assign dropdown list for task dispatch and route navigation.
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        🌱 <strong>Community Citizen:</strong> Submit geo-tagged reports, track cleanup progress in real-time, and earn redeemable points.
                      </span>
                    )}
                  </div>
                </div>

                {/* Collector employee code if collector */}
                {role === "COLLECTOR" && (
                  <div className="space-y-1">
                    <label htmlFor="quick-reg-employee" className="text-xs text-[#86868b]">
                      Employee / Officer Code
                    </label>
                    <input
                      id="quick-reg-employee"
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="EMP-10492"
                      className="w-full px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                {/* Mobile Phone Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="quick-reg-phone" className="text-xs text-[#86868b]">
                      Mobile Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <MessageCircle className="w-2.5 h-2.5" /> WhatsApp OTP
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3.5 py-3 rounded-2xl bg-[#141416] border border-white/[0.1] text-xs text-[#86868b] font-mono flex items-center justify-center">
                      +91
                    </div>
                    <input
                      id="quick-reg-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      disabled={otpSent}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-xs text-white placeholder-[#86868b]/50 font-mono tracking-wider focus:outline-none focus:border-emerald-400"
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || phone.replace(/\D/g, "").length !== 10}
                        className="px-4 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold whitespace-nowrap transition-all disabled:opacity-40"
                      >
                        {sendingOtp ? "Sending..." : "Send OTP"}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#86868b]">
                    A 6-digit real OTP code will be sent to your WhatsApp.
                  </p>
                </div>

                {/* OTP Verification Box */}
                {otpSent && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold text-white">
                          Verification Code Dispatched
                        </p>
                        <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                          {otpMessage || `WhatsApp OTP sent to +91 ${phone}`}
                        </p>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-[10px] text-[#86868b] space-y-1.5">
                          <p className="text-emerald-400 font-medium">To receive on your WhatsApp (Twilio Trial):</p>
                          <p>Send <strong className="text-white">join twilio-trial</strong> to <strong className="text-white">+1 737 250 8034</strong> on WhatsApp.</p>
                          <div className="pt-1 flex items-center justify-between border-t border-white/5">
                            <span className="text-[#86868b]">Testing without WhatsApp?</span>
                            <button
                              type="button"
                              onClick={() => setOtpCode("123456")}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 transition-all font-semibold"
                            >
                              Insert 123456
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="quick-otp-code" className="text-[11px] text-[#86868b] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Enter 6-Digit OTP Code
                      </label>
                      <input
                        id="quick-otp-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.15] text-center text-lg tracking-[0.3em] font-mono text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <span>
                        {countdown > 0 ? (
                          `Resend in ${countdown}s`
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="text-emerald-400 hover:underline font-medium flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Resend OTP
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        className="text-[#86868b] hover:text-white underline text-[11px]"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || sendingOtp || phone.replace(/\D/g, "").length !== 10 || (otpSent && otpCode.length !== 6)}
                  className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                >
                  {loading
                    ? "Creating Account..."
                    : !otpSent
                    ? "Send WhatsApp OTP to Register"
                    : "Verify & Complete Registration"}
                </button>
              </form>
            ) : (
              /* 2. FULL EMAIL / PASSWORD FORM */
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

                {/* Mobile Phone Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reg-phone" className="text-xs text-[#86868b]">
                      Mobile Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <MessageCircle className="w-2.5 h-2.5" /> WhatsApp OTP
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="px-3 py-3 rounded-2xl bg-[#141416] border border-white/[0.1] text-xs text-[#86868b] font-mono flex items-center justify-center">
                      +91
                    </div>
                    <input
                      id="reg-phone"
                      name="tel"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      required
                      disabled={otpSent}
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className={`flex-1 px-4 py-3 rounded-2xl bg-[#0c0c0e] border text-xs text-white placeholder-[#86868b]/50 focus:outline-none tracking-wider font-mono transition-colors ${
                        phone.length === 10
                          ? "border-emerald-500/50 focus:border-emerald-400"
                          : "border-white/[0.1] focus:border-white/30"
                      } ${otpSent ? "opacity-70 cursor-not-allowed" : ""}`}
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        id="btn-send-reg-otp"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || phone.length !== 10}
                        className="px-3.5 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium whitespace-nowrap transition-all disabled:opacity-40"
                      >
                        {sendingOtp ? "Sending..." : "Send OTP"}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#86868b]">
                    A 6-digit real OTP code will be sent to your WhatsApp.
                  </p>
                </div>

                {/* OTP Verification Box */}
                {otpSent && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-medium text-white">
                          {otpMessage || `WhatsApp OTP sent to +91 ${phone}`}
                        </p>
                        <p className="text-[11px] text-emerald-300/80">
                          Check your WhatsApp messages for the 6-digit verification code.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="reg-otp-code" className="text-[11px] text-[#86868b] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Enter 6-Digit OTP Code
                      </label>
                      <input
                        id="reg-otp-code"
                        name="otp_code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.15] text-center text-lg tracking-[0.3em] font-mono text-white placeholder-[#86868b]/30 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-1">
                      <span>
                        {countdown > 0 ? (
                          `Resend in ${countdown}s`
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="text-emerald-400 hover:underline font-medium flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Resend OTP
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        className="text-[#86868b] hover:text-white underline"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>
                )}

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
                  id="btn-register-submit"
                  disabled={loading || sendingOtp || phone.length !== 10 || (otpSent && otpCode.length !== 6)}
                  className="w-full py-4 mt-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                >
                  {loading
                    ? "Verifying & Creating Account..."
                    : !otpSent
                    ? "Verify Mobile & Continue"
                    : "Complete Registration"}
                </button>
              </form>
            )}
          </>
        )}

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
