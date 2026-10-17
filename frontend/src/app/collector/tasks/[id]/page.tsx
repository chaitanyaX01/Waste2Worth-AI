"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getTaskDetail, updateTaskStatus, uploadTaskEvidence, resolveImageUrl, DEFAULT_WASTE_PLACEHOLDER, downscaleImageForPrediction } from "@/lib/api";
import { CollectionTask } from "@/lib/types";
import {
  ChevronLeft,
  MapPin,
  Camera,
  Check,
  Navigation,
  ArrowRight,
  Upload,
  Phone,
  MessageCircle
} from "lucide-react";

export default function CollectorTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [task, setTask] = useState<CollectionTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Evidence state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [collectionSubmitted, setCollectionSubmitted] = useState(false);

  useEffect(() => {
    loadTask();
  }, [resolvedParams.id]);

  const loadTask = () => {
    setLoading(true);
    getTaskDetail(resolvedParams.id)
      .then(setTask)
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  };

  const handleStartRoute = async () => {
    if (!task) return;
    setUpdating(true);
    try {
      const updated = await updateTaskStatus(task.id, "IN_PROGRESS", "Collector en route / arrived at waste site");
      setTask(updated);
    } catch (e: any) {
      alert(e.message || "Failed to start collection");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitEvidence = async () => {
    if (!task || !evidenceFile) return;

    setUploadingEvidence(true);
    try {
      const optimizedBlob = await downscaleImageForPrediction(evidenceFile, 1200, 0.85);
      const fileToUpload =
        optimizedBlob instanceof File
          ? optimizedBlob
          : new File([optimizedBlob], evidenceFile.name || "evidence.jpg", {
              type: optimizedBlob.type || "image/jpeg",
            });
      await uploadTaskEvidence(task.id, fileToUpload, "AFTER", evidenceNotes || "Cleaned up site completely.");
      await updateTaskStatus(task.id, "COLLECTED", "Waste picked up. Evidence submitted for admin review.");
      setCollectionSubmitted(true);
    } catch (e: any) {
      alert(e.message || "Failed to submit evidence");
    } finally {
      setUploadingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-xs text-[#86868b]">
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-sm text-white mb-2">Task not found</p>
        <Link href="/collector/dashboard" className="text-xs text-amber-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // After Successful Submission
  if (collectionSubmitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
          <Check className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
          Collection Submitted
        </h2>
        <p className="text-xs text-[#86868b] max-w-xs mb-8 leading-relaxed">
          Before-and-after proof has been recorded. Admin will review and release citizen eco-points.
        </p>
        <Link
          href="/collector/dashboard"
          className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5e7] transition-all"
        >
          Next Task
        </Link>
      </div>
    );
  }

  const isStarted = task.status === "IN_PROGRESS" || task.status === "COLLECTED" || task.status === "COMPLETED";

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 w-full flex flex-col min-h-screen bg-black text-[#f5f5f7]">
      {/* Back Link */}
      <Link
        href="/collector/dashboard"
        className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-white mb-6 transition-colors self-start"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Field Tasks</span>
      </Link>

      {/* Task Header */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight capitalize">
            {task.report.ai_prediction?.predicted_class || "Waste"} Collection
          </h1>
          <span className="text-xs font-mono text-[#86868b]">
            {task.report.report_code}
          </span>
        </div>
        <p className="text-xs text-[#86868b] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{task.report.location.address || "Target Street Address"}</span>
        </p>
      </div>

      {/* Citizen Contact Card */}
      <div className="mb-6 p-4 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#86868b] flex items-center gap-1.5 font-medium">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            Citizen Mobile
          </span>
          <span className="font-mono text-white font-medium text-xs">
            {task.report.citizen_phone ? `+91 ${task.report.citizen_phone}` : "Not provided"}
          </span>
        </div>
        {task.report.citizen_phone && (
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:+91${task.report.citizen_phone}`}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Citizen
            </a>
            <a
              href={`https://wa.me/91${task.report.citizen_phone}?text=${encodeURIComponent(
                `Hello! I am your Waste2Worth sanitation collector arriving for cleanup task ${task.report.report_code}. Could you assist with directions?`
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

      {/* Before / After Evidence Visual Section */}
      <div className="space-y-4 mb-8">
        <p className="text-[11px] font-semibold tracking-widest text-[#86868b] uppercase">
          Evidence
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Before Photo */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-mono">
              Before
            </div>
            <div className="aspect-square rounded-2xl bg-[#0c0c0e] border border-white/[0.1] overflow-hidden">
              <img
                src={resolveImageUrl(task.report.image_url)}
                alt="Before cleanup"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.currentTarget.src = DEFAULT_WASTE_PLACEHOLDER;
                }}

              />
            </div>
          </div>

          {/* After Photo */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-mono">
              After
            </div>
            {evidencePreview ? (
              <div className="aspect-square rounded-2xl bg-[#0c0c0e] border border-emerald-500/40 overflow-hidden relative">
                <img
                  src={evidencePreview}
                  alt="After cleanup proof"
                  className="w-full h-full object-cover"
                />
                <label className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="aspect-square rounded-2xl bg-[#0c0c0e] border border-dashed border-white/20 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-white/40 transition-colors">
                <Camera className="w-6 h-6 text-[#86868b] mb-1" />
                <span className="text-[10px] text-white font-medium">Take Photo</span>
                <span className="text-[9px] text-[#86868b]">Completion proof</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Citizen Notes */}
      {task.report.description && (
        <div className="mb-8 p-4 rounded-2xl bg-[#0c0c0e] border border-white/[0.06] space-y-1">
          <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Citizen Notes</span>
          <p className="text-xs text-white/90 leading-relaxed">{task.report.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mt-auto pt-6">
        {!isStarted ? (
          <button
            onClick={handleStartRoute}
            disabled={updating}
            className="w-full py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
          >
            {updating ? "Updating..." : "Start Collection"}
          </button>
        ) : !evidenceFile ? (
          <label className="w-full py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer">
            <Camera className="w-4 h-4" />
            <span>Take Completion Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>
        ) : (
          <button
            onClick={handleSubmitEvidence}
            disabled={uploadingEvidence}
            className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{uploadingEvidence ? "Submitting..." : "Submit Evidence"}</span>
          </button>
        )}

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${task.report.location.latitude},${task.report.location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>Navigate in Google Maps</span>
        </a>
      </div>
    </div>
  );
}
