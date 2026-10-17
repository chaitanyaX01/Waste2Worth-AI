"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace("/login");
  }, [isLoading, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[#f5f5f7]">
      <div className="flex flex-col items-center space-y-4 animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase">
          WASTE2WORTH AI
        </p>
        <p className="text-sm text-white/70">Opening secure sign in portal...</p>
      </div>
    </div>
  );
}
