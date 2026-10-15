"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  getApiBaseUrl,
  getCustomBackendUrl,
  setCustomBackendUrl,
  checkBackendHealth,
} from "@/lib/api";

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackendConfigModal({ isOpen, onClose }: BackendConfigModalProps) {
  const [urlInput, setUrlInput] = useState<string>("");
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status?: string;
    model?: string;
    url?: string;
    error?: string;
  } | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = getCustomBackendUrl() || getApiBaseUrl() || "";
      setUrlInput(active);
      setTestResult(null);
      setSaveNotice(null);
      // Automatically run a quick health check
      handleTest(active);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async (testUrl?: string) => {
    setTesting(true);
    setTestResult(null);
    setSaveNotice(null);
    try {
      const target = testUrl !== undefined ? testUrl : urlInput;
      // Temporarily set to test
      const prev = getCustomBackendUrl();
      if (target.trim()) {
        setCustomBackendUrl(target.trim());
      } else {
        setCustomBackendUrl("");
      }
      const res = await checkBackendHealth();
      setTestResult(res);
      // Restore previous until user clicks Save
      if (testUrl === undefined) {
        setCustomBackendUrl(prev);
      }
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message || "Failed to reach backend." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const clean = urlInput.trim().replace(/\/+$/, "");
    setCustomBackendUrl(clean);
    setSaveNotice("Backend configuration saved! Requests will now connect to this server.");
    handleTest(clean);
  };

  const handleResetDefault = () => {
    setCustomBackendUrl("");
    setUrlInput("");
    setSaveNotice("Reset to default relative proxy (/api).");
    handleTest("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121216] border border-white/[0.12] rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-[#f5f5f7] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                AI Backend Connection
              </h3>
              <p className="text-xs text-[#86868b]">
                FastAPI + ResNet-18 Model Server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-white/90 mb-1.5">
              Live Backend API URL
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://waste2worth-backend.onrender.com"
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.1] text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-[#86868b] mt-1.5 leading-relaxed">
              If hosted on Render, paste your service URL (e.g.{" "}
              <code className="text-emerald-400 font-mono">
                https://waste2worth-backend.onrender.com
              </code>
              ). Leave blank to use local or Vercel proxy.
            </p>
          </div>

          {/* Test Status Banner */}
          {testing && (
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2.5 text-white/80">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span>Testing connection to backend and checking AI model status...</span>
            </div>
          )}

          {!testing && testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                testResult.ok
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-semibold">
                  {testResult.ok ? "Backend Connected & Healthy" : "Connection Failed"}
                </div>
                <div className="text-[11px] text-white/70">
                  {testResult.ok ? (
                    <>
                      Model status:{" "}
                      <span className="text-emerald-400 font-mono font-medium">
                        {testResult.model || "Ready"}
                      </span>
                    </>
                  ) : (
                    testResult.error || "Cannot reach server. If on Render Free Tier, wake up may take 30-45s."
                  )}
                </div>
              </div>
            </div>
          )}

          {saveNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-[11px]">
              {saveNotice}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs text-[#86868b] hover:text-white transition-colors"
          >
            Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTest()}
              disabled={testing}
              className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
