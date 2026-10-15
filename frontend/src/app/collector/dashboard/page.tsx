"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCollectorTasks, updateTaskStatus, resolveImageUrl, DEFAULT_WASTE_PLACEHOLDER } from "@/lib/api";
import { CollectionTask } from "@/lib/types";
import { MapPin, Navigation, ArrowRight, Check, ChevronRight } from "lucide-react";

export default function CollectorDashboardPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("w2w_token");
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("w2w_user") : null;
    let effectiveRole = role;
    if (!effectiveRole && storedUser) {
      try {
        effectiveRole = JSON.parse(storedUser).role;
      } catch (_) {}
    }

    if ((!isAuthenticated && !hasToken) || (effectiveRole && effectiveRole !== "COLLECTOR" && effectiveRole !== "ADMIN")) {
      router.push("/collector/login");
    } else if (isAuthenticated || hasToken) {
      getCollectorTasks()
        .then(setTasks)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

  const activeTask = tasks.find((t) => t.status === "IN_PROGRESS") || tasks.find((t) => t.status === "ASSIGNED") || tasks[0];
  const pendingTasksCount = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS").length;
  const firstName = user?.name ? user.name.split(" ")[0] : "Operator";

  const handleStartTask = async (task: CollectionTask, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUpdatingTaskId(task.id);
    try {
      if (task.status === "ASSIGNED") {
        await updateTaskStatus(task.id, "IN_PROGRESS", "Collector started route to site");
      }
      router.push(`/collector/tasks/${task.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to start collection");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7] animate-fade-in-up">
      {/* Greeting & Quick Task Count */}
      <section className="mb-10">
        <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">
          Good morning, {firstName}.
        </h1>
        <div className="flex items-baseline gap-2.5">
          <span className="text-6xl font-semibold text-amber-400 font-sans tracking-tight">
            {pendingTasksCount}
          </span>
          <span className="text-base text-[#86868b] font-medium">
            Tasks today
          </span>
        </div>
      </section>

      {/* Dominant Active Task Card */}
      {loading ? (
        <div className="py-20 text-center text-sm text-[#86868b]">
          Loading field tasks...
        </div>
      ) : activeTask ? (
        <section className="mb-12 animate-scale-up">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-3.5">
            Active Task
          </p>

          <div className="apple-card overflow-hidden shadow-2xl">
            {/* Waste Image Preview */}
            <div className="relative aspect-[16/10] w-full bg-[#121214] overflow-hidden">
              <img
                src={resolveImageUrl(activeTask.report.image_url)}
                alt="Waste spot"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.currentTarget.src = DEFAULT_WASTE_PLACEHOLDER;
                }}

              />
              <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-white">
                {activeTask.priority}
              </div>
            </div>

            {/* Task Info */}
            <div className="p-6.5 space-y-4.5">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {activeTask.report.location.address?.split(",")[0] || "Target Location"}
                </h2>
                <p className="text-sm text-[#86868b] mt-1 line-clamp-1">
                  {activeTask.report.location.address || "Street coordinates provided"}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                <span className="font-semibold text-white capitalize">
                  {activeTask.report.ai_prediction?.predicted_class || "Waste"}
                </span>
                <span className="text-[#86868b]">·</span>
                <span className="text-emerald-400 font-mono font-medium">
                  {((activeTask.report.ai_prediction?.confidence ?? 0.92) * 100).toFixed(0)}% AI confidence
                </span>
              </div>

              {activeTask.report.description && (
                <p className="text-sm text-[#86868b] bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.05] leading-relaxed">
                  {activeTask.report.description}
                </p>
              )}

              {/* Primary Action Button */}
              <button
                onClick={(e) => handleStartTask(activeTask, e)}
                disabled={updatingTaskId === activeTask.id}
                className="w-full py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all active:scale-[0.97] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <span>
                  {activeTask.status === "ASSIGNED"
                    ? "Start Collection"
                    : activeTask.status === "IN_PROGRESS"
                    ? "Continue Collection & Evidence"
                    : "View Task Evidence"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="py-16 text-center text-sm text-[#86868b] border border-white/[0.06] rounded-3xl p-8 mb-12">
          No tasks assigned today. All routes are clear.
        </div>
      )}

      {/* Task Queue — Clean Minimal List */}
      {tasks.length > 1 && (
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase">
              Task Queue ({tasks.length})
            </p>
            <Link
              href="/collector/tasks"
              className="text-sm text-[#86868b] hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {tasks.slice(1, 4).map((task) => (
              <Link
                key={task.id}
                href={`/collector/tasks/${task.id}`}
                className="py-4 flex items-center justify-between group transition-colors px-1"
              >
                <div>
                  <div className="text-sm font-medium text-white capitalize group-hover:text-amber-400 transition-colors">
                    {task.report.ai_prediction?.predicted_class || "Waste"} Waste
                  </div>
                  <div className="text-xs sm:text-sm text-[#86868b] truncate max-w-[220px] mt-0.5">
                    {task.report.location.address || "Street location"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#86868b] uppercase">
                    {task.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
