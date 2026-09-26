"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  Smartphone,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { predictWaste } from "@/lib/api";
import { PredictionResult } from "@/lib/types";
import { resolveBestLocation } from "@/lib/location";

export default function ScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [cameraNote, setCameraNote] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraNote(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraNote("Direct camera capture ready. Tap to take waste photo.");
      setCameraActive(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Live stream unavailable, using native camera capture:", err);
      setCameraNote("Direct camera capture ready. Tap to take waste photo.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Helper: crop an image File/Blob to the exact center square box (1:1 aspect ratio)
  // Max 800x800 for mobile memory safety & instant ResNet-18 processing
  const cropSquareBlob = (file: File | Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      // 1.5s fallback timeout: if canvas or image decoding hangs on mobile, resolve file directly
      const timer = setTimeout(() => {
        console.warn("Square crop operation timed out; falling back to original file");
        resolve(file);
      }, 1500);

      const done = (b: Blob) => {
        clearTimeout(timer);
        resolve(b);
      };

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement("canvas");
          const naturalDim = Math.min(img.naturalWidth || 800, img.naturalHeight || 800);
          // Limit to max 800x800 for mobile memory safety (ResNet-18 only requires 224x224)
          const targetSize = Math.min(naturalDim, 800);
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            done(file);
            return;
          }
          const sx = (img.naturalWidth - naturalDim) / 2;
          const sy = (img.naturalHeight - naturalDim) / 2;
          ctx.drawImage(img, sx, sy, naturalDim, naturalDim, 0, 0, targetSize, targetSize);
          canvas.toBlob(
            (blob) => {
              done(blob || file);
            },
            "image/jpeg",
            0.88
          );
        } catch (e) {
          console.warn("Canvas crop failed:", e);
          done(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        done(file);
      };
      img.src = url;
    });
  };

  // Live video crop inside square target box (for desktop or HTTPS)
  const captureFromLiveVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const box = boxRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (box) {
      const videoRect = video.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();

      const scaleX = (video.videoWidth || 640) / videoRect.width;
      const scaleY = (video.videoHeight || 480) / videoRect.height;

      const cropX = Math.max(0, (boxRect.left - videoRect.left) * scaleX);
      const cropY = Math.max(0, (boxRect.top - videoRect.top) * scaleY);
      const cropWidth = Math.min((video.videoWidth || 640) - cropX, boxRect.width * scaleX);
      const cropHeight = Math.min((video.videoHeight || 480) - cropY, boxRect.height * scaleY);

      const targetDim = Math.min(Math.round(cropWidth), 800);
      canvas.width = targetDim;
      canvas.height = targetDim;

      context.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, targetDim, targetDim
      );
    } else {
      const minDim = Math.min(video.videoWidth || 640, video.videoHeight || 480);
      const targetDim = Math.min(minDim, 800);
      canvas.width = targetDim;
      canvas.height = targetDim;
      const sx = ((video.videoWidth || 640) - minDim) / 2;
      const sy = ((video.videoHeight || 480) - minDim) / 2;
      context.drawImage(video, sx, sy, minDim, minDim, 0, 0, targetDim, targetDim);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        analyzeImage(blob);
        // Pre-resolve location in background
        resolveBestLocation(null)
          .then((loc) => {
            try {
              sessionStorage.setItem("w2w_scan_lat", loc.latitude.toString());
              sessionStorage.setItem("w2w_scan_lng", loc.longitude.toString());
              sessionStorage.setItem("w2w_scan_address", loc.address);
              sessionStorage.setItem("w2w_scan_loc_source", loc.source);
            } catch (_) {}
          })
          .catch(() => {});
      }
    }, "image/jpeg", 0.88);
  };

  // Handle photo from native mobile camera or photo upload
  const handleImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalysisError(null);
      setIsAnalyzing(true);

      // Start location extraction (EXIF GPS from camera photo + fallback) concurrently
      resolveBestLocation(file)
        .then((loc) => {
          try {
            sessionStorage.setItem("w2w_scan_lat", loc.latitude.toString());
            sessionStorage.setItem("w2w_scan_lng", loc.longitude.toString());
            sessionStorage.setItem("w2w_scan_address", loc.address);
            sessionStorage.setItem("w2w_scan_loc_source", loc.source);
          } catch (_) {}
        })
        .catch(() => {});

      try {
        // Crop to center square box before analyzing
        const croppedSquare = await cropSquareBlob(file);
        setCapturedBlob(croppedSquare);
        setPreviewUrl(URL.createObjectURL(croppedSquare));
        await analyzeImage(croppedSquare);
      } catch (err: any) {
        console.error("Photo processing error:", err);
        setAnalysisError(err.message || "Failed to process photo");
        setIsAnalyzing(false);
      }
      // Reset input value so taking another photo triggers onChange again
      e.target.value = "";
    }
  };

  const analyzeImage = async (blob: Blob) => {
    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);
    try {
      const res = await predictWaste(blob);
      setResult(res);
    } catch (err: any) {
      console.error("AI classification error:", err);
      setAnalysisError(err.message || "Failed to classify image. Please retake photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCapturedBlob(null);
    setPreviewUrl(null);
    setResult(null);
    setAnalysisError(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  const handleConfirmAndReport = (overrideCategory?: string) => {
    if (!capturedBlob || !result) return;

    const cat = overrideCategory || result.prediction;
    const conf = overrideCategory === "other" ? 1.0 : result.confidence;

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem("w2w_scan_image", reader.result as string);
        sessionStorage.setItem("w2w_scan_category", cat);
        sessionStorage.setItem("w2w_scan_confidence", conf.toString());
        sessionStorage.setItem("w2w_scan_probs", JSON.stringify(result.all_predictions));
        router.push("/report");
      } catch (err) {
        console.warn("sessionStorage save error, redirecting with params:", err);
        router.push(`/report?category=${encodeURIComponent(cat)}&confidence=${conf}`);
      }
    };
    reader.readAsDataURL(capturedBlob);
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-[#f5f5f7] min-h-[calc(100vh-3.5rem)]">
      {/* Top Bar with Direct Native Touch Targets */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 sm:pt-6 pb-2 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium tracking-tight text-[#86868b]">
            Vision Intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Gallery Button with Embedded Direct File Input */}
          <label className="cursor-pointer text-xs sm:text-sm text-[#86868b] hover:text-white transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] active:scale-[0.97] relative overflow-hidden">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Library</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileSelected}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </label>

          {/* Camera Button with Embedded Direct Native Camera Input */}
          <label className="cursor-pointer text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 active:scale-[0.97] relative overflow-hidden">
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFileSelected}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </label>
        </div>
      </div>

      {/* Main Viewfinder Experience */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 flex flex-col items-center justify-center pb-8">
        {analysisError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm max-w-md w-full flex items-center justify-between gap-3 animate-fade-in">
            <span>{analysisError}</span>
            <button
              onClick={handleReset}
              className="px-3 py-1 rounded-full bg-rose-500/25 hover:bg-rose-500/40 text-xs font-semibold text-white whitespace-nowrap transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}

        {!result && !isAnalyzing ? (
          /* Camera Viewfinder State */
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Viewfinder Area */}
            <div className="relative w-full aspect-[4/5] sm:aspect-square max-w-[520px] rounded-3xl overflow-hidden bg-[#0c0c0e] border border-white/[0.08] shadow-2xl flex items-center justify-center">
              {/* Live Video (Desktop webcam or HTTPS) */}
              {cameraActive && !previewUrl && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}

              {/* Direct Touch Viewfinder Overlay — Tapping Anywhere Directly Opens the Phone Camera */}
              {!cameraActive && !previewUrl && (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 bg-gradient-to-b from-[#121216] to-[#08080a] group relative select-none">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <Camera className="w-9 h-9 text-emerald-400" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-1.5 text-center">
                    Tap to Open Camera
                  </h4>
                  <p className="text-xs text-[#86868b] text-center max-w-xs mb-4">
                    Takes photo directly with your device camera &amp; crops inside the square box
                  </p>
                  <span className="px-5 py-2.5 rounded-full bg-emerald-500 text-black text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                    📸 Open Phone Camera
                  </span>

                  {/* Direct Native Camera Input placed physically over the card */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileSelected}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  />
                </label>
              )}

              {/* Preview if already captured */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Captured waste"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Centered Apple Scanning Frame (Photo taken inside this box) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div
                  ref={boxRef}
                  className="w-64 h-64 sm:w-76 sm:h-76 relative rounded-2xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300"
                >
                  {/* Subtle Elegant Corners */}
                  <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg animate-corner-pulse" />
                  <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg animate-corner-pulse" />
                  <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg animate-corner-pulse" />
                  <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg animate-corner-pulse" />

                  {/* Subtle Scanning Line */}
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
                </div>
              </div>

              {/* Helper Caption */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/[0.1] text-xs sm:text-sm text-[#f5f5f7] tracking-tight whitespace-nowrap shadow-lg z-20 pointer-events-none">
                Photo is captured inside the frame
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Apple Camera Shutter Control */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {cameraActive ? (
                /* Active Live Webcam Shutter */
                <button
                  onClick={captureFromLiveVideo}
                  className="apple-shutter-outer group"
                  aria-label="Capture waste photo"
                >
                  <div className="apple-shutter-inner group-active:scale-90 transition-transform" />
                </button>
              ) : (
                /* Native Mobile Camera Shutter (Direct Touch Target) */
                <label className="apple-shutter-outer group cursor-pointer relative" aria-label="Open Camera">
                  <div className="apple-shutter-inner group-active:scale-90 transition-transform" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileSelected}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  />
                </label>
              )}
              <span className="text-xs text-[#86868b] tracking-tight">
                {cameraActive ? "Snap photo inside frame" : "Tap shutter to open camera"}
              </span>
            </div>
          </div>
        ) : isAnalyzing ? (
          /* Analyzing State — Elegant Apple Intelligence Wave Animation */
          <div className="w-full max-w-[460px] aspect-[4/5] sm:aspect-square flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent animate-ping duration-1000" />
              <div className="absolute w-24 h-24 rounded-full border border-emerald-400/40 animate-spin duration-700" />
              <div className="w-14 h-14 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] flex items-center justify-center animate-breathe">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <h3 className="text-3xl font-semibold tracking-tight text-white mb-2">
              Analyzing waste...
            </h3>
            <p className="text-sm text-[#86868b]">
              Evaluating ResNet-18 neural tensors
            </p>
          </div>
        ) : result ? (
          /* Apple Product Reveal for AI Result */
          <div className="w-full max-w-md mx-auto flex flex-col items-center text-center pt-4 animate-scale-up">
            {/* Cropped Square Photo Preview */}
            {previewUrl && (
              <div className="w-36 h-36 rounded-2xl overflow-hidden border border-white/[0.12] mb-6 shadow-2xl relative group bg-neutral-900">
                <img
                  src={previewUrl}
                  alt="Scanned item"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-[#86868b] uppercase tracking-wider">
                  Target Box Crop
                </div>
              </div>
            )}

            {/* Large Category Title */}
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#86868b] uppercase mb-2">
              Detected Material
            </p>
            <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight text-white capitalize mb-2">
              {result.prediction}
            </h2>

            {/* AI Confidence */}
            <div className="flex items-center gap-2 mb-8">
              <span className="text-base font-semibold text-emerald-400 font-mono">
                {result.confidence_percent}%
              </span>
              <span className="text-sm text-[#86868b]">AI confidence</span>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="w-full space-y-3.5">
              <button
                onClick={() => handleConfirmAndReport()}
                className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-base transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-500/25 animate-pulse-glow"
              >
                Report This Waste
              </button>

              <button
                onClick={handleReset}
                className="w-full py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white text-sm font-medium border border-white/[0.08] transition-all duration-200 active:scale-[0.98]"
              >
                Scan Again
              </button>

              <button
                onClick={() => handleConfirmAndReport("other")}
                className="w-full pt-2 text-sm text-[#86868b] hover:text-white transition-colors"
              >
                Not in 7 classes? Report as Special Waste →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
