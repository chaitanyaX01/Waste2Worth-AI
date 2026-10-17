"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Phone, Mail, CheckCircle2, RefreshCw, MessageSquare, ShieldCheck, MessageCircle } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { sendWhatsAppOtp } from "@/lib/api";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithOtp, loginWithFirebaseToken, user, logout, isAuthenticated, role, isLoading } = useAuth();

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");

  // Email form state
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpDeliveryType, setOtpDeliveryType] = useState<"whatsapp" | "firebase">("whatsapp");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Google 2-Step Phone Verification State
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

  // Shared state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer for OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Timer for Google Step OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (googleOtpSent && googleCountdown > 0) {
      timer = setInterval(() => {
        setGoogleCountdown((prev) => prev - 1);
      }, 1000);
    } else if (googleCountdown === 0) {
      setGoogleCanResend(true);
    }
    return () => clearInterval(timer);
  }, [googleOtpSent, googleCountdown]);

  // Setup reCAPTCHA verifier
  const getOrCreateRecaptchaVerifier = () => {
    if (typeof window === "undefined") return null;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try sending OTP again.");
        },
      });
    }
    return window.recaptchaVerifier;
  };

  // Google Sign-In with 2-step phone verification
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
          `Domain Authorization Required: '${domain}' is not added to Firebase Authorized Domains. To enable Google Sign-In, add '${domain}' in Firebase Console (Authentication > Settings > Authorized domains). In the meantime, use the WhatsApp OTP tab below to sign in instantly!`
        );
        return;
      }
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Send WhatsApp OTP for Google Step
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

  // Complete Google verification
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
      });

      if (res.success) {
        const storedRole = localStorage.getItem("w2w_user")
          ? JSON.parse(localStorage.getItem("w2w_user")!).role
          : "CITIZEN";
        if (storedRole === "ADMIN") router.push("/admin/dashboard");
        else if (storedRole === "COLLECTOR") router.push("/collector/dashboard");
        else router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete verification. Please verify your OTP code.");
    } finally {
      setGoogleVerifying(false);
    }
  };

  // Standard Email/Password login
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  // Send Phone / WhatsApp OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    setLoading(true);
    try {
      // 1. Try sending real OTP directly via Twilio Verify backend
      const res = await sendWhatsAppOtp(formattedPhone);
      setOtpDeliveryType("whatsapp");
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
      if (res.message) {
        setOtpMessage(res.message);
      }
      // Keep input empty so user enters the code themselves
      setOtpCode("");
    } catch (waErr: any) {
      console.warn("WhatsApp OTP send warning, checking error:", waErr);
      const isNetworkError =
        waErr.message?.includes("fetch") ||
        waErr.message?.includes("Load failed") ||
        waErr.message?.includes("Failed to fetch");

      if (isNetworkError) {
        setError("Connecting to backend server on port 8000. Please wait 2 seconds and click Send again.");
        setLoading(false);
        return;
      }

      // If Twilio returned a specific instruction (e.g. sandbox join or verified recipient), show it directly
      if (
        waErr.message?.includes("Twilio") ||
        waErr.message?.includes("sandbox") ||
        waErr.message?.includes("verified recipient")
      ) {
        setError(waErr.message);
        setLoading(false);
        return;
      }

      // 2. Fallback to Firebase Phone Auth
      try {
        const verifier = getOrCreateRecaptchaVerifier();
        if (!verifier) throw new Error("Could not initialize reCAPTCHA verifier.");

        const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, verifier);
        window.confirmationResult = confirmation;
        setOtpDeliveryType("firebase");
        setOtpSent(true);
        setCountdown(60);
        setCanResend(false);
      } catch (err: any) {
        console.error("Firebase phone OTP send error:", err);
        if (err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain")) {
          const domain = typeof window !== "undefined" ? window.location.hostname : "this domain";
          setError(`Domain '${domain}' is not authorized in Firebase yet. Add '${domain}' in Firebase Console → Authentication → Settings → Authorized domains.`);
        } else {
          setError(waErr.message || err.message || "Failed to send OTP verification code.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      if (otpDeliveryType === "whatsapp") {
        await loginWithOtp(phone, cleanCode);
      } else {
        if (!window.confirmationResult) {
          setError("OTP session expired. Please request a new verification code.");
          setOtpSent(false);
          setLoading(false);
          return;
        }
        const cred = await window.confirmationResult.confirm(cleanCode);
        const idToken = await cred.user.getIdToken();
        const cleanDigits = phone.replace(/\D/g, "");

        await loginWithFirebaseToken({
          id_token: idToken,
          phone: cleanDigits.slice(-10),
          name: cred.user.displayName || `Citizen ${cleanDigits.slice(-4)}`,
          role: "CITIZEN",
        });
      }

      const storedRole = localStorage.getItem("w2w_user")
        ? JSON.parse(localStorage.getItem("w2w_user")!).role
        : "CITIZEN";
      if (storedRole === "ADMIN") router.push("/admin/dashboard");
      else if (storedRole === "COLLECTOR") router.push("/collector/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 bg-black text-[#f5f5f7] overflow-hidden">
      {/* Ambient Aurora Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[130px] pointer-events-none animate-aurora-mesh" />

      <div className="relative z-10 w-full max-w-sm mx-auto text-center animate-scale-up">
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

        {/* Optional Active Session Pill - Keeps Sign-in Options Visible */}
        {isAuthenticated && user && (
          <div className="mb-6 p-3 rounded-2xl bg-[#141416] border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in shadow-lg shadow-emerald-500/5">
            <div className="text-left">
              <span className="text-emerald-400 font-semibold text-[11px] block">Currently Signed In</span>
              <span className="text-white font-medium text-xs truncate max-w-[150px] block">{user.name} ({role})</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (role === "ADMIN") router.push("/admin/dashboard");
                  else if (role === "COLLECTOR") router.push("/collector/dashboard");
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

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-left animate-in fade-in">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: GOOGLE MOBILE PHONE & OTP VERIFICATION SECTION         */}
        {/* ------------------------------------------------------------- */}
        {isGoogleStep && googleUserData ? (
          <div className="p-5 rounded-3xl bg-[#141416]/90 backdrop-blur-xl border border-emerald-500/30 text-left space-y-4 animate-in fade-in zoom-in-95 duration-300 shadow-2xl shadow-emerald-500/10">
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

            {/* Accountability & Verification Purpose Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Why Mobile Verification is Compulsory</span>
              </div>
              <ul className="text-[11px] text-[#86868b] space-y-1.5 pl-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong className="text-white">Spot Coordination:</strong> Allows field collectors and municipal admins to locate waste spots instantly and contact you for directions.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong className="text-white">Zero Fake Reports:</strong> Prevents spam or fake reports. Strict action is taken against fraudulent submissions.</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-3.5 pt-1">
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
                  ? "Verifying & Signing In..."
                  : !googleOtpSent
                  ? "Send WhatsApp OTP to Continue"
                  : "Complete Sign In"}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-4 px-4 mb-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {/* Authentic Google Multi-Color G Icon */}
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
              <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.1]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-3 text-[#86868b] tracking-wider font-semibold text-[11px]">
                  or choose login method
                </span>
              </div>
            </div>

            {/* Auth Method Switcher Tabs */}
            <div className="flex rounded-2xl bg-[#141416] p-1.5 mb-5 border border-white/[0.1] gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("phone");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  authMethod === "phone"
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
                  setAuthMethod("email");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  authMethod === "email"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>✉️ Email / Password</span>
              </button>
            </div>

            {/* 1. EMAIL FORM */}
            {authMethod === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs text-[#86868b]">
                    Email Address
                  </label>
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
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      id="login-password"
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
                  className="w-full py-4 mt-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e5e5e7] disabled:opacity-50 transition-all active:scale-[0.97] shadow-lg shadow-white/10"
                >
                  {loading ? "Signing In..." : "Sign In with Email"}
                </button>
              </form>
            )}

            {/* 2. PHONE / WHATSAPP OTP FORM */}
            {authMethod === "phone" && (
              <div className="space-y-4 text-left">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="phone-number" className="text-xs text-[#86868b]">
                          Mobile Phone Number
                        </label>
                        <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          WhatsApp OTP
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-3.5 rounded-2xl bg-[#141416] border border-white/[0.1] text-sm text-[#86868b] font-mono flex items-center justify-center">
                          +91
                        </div>
                        <input
                          id="phone-number"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="9359380149"
                          className="flex-1 px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white placeholder-[#86868b]/50 focus:outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-[#86868b]">
                        A 6-digit real OTP verification code will be sent to your WhatsApp.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || phone.replace(/\D/g, "").length !== 10}
                      className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? "Sending WhatsApp Code..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-white">
                          {otpMessage || `OTP sent for: +91 ${phone}`}
                        </p>
                        <p className="text-[11px] text-emerald-300/80">
                          Check your WhatsApp for the 6-digit verification code.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="otp-code" className="text-xs text-[#86868b]">
                        6-Digit Verification Code
                      </label>
                      <input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-center text-xl tracking-[0.4em] font-mono text-white placeholder-[#86868b]/30 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#86868b] px-1">
                      <span>
                        {countdown > 0 ? (
                          `Resend available in ${countdown}s`
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
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

                    <button
                      type="submit"
                      disabled={loading || otpCode.trim().length !== 6}
                      className="w-full py-4 rounded-full bg-white hover:bg-[#e5e5e7] text-black font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.97] shadow-lg shadow-white/10"
                    >
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>
                  </form>
                )}

                {/* Invisible Firebase reCAPTCHA container */}
                <div id="recaptcha-container"></div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-sm text-[#86868b]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white hover:underline font-medium">
            Create account
          </Link>
        </div>
      </div>

    </div>
  );
}

