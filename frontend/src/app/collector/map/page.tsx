"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCollectorTasks } from "@/lib/api";
import { CollectionTask } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Navigation, ArrowRight, X, Phone, MessageCircle } from "lucide-react";

export default function CollectorMapPage() {
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<"streets" | "satellite" | "terrain">("streets");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (role !== "COLLECTOR" && role !== "ADMIN")) {
      router.push("/collector/login");
    } else {
      getCollectorTasks()
        .then((data) => {
          setTasks(data);
          if (data.length > 0) setSelectedTask(data[0]);
        })
        .catch((e) => console.log(e))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, role, isLoading]);

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

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        const initialLat = tasks[0]?.report.location.latitude || 20.5937;
        const initialLng = tasks[0]?.report.location.longitude || 78.9629;
        const initialZoom = tasks.length > 0 ? 14 : 5;

        const map = L.map(mapContainerRef.current!, {
          zoomControl: false,
        }).setView([initialLat, initialLng], initialZoom);

        mapInstanceRef.current = map;

        const tileLayer = L.tileLayer(googleTileUrls[mapType], {
          attribution: googleAttributions[mapType],
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        tasks.forEach((task) => {
          const lat = task.report.location.latitude;
          const lng = task.report.location.longitude;
          if (!lat || !lng) return;

          const isCompleted =
            task.status === "COMPLETED" ||
            task.status === "COLLECTED" ||
            task.report.status === "COMPLETED" ||
            task.report.status === "COLLECTED";

          // Blinking logic:
          // Unresolved tasks actively blink with radar waves.
          // 100% solved tasks stop blinking completely.
          const customIcon = L.divIcon({
            className: "collector-dot",
            html: isCompleted
              ? `<div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);"></div>
                </div>`
              : `<div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(245, 158, 11, 0.35); animation: radarWave 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: #f59e0b; border: 2.5px solid #ffffff; animation: radarBlink 1.2s ease-in-out infinite; box-shadow: 0 0 12px rgba(245, 158, 11, 0.9);"></div>
                </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          marker.on("click", () => {
            setSelectedTask(task);
          });
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tasks]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-black overflow-hidden flex flex-col">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
        <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/[0.1] text-xs">
          <Link href="/collector/dashboard" className="text-[#86868b] hover:text-white pr-2 border-r border-white/[0.08]">
            ← Tasks
          </Link>
          <span className="text-white font-medium pl-2">Field Route Map</span>
        </div>

        <div className="pointer-events-auto flex items-center p-0.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/[0.1] text-[11px]">
          {(["streets", "satellite"] as const).map((type) => (
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

      {/* Map */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom Floating Task Sheet */}
      {selectedTask && (
        <div className="absolute bottom-6 right-4 sm:right-6 left-4 sm:left-auto sm:w-96 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-5 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#86868b]">
                  {selectedTask.report.report_code}
                </span>
                <h3 className="text-lg font-semibold text-white tracking-tight capitalize">
                  {selectedTask.report.ai_prediction?.predicted_class || "Waste"} Pickup
                </h3>
                <p className="text-xs text-[#86868b] line-clamp-1">
                  {selectedTask.report.location.address || "Street coordinates provided"}
                </p>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#86868b] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Citizen Contact Card */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868b] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Citizen Mobile
                </span>
                <span className="font-mono text-white font-medium text-[11px]">
                  {selectedTask.report.citizen_phone ? `+91 ${selectedTask.report.citizen_phone}` : "Not provided"}
                </span>
              </div>
              {selectedTask.report.citizen_phone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:+91${selectedTask.report.citizen_phone}`}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Call Citizen
                  </a>
                  <a
                    href={`https://wa.me/91${selectedTask.report.citizen_phone}?text=${encodeURIComponent(
                      `Hello from Waste2Worth! I am arriving for cleanup task ${selectedTask.report.report_code}.`
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

            <div className="pt-2 flex items-center gap-2">
              <Link
                href={`/collector/tasks/${selectedTask.id}`}
                className="flex-1 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold text-center transition-all"
              >
                Open Task Details
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.report.location.latitude},${selectedTask.report.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors"
                title="Directions"
              >
                <Navigation className="w-4 h-4 text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
