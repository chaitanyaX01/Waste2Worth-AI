"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getReportDetail } from "@/lib/api";
import { WasteReport } from "@/lib/types";
import { ChevronLeft, MapPin, Calendar, Check, Clock } from "lucide-react";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [report, setReport] = useState<WasteReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportDetail(resolvedParams.id)
      .then(setReport)
      .catch((e) => console.log("Failed to load report", e))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center text-xs text-[#86868b]">
        Loading tracking timeline...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-sm text-white mb-2">Report not found.</p>
        <Link href="/my-reports" className="text-xs text-emerald-400 hover:underline">
          Return to My Reports
        </Link>
      </div>
    );
  }

  // 5 Step Apple Tracking Timeline definition
  const timelineStages = [
    {
      title: "REPORT SUBMITTED",
      desc: "Citizen uploaded geotagged waste image",
      done: true,
    },
    {
      title: "AI VERIFIED",
      desc: `ResNet-18 model confirmed ${report.ai_prediction?.predicted_class || "Waste"} (${((report.ai_prediction?.confidence ?? 0.94) * 100).toFixed(1)}%)`,
      done: ["VERIFIED", "ASSIGNED", "IN_PROGRESS", "COLLECTED", "COMPLETED"].includes(report.status),
    },
    {
      title: "COLLECTOR ASSIGNED",
      desc: "Municipal route dispatch queued for sanitation operator",
      done: ["ASSIGNED", "IN_PROGRESS", "COLLECTED", "COMPLETED"].includes(report.status),
    },
    {
      title: "COLLECTION IN PROGRESS",
      desc: "Collector arrived at hotspot to execute cleanup",
      done: ["IN_PROGRESS", "COLLECTED", "COMPLETED"].includes(report.status),
    },
    {
      title: "COMPLETED",
      desc: "Photographic evidence approved. +50 Eco Points awarded.",
      done: report.status === "COMPLETED",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Back Button */}
      <Link
        href="/my-reports"
        className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-white mb-8 transition-colors self-start"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>My Reports</span>
      </Link>

      {/* Header Info */}
      <div className="border-b border-white/[0.06] pb-8 mb-10">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-3xl font-semibold text-white tracking-tight capitalize">
            {report.ai_prediction?.predicted_class || "Community"} Waste
          </h1>
          <span className="text-xs font-mono text-[#86868b]">
            {report.report_code}
          </span>
        </div>

        <div className="space-y-1 text-xs text-[#86868b]">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-white/80">{report.location.address || "Street coordinates recorded"}</span>
          </p>
          <p className="text-[11px] text-[#86868b]">
            Reported on {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Apple Vertical Timeline */}
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-8">
          Status Timeline
        </p>

        <div className="space-y-0 relative pl-2">
          {timelineStages.map((stage, idx) => {
            const isLast = idx === timelineStages.length - 1;
            return (
              <div key={stage.title} className="flex items-start gap-6 relative pb-10 last:pb-0">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[11px] top-6 bottom-0 w-[1.5px] transition-colors duration-300 ${
                      timelineStages[idx + 1].done ? "bg-emerald-400" : "bg-white/10"
                    }`}
                  />
                )}

                {/* Status Dot */}
                <div className="relative z-10 flex items-center justify-center shrink-0">
                  {stage.done ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#121214] border border-white/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  )}
                </div>

                {/* Stage Details */}
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold tracking-wider font-mono ${
                      stage.done ? "text-white" : "text-[#86868b]"
                    }`}
                  >
                    {stage.title}
                  </div>
                  <p className="text-[11px] text-[#86868b] mt-0.5 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waste Image Preview */}
      {report.image_url && (
        <div className="pt-6 border-t border-white/[0.06]">
          <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-4">
            Evidence Photo
          </p>
          <div className="rounded-3xl overflow-hidden border border-white/[0.08] max-w-sm">
            <img
              src={report.image_url.startsWith("http") ? report.image_url : `http://127.0.0.1:8000${report.image_url}`}
              alt="Report proof"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
