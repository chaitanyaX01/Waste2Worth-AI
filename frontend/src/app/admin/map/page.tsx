"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminReports,
  getAdminDashboardStats,
  getAdminCollectors,
  verifyReport,
  assignCollectorToReport,
  resolveImageUrl,
  DEFAULT_WASTE_PLACEHOLDER
} from "@/lib/api";

import { WasteReport, DashboardStats, CollectorProfile } from "@/lib/types";
import {
  X,
  MapPin,
  Sparkles,
  Check,
  ChevronRight,
  Navigation,
  Layers,
  ArrowRight,
  Phone,
  MessageCircle
} from "lucide-react";

export default function AdminMapPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [collectors, setCollectors] = useState<CollectorProfile[]>([]);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Minimal layer toggles
  const [mapType, setMapType] = useState<"streets" | "satellite" | "terrain">("streets");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/admin/login");
    } else {
      loadData();
    }
  }, [isAuthenticated, role, isLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData, collectorsData] = await Promise.all([
        getAdminReports(),
        getAdminDashboardStats(),
        getAdminCollectors(),
      ]);
      setReports(reportsData);
      setStats(statsData);
      setCollectors(collectorsData);
      if (collectorsData.length > 0) setSelectedCollectorId(collectorsData[0].id);
    } catch (err) {
      console.error("Error loading map data:", err);
    } finally {
      setLoading(false);
    }
  };

  const googleTileUrls = {
    streets: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    terrain: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
  };

  const googleAttributions = {
    streets: "&copy; Google Maps",
    satellite: "&copy; Google Maps Imagery",
    terrain: "&copy; Google Maps Terrain",
  };

  // Switch map type
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newLayer = L.tileLayer(googleTileUrls[mapType], {
        attribution: googleAttributions[mapType],
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      });
      newLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    });
  }, [mapType]);

  // Initialize Map & Markers
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        const initialLat = reports[0]?.location?.latitude || 20.5937;
        const initialLng = reports[0]?.location?.longitude || 78.9629;
        const initialZoom = reports.length > 0 ? 14 : 5;

        const map = L.map(mapContainerRef.current!, {
          zoomControl: false, // Use clean Apple layout without bulky +/-
        }).setView([initialLat, initialLng], initialZoom);

        mapInstanceRef.current = map;

        const tileLayer = L.tileLayer(googleTileUrls[mapType], {
          attribution: googleAttributions[mapType],
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        markersLayerRef.current = L.layerGroup().addTo(map);

        if (navigator.geolocation && reports.length === 0) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (isMounted && mapInstanceRef.current) {
                mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
              }
            },
            () => {}
          );
        }
      }

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      const filteredReports = reports.filter((r) => {
        if (statusFilter === "ALL") return true;
        return r.status === statusFilter;
      });

      filteredReports.forEach((report) => {
        const lat = report.location?.latitude;
        const lng = report.location?.longitude;
        if (!lat || !lng) return;

        const isCompleted = report.status === "COMPLETED" || report.status === "COLLECTED";

        // Blinking logic:
        // Unresolved reports blink actively (radar beacon) to highlight urgent waste spots.
        // 100% solved reports stop blinking completely and show a calm solid green verified marker.
        const customIcon = L.divIcon({
          className: "apple-map-marker",
          html: isCompleted
            ? `<div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);"></div>
              </div>`
            : `<div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.35); animation: radarWave 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: #ef4444; border: 2.5px solid #ffffff; animation: radarBlink 1.2s ease-in-out infinite; box-shadow: 0 0 12px rgba(239, 68, 68, 0.9);"></div>
              </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer);
        marker.on("click", () => {
          setSelectedReport(report);
        });
      });
    });

    return () => {
      isMounted = false;
    };
  }, [reports, statusFilter]);

  const handleVerify = async (reportId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await verifyReport(reportId, status);
      loadData();
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (e: any) {
      alert(e.message || "Action failed");
    }
  };

  const handleAssign = async () => {
    if (!selectedReport || !selectedCollectorId) return;
    setAssignLoading(true);
    try {
      await assignCollectorToReport(selectedReport.id, selectedCollectorId, "MEDIUM");
      alert("Collector assigned to cleanup task.");
      setAssignModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to assign collector");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-black overflow-hidden flex flex-col">
      {/* Floating Top Controls Pill */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/[0.1] text-xs">
          <Link
            href="/admin/dashboard"
            className="text-[#86868b] hover:text-white transition-colors pr-2 border-r border-white/[0.08]"
          >
            ← Operations
          </Link>
          <span className="text-white font-medium">Hotspot Map</span>
        </div>

        {/* Map Type & Filter Selectors */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map Layer Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/[0.1] text-[11px]">
            {(["streets", "satellite", "terrain"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMapType(type)}
                className={`px-3 py-1 rounded-full capitalize transition-colors ${
                  mapType === type
                    ? "bg-white text-black font-semibold"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Minimal Floating Apple Detail Panel */}
      {selectedReport && (
        <div className="absolute bottom-6 right-4 sm:right-6 left-4 sm:left-auto sm:w-96 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-5 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#86868b]">
                  {selectedReport.report_code}
                </span>
                <h3 className="text-lg font-semibold text-white tracking-tight capitalize">
                  {selectedReport.ai_prediction?.predicted_class || "Waste"} Waste
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5 line-clamp-1">
                  {selectedReport.location.address || "Street location"}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="text-[#86868b] hover:text-white p-1 -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedReport.image_url && (
              <div className="h-28 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#121214]">
                <img
                  src={resolveImageUrl(selectedReport.image_url)}
                  alt="Waste proof"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.currentTarget.src = DEFAULT_WASTE_PLACEHOLDER;
                  }}
                />

              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#86868b]">Status</span>
              <span
                className={`font-medium ${
                  selectedReport.status === "COMPLETED" || selectedReport.status === "COLLECTED"
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {selectedReport.status}
              </span>
            </div>

            {/* Citizen Contact Card */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868b] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Citizen Mobile
                </span>
                <span className="font-mono text-white font-medium text-[11px]">
                  {selectedReport.citizen_phone ? `+91 ${selectedReport.citizen_phone}` : "Not provided"}
                </span>
              </div>
              {selectedReport.citizen_phone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:+91${selectedReport.citizen_phone}`}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/91${selectedReport.citizen_phone}?text=${encodeURIComponent(
                      `Hello from Waste2Worth! Regarding your waste report ${selectedReport.report_code}: `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/25 text-teal-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
              {selectedReport.status === "PENDING" && (
                <button
                  onClick={() => handleVerify(selectedReport.id, "VERIFIED")}
                  className="flex-1 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all"
                >
                  Verify Report
                </button>
              )}

              <button
                onClick={() => setAssignModalOpen(true)}
                className="flex-1 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium border border-white/[0.08] transition-all"
              >
                Assign Collector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collector Assignment Modal */}
      {assignModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121214] border border-white/[0.12] p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 text-[#86868b] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-semibold text-white tracking-tight">
                Dispatch Collector
              </h3>
              <p className="text-xs text-[#86868b] mt-0.5">
                Assign {selectedReport.report_code} to an active sanitation operator.
              </p>
            </div>

            <select
              value={selectedCollectorId}
              onChange={(e) => setSelectedCollectorId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/[0.1] text-xs text-white focus:outline-none"
            >
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.service_area})
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={assignLoading || collectors.length === 0}
              className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5e7] transition-all"
            >
              {assignLoading ? "Dispatching..." : "Confirm Dispatch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
