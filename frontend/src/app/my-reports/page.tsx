"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCitizenReports } from "@/lib/api";
import { WasteReport } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Camera, ChevronRight } from "lucide-react";

export default function MyReportsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      getCitizenReports()
        .then(setReports)
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, isLoading]);

  const filtered = reports.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-[11px] text-emerald-400 font-medium">Completed</span>;
      case "COLLECTED":
      case "IN_PROGRESS":
      case "ASSIGNED":
        return <span className="text-[11px] text-blue-400 font-medium">In Collection</span>;
      case "VERIFIED":
        return <span className="text-[11px] text-teal-400 font-medium">AI Verified</span>;
      case "REJECTED":
        return <span className="text-[11px] text-rose-400 font-medium">Rejected</span>;
      default:
        return <span className="text-[11px] text-[#86868b] font-medium">Under Review</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            My Reports
          </h1>
          <p className="text-xs text-[#86868b] mt-1">
            Real-time status tracking and verification timeline for your submissions.
          </p>
        </div>

        <Link
          href="/scanner"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Scan Waste</span>
        </Link>
      </div>

      {/* Apple Minimal Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar text-xs">
        {[
          { key: "ALL", label: "All" },
          { key: "PENDING", label: "Submitted" },
          { key: "VERIFIED", label: "Verified" },
          { key: "IN_PROGRESS", label: "In Progress" },
          { key: "COMPLETED", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
              filterStatus === tab.key
                ? "bg-white text-black font-semibold"
                : "bg-white/[0.06] text-[#86868b] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#86868b]">
          Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-[#86868b]">
          No reports found for this filter.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {filtered.map((report) => (
            <Link
              key={report.id}
              href={`/my-reports/${report.id}`}
              className="py-4.5 flex items-center justify-between group transition-colors hover:bg-white/[0.02] px-2 -mx-2 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    report.status === "COMPLETED"
                      ? "bg-emerald-400"
                      : report.status === "IN_PROGRESS" || report.status === "ASSIGNED"
                      ? "bg-blue-400"
                      : "bg-[#86868b]"
                  }`}
                />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white capitalize group-hover:text-emerald-400 transition-colors">
                      {report.ai_prediction?.predicted_class || "Waste"}
                    </span>
                    <span className="text-[10px] font-mono text-[#86868b]">
                      {report.report_code}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#86868b] max-w-xs sm:max-w-md truncate">
                    {report.location.address || `GPS: ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(report.status)}
                <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
