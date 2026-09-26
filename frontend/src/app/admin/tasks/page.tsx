"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCollectorTasks, verifyTaskCompletion } from "@/lib/api";
import { CollectionTask } from "@/lib/types";
import { Check, MapPin, ChevronLeft } from "lucide-react";

export default function AdminTasksPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      fetchTasks();
    }
  }, [isAuthenticated, role, isLoading]);

  const fetchTasks = () => {
    setLoading(true);
    getCollectorTasks()
      .then(setTasks)
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  };

  const handleVerifyCompletion = async (taskId: string) => {
    setVerifyingId(taskId);
    try {
      await verifyTaskCompletion(taskId, "Admin reviewed photographic proof. Cleanup approved.");
      alert("Cleanup verified. +50 Eco Points awarded to citizen.");
      fetchTasks();
    } catch (e: any) {
      alert(e.message || "Failed to verify completion");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <div className="mb-10">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Operations</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
          Task Evidence Audit
        </h1>
        <p className="text-xs text-[#86868b] mt-1">
          Review photographic evidence before releasing citizen eco points.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading task audits...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No active collection tasks queued.
        </div>
      ) : (
        <div className="space-y-8">
          {tasks.map((task) => {
            const afterEvidence = task.evidence?.find((e) => e.evidence_type === "AFTER");
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/[0.06] pb-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white capitalize">
                        {task.report.ai_prediction?.predicted_class || "Waste"} Collection
                      </span>
                      <span className="text-xs font-mono text-[#86868b]">
                        {task.report.report_code}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      {task.report.location.address || "Street coordinates provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#86868b]">
                      Priority: {task.priority}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isCompleted
                          ? "text-emerald-400"
                          : task.status === "COLLECTED"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Before / After Evidence Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-mono">
                      Before (Citizen Report)
                    </span>
                    <div className="aspect-[4/3] rounded-2xl bg-[#121214] border border-white/[0.08] overflow-hidden">
                      <img
                        src={
                          task.report.image_url?.startsWith("http")
                            ? task.report.image_url
                            : `http://127.0.0.1:8000${task.report.image_url}`
                        }
                        alt="Before cleanup"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-mono">
                      After (Collector Proof)
                    </span>
                    <div className="aspect-[4/3] rounded-2xl bg-[#121214] border border-white/[0.08] overflow-hidden flex items-center justify-center">
                      {afterEvidence?.image_url ? (
                        <img
                          src={
                            afterEvidence.image_url.startsWith("http")
                              ? afterEvidence.image_url
                              : `http://127.0.0.1:8000${afterEvidence.image_url}`
                          }
                          alt="After cleanup proof"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-[#86868b]">
                          Pending collector photo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit Action Button */}
                {task.status === "COLLECTED" && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleVerifyCompletion(task.id)}
                      disabled={verifyingId === task.id}
                      className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all active:scale-[0.98] shadow-md shadow-emerald-500/20"
                    >
                      {verifyingId === task.id ? "Approving..." : "Approve Completion & Award Points"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
