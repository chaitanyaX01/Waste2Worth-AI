"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCollectorTasks } from "@/lib/api";
import { CollectionTask } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function CollectorTasksPage() {
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (role !== "COLLECTOR" && role !== "ADMIN")) {
      router.push("/collector/login");
    } else {
      getCollectorTasks()
        .then(setTasks)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

  const filtered = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      <Link
        href="/collector/dashboard"
        className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-white mb-6 transition-colors self-start"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Field Dashboard</span>
      </Link>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          Task Queue
        </h1>
        <p className="text-xs text-[#86868b] mt-1">
          Assigned waste pickups across your operational sector.
        </p>
      </section>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar text-xs">
        {[
          { key: "ALL", label: "All" },
          { key: "ASSIGNED", label: "Queued" },
          { key: "IN_PROGRESS", label: "In Progress" },
          { key: "COLLECTED", label: "Collected" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
              statusFilter === tab.key
                ? "bg-white text-black font-semibold"
                : "bg-white/[0.06] text-[#86868b] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading field queue...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No tasks found for this status.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/collector/tasks/${task.id}`}
              className="py-4 flex items-center justify-between group transition-colors px-1"
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white capitalize group-hover:text-amber-400 transition-colors">
                    {task.report.ai_prediction?.predicted_class || "Waste"} Waste
                  </span>
                  <span className="text-[10px] font-mono text-[#86868b]">
                    {task.report.report_code}
                  </span>
                </div>
                <div className="text-xs text-[#86868b] mt-0.5 truncate max-w-[260px]">
                  {task.report.location.address?.split(",")[0] || "Street Location"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase ${
                    task.status === "COMPLETED"
                      ? "text-emerald-400"
                      : task.status === "IN_PROGRESS"
                      ? "text-blue-400"
                      : "text-[#86868b]"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
                <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
