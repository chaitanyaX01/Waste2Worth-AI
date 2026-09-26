"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRewardsCatalog, getCitizenBadges, redeemReward } from "@/lib/api";
import { RewardItem, BadgeItem, RedeemRewardResult } from "@/lib/types";
import {
  Award,
  Sparkles,
  Copy,
  Check,
  Coffee,
  TreePine,
  Bus,
  ShoppingBag,
  Zap,
  X,
  ArrowRight
} from "lucide-react";

export default function RewardsPage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshProfile, updatePointsBalance } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Redemption result modal
  const [redeemResult, setRedeemResult] = useState<RedeemRewardResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = () => {
    setLoading(true);
    Promise.all([getRewardsCatalog(), getCitizenBadges()])
      .then(([r, b]) => {
        setRewards(r);
        setBadges(b);
      })
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  };

  const handleRedeem = async (reward: RewardItem) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user || user.points_balance < reward.points_required) {
      alert(`Insufficient Eco Points. You have ${user?.points_balance || 0} pts, but need ${reward.points_required} pts.`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      const result = await redeemReward(reward.id);
      setRedeemResult(result);
      updatePointsBalance(result.remaining_balance);
      await refreshProfile();
    } catch (err: any) {
      alert("Redemption failed: " + (err.message || "Please try again later."));
    } finally {
      setRedeemingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRewardIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("coffee")) return Coffee;
    if (lower.includes("tree")) return TreePine;
    if (lower.includes("metro") || lower.includes("transit") || lower.includes("bus")) return Bus;
    if (lower.includes("solar") || lower.includes("charge")) return Zap;
    return ShoppingBag;
  };

  const points = user?.points_balance ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7] animate-fade-in-up">
      {/* Balance Minimal Header */}
      <section className="mb-16 flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 border-b border-white/[0.06] pb-10">
        <div>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-1">
            Eco Rewards
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight">
            Turn Points Into Privileges
          </h1>
          <p className="text-sm sm:text-base text-[#86868b] mt-2 max-w-lg leading-relaxed">
            Earned from verified waste reports. Redeemable for transit passes, clean energy, and sustainable local partners.
          </p>
        </div>

        <div className="text-left sm:text-right p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-5xl sm:text-6xl font-semibold text-emerald-400 font-sans tracking-tight">
            {points}
          </div>
          <div className="text-sm text-[#86868b] mt-0.5">Available Balance</div>
        </div>
      </section>

      {/* Rewards Catalog — Apple Card Minimal Grid */}
      <section className="mb-16">
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-8">
          Catalog
        </p>

        {loading ? (
          <div className="py-20 text-center text-sm text-[#86868b]">
            Loading reward catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const Icon = getRewardIcon(reward.name);
              const canAfford = points >= reward.points_required;
              const isRedeeming = redeemingId === reward.id;

              return (
                <div
                  key={reward.id}
                  className="apple-card p-6.5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-emerald-400 transition-transform duration-300 hover:scale-105">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">
                        {reward.name}
                      </h3>
                      <p className="text-sm text-[#86868b] mt-1.5 line-clamp-2 leading-relaxed">
                        {reward.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-5 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-white font-mono">
                        {reward.points_required}
                      </span>
                      <span className="text-xs text-[#86868b] ml-1">pts</span>
                    </div>

                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || isRedeeming}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] ${
                        canAfford
                          ? "bg-white text-black hover:bg-[#e5e5e7] shadow-sm"
                          : "bg-white/[0.06] text-[#86868b] cursor-not-allowed"
                      }`}
                    >
                      {isRedeeming ? "Redeeming..." : canAfford ? "Redeem" : "Locked"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Citizen Badges — Minimal List */}
      {badges.length > 0 && (
        <section className="pt-12 border-t border-white/[0.06]">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-8">
            Achievements
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {badges.map((b) => (
              <div
                key={b.id}
                className="apple-card p-5 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{b.name}</div>
                  <div className="text-xs text-[#86868b]">Unlocked</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Apple Wallet Style Voucher Modal */}
      {redeemResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#121214] border border-white/[0.14] p-7 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setRedeemResult(null)}
              className="absolute top-5 right-5 text-[#86868b] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2 pb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-breathe">
                <Sparkles className="w-7 h-7" />
              </div>
              <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase">
                Voucher Redeemed
              </p>
              <h3 className="text-2xl font-semibold text-white tracking-tight mt-1.5">
                {redeemResult.reward_name}
              </h3>
            </div>

            {/* Voucher Card */}
            <div className="p-5 rounded-2xl bg-black border border-white/[0.1] my-5 text-center">
              <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1.5">
                Digital Voucher Passcode
              </p>
              <div className="font-mono text-2xl font-bold tracking-widest text-emerald-400 py-1.5">
                {redeemResult.voucher_code}
              </div>
              <button
                onClick={() => copyToClipboard(redeemResult.voucher_code)}
                className="mt-2.5 text-sm text-[#86868b] hover:text-white inline-flex items-center gap-2 transition-colors active:scale-[0.97]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to clipboard" : "Copy Voucher Code"}</span>
              </button>
            </div>

            <div className="text-xs sm:text-sm text-[#86868b] text-center space-y-1.5 mb-6 leading-relaxed">
              <p>Present this voucher to the merchant or enter during online checkout.</p>
              <p>Remaining Balance: <strong className="text-white font-mono text-sm">{redeemResult.remaining_balance} pts</strong></p>
            </div>

            <button
              onClick={() => setRedeemResult(null)}
              className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e5e5e7] transition-all active:scale-[0.97]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
