"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAdminReports, verifyReport, getAdminCollectors, assignCollectorToReport, resolveImageUrl, DEFAULT_WASTE_PLACEHOLDER } from "@/lib/api";
import { WasteReport, CollectorProfile } from "@/lib/types";
import {
  Search,
  Check,
  X,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  Phone,
  MessageCircle
} from "lucide-react";

export default function AdminReportsPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [collectors, setCollectors] = useState<CollectorProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Selected report drawer state
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>("");
  const [assignPriority, setAssignPriority] = useState<string>("MEDIUM");
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      loadData();
    }
  }, [isAuthenticated, role, isLoading]);

  const loadData = () => {
    setLoading(true);
    Promise.all([getAdminReports(), getAdminCollectors()])
      .then(([rep, col]) => {
        setReports(rep);
        setCollectors(col);
        if (col.length > 0) setSelectedCollectorId(col[0].id);
      })
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  };

  const handleVerify = async (reportId: string, status: "VERIFIED" | "REJECTED") => {
    setActionInProgress(true);
    try {
      await verifyReport(reportId, status);
      alert(`Report marked as ${status}. Eco points updated.`);
      setSelectedReport(null);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to update report status");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAssignCollector = async () => {
    if (!selectedReport || !selectedCollectorId) return;
    setActionInProgress(true);
    try {
      await assignCollectorToReport(selectedReport.id, selectedCollectorId, assignPriority);
      alert("Collector assigned to cleanup task.");
      setSelectedReport(null);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to assign collector");
    } finally {
      setActionInProgress(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.report_code.toLowerCase().includes(q) ||
        (r.ai_prediction?.predicted_class || "").toLowerCase().includes(q) ||
        r.location.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-[11px] text-emerald-400 font-medium">Completed</span>;
      case "IN_PROGRESS":
      case "ASSIGNED":
        return <span className="text-[11px] text-blue-400 font-medium">Assigned</span>;
      case "VERIFIED":
        return <span className="text-[11px] text-teal-400 font-medium">Verified</span>;
      case "REJECTED":
        return <span className="text-[11px] text-rose-400 font-medium">Rejected</span>;
      default:
        return <span className="text-[11px] text-[#86868b] font-medium">Pending</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[#86868b] uppercase mb-1">
            Operations
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Municipal Reports
          </h1>
          <p className="text-xs text-[#86868b] mt-1">
            Review community submissions, confirm AI classifications, and dispatch collectors.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report code or street..."
            className="w-full sm:w-64 pl-8 pr-4 py-2 rounded-full bg-[#0c0c0e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-white/20"
          />
          <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar text-xs">
        {[
          { key: "ALL", label: "All Reports" },
          { key: "PENDING", label: "Pending Review" },
          { key: "VERIFIED", label: "Verified" },
          { key: "ASSIGNED", label: "Assigned" },
          { key: "COMPLETED", label: "Completed" },
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

      {/* Reports Table — Clean Minimal Rows */}
      {loading ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-xs text-[#86868b]">
          No reports found.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className="py-4 px-2 -mx-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors group"
            >
              {/* Report Code & Category */}
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-mono font-medium text-white group-hover:text-purple-400 transition-colors">
                    {r.report_code}
                  </span>
                  <span className="text-xs text-[#86868b] capitalize">
                    {r.ai_prediction?.predicted_class || "Waste"} · {((r.ai_prediction?.confidence ?? 0.92) * 100).toFixed(0)}%
                  </span>
                  {r.citizen_phone && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Phone className="w-3 h-3" /> +91 {r.citizen_phone}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/90 truncate max-w-sm sm:max-w-md">
                  {r.location.address?.split(",")[0] || "Street Coordinates"}
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4">
                {getStatusBadge(r.status)}
                <span className="text-xs text-[#86868b] group-hover:text-white transition-colors flex items-center gap-1 font-medium">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apple Slide-Over / Modal Detail Panel */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#121214] border border-white/[0.12] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 text-[#86868b] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-mono text-[#86868b]">
                  {selectedReport.report_code}
                </span>
                <span className="text-xs text-white font-medium capitalize">
                  {selectedReport.ai_prediction?.predicted_class || "Waste"}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                {selectedReport.location.address?.split(",")[0] || "Hotspot Review"}
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                {selectedReport.location.address || "Street coordinates registered"}
              </p>
            </div>

            {/* Waste Photo */}
            {selectedReport.image_url && (
              <div className="rounded-2xl overflow-hidden border border-white/[0.08] mb-6 aspect-video bg-[#121214]">
                <img
                  src={resolveImageUrl(selectedReport.image_url)}
                  alt="Waste report evidence"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.currentTarget.src = DEFAULT_WASTE_PLACEHOLDER;
                  }}
                />
              </div>

            )}

            {/* Citizen Notes */}
            {selectedReport.description && (
              <div className="p-4 rounded-2xl bg-black border border-white/[0.06] mb-6 space-y-1 text-xs">
                <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Citizen Note</span>
                <p className="text-white/90">{selectedReport.description}</p>
              </div>
            )}

            {/* Citizen Mobile Verification & Contact Card */}
            <div className="p-4 rounded-2xl bg-black border border-white/[0.08] mb-6 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#86868b] flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Registered Citizen Mobile
                </span>
                <span className="font-mono text-white font-medium text-xs">
                  {selectedReport.citizen_phone ? `+91 ${selectedReport.citizen_phone}` : "Not provided"}
                </span>
              </div>
              {selectedReport.citizen_phone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:+91${selectedReport.citizen_phone}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Citizen
                  </a>
                  <a
                    href={`https://wa.me/91${selectedReport.citizen_phone}?text=${encodeURIComponent(
                      `Hello from Waste2Worth Administration! Regarding your waste report ${selectedReport.report_code}: `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Verification Controls (If Pending) */}
            {selectedReport.status === "PENDING" && (
              <div className="border-t border-white/[0.06] pt-5 mb-6">
                <p className="text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-3">
                  Verification Action
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVerify(selectedReport.id, "REJECTED")}
                    disabled={actionInProgress}
                    className="py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all"
                  >
                    Reject Report
                  </button>
                  <button
                    onClick={() => handleVerify(selectedReport.id, "VERIFIED")}
                    disabled={actionInProgress}
                    className="py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Verify &amp; Award Points
                  </button>
                </div>
              </div>
            )}

            {/* Dispatch / Collector Assignment */}
            {(selectedReport.status === "PENDING" || selectedReport.status === "VERIFIED") && (
              <div className="border-t border-white/[0.06] pt-5 space-y-3">
                <p className="text-xs font-semibold text-[#86868b] uppercase tracking-widest">
                  Assign Collector
                </p>
                <div className="space-y-2">
                  <select
                    value={selectedCollectorId}
                    onChange={(e) => setSelectedCollectorId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/[0.1] text-xs text-white focus:outline-none"
                  >
                    {collectors.length === 0 ? (
                      <option value="">No collectors registered</option>
                    ) : (
                      collectors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""} - {c.service_area || "Field Zone"}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={handleAssignCollector}
                    disabled={actionInProgress || collectors.length === 0}
                    className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5e7] transition-all"
                  >
                    {actionInProgress ? "Assigning..." : "Dispatch to Collector"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
