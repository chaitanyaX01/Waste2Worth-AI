"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAdminCollectors } from "@/lib/api";
import { CollectorProfile } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

export default function AdminCollectorsPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [collectors, setCollectors] = useState<CollectorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      getAdminCollectors()
        .then(setCollectors)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

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
          Field Operators
        </h1>
        <p className="text-xs text-[#86868b] mt-1">
          Authorized sanitation workforce and sector dispatch status.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading field operators...
        </div>
      ) : collectors.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No collectors registered in the system.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {collectors.map((c) => (
            <div
              key={c.id}
              className="py-4.5 px-2 -mx-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-xl"
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <span className="text-xs font-mono text-[#86868b]">{c.employee_code}</span>
                </div>
                <div className="text-xs text-[#86868b] mt-0.5">
                  Sector: {c.service_area || "Downtown"} · {c.assigned_tasks_count} active tasks
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-emerald-400">
                  {c.completed_tasks_count} cleanups completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
