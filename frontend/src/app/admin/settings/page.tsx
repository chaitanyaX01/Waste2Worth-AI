"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Cpu,
  Database,
  Award,
  ShieldCheck,
  CheckCircle2,
  Server,
  Layers,
  Settings,
  Flame,
  Info,
  ExternalLink,
  Code
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
            System & Model Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Waste2Worth Engine & Model Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ResNet18 neural network parameters, PostgreSQL runtime telemetry, and civic incentive schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Model Architecture Deep-Dive */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ResNet18 Waste Classifier</h2>
                  <span className="text-xs text-slate-400 font-mono">waste2worth_resnet18.pth (44.8 MB)</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Loaded & Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Validation Acc</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">87.89%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Dataset</span>
                <span className="text-lg font-bold text-purple-400 font-mono">14,279</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Training Set</span>
                <span className="text-lg font-bold text-white font-mono">11,423</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Validation Set</span>
                <span className="text-lg font-bold text-white font-mono">2,856</span>
              </div>
            </div>

            {/* 7 Classes Schema */}
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono block mb-2">
                Recognized 7 Waste Categories
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 0, name: "Cardboard", color: "text-yellow-400" },
                  { id: 1, name: "E-Waste", color: "text-purple-400" },
                  { id: 2, name: "Glass", color: "text-emerald-400" },
                  { id: 3, name: "Medical", color: "text-rose-400" },
                  { id: 4, name: "Metal", color: "text-cyan-400" },
                  { id: 5, name: "Paper", color: "text-blue-400" },
                  { id: 6, name: "Plastic", color: "text-amber-400" },
                ].map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className={`font-semibold ${c.color}`}>{c.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">Index: {c.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preprocessing Pipeline */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Inference Preprocessing Pipeline</div>
              <div>• Resize: 256x256 bilinear interpolation</div>
              <div>• Center Crop: 224x224 RGB tensor</div>
              <div>• Mean Normalization: [0.485, 0.456, 0.406]</div>
              <div>• Std Normalization: [0.229, 0.224, 0.225]</div>
              <div>• Output: Softmax normalized 7-class probability array</div>
            </div>
          </div>

          {/* Reward Point Schedule Settings */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Civic Eco-Points Incentive Schedule</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Configured rewards awarded automatically through the platform gamification engine upon status transitions.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Incident Report Submission</div>
                  <div className="text-[11px] text-slate-400">Awarded immediately upon citizen upload & AI scan</div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                  +10 Points
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Admin Verification Pass</div>
                  <div className="text-[11px] text-slate-400">Awarded when admin reviews & confirms incident legitimacy</div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono font-bold text-xs">
                  +20 Points
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Complete Field Cleanup Verified</div>
                  <div className="text-[11px] text-slate-400">Awarded to citizen after before/after evidence approval</div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-xs">
                  +50 Points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Infrastructure & Environment Details */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Platform Infrastructure</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Production Database</span>
                <span className="font-semibold text-slate-200">PostgreSQL 18</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Connected via SQLAlchemy 2.1 & psycopg driver (port 5432)
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Backend Web Engine</span>
                <span className="font-semibold text-slate-200">FastAPI + Uvicorn ASGI</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Native async endpoints, JWT auth, and multipart uploads
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Hardware Acceleration</span>
                <span className="font-semibold text-emerald-400 font-mono">Apple Silicon MPS</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PyTorch Metal Performance Shaders enabled for sub-30ms inference
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Frontend Application</span>
                <span className="font-semibold text-slate-200">Next.js 14 App Router</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  React 18, Tailwind CSS, Leaflet GIS mapping, WebRTC Camera
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Role-Based Access Control</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Granular JWT bearer claims isolate Citizen, Collector, and Municipal Administrator endpoints.
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-bold text-emerald-400 font-mono block">CITIZEN</span>
                <span className="text-[11px] text-slate-400">Scan waste, file reports, track status, redeem rewards</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-bold text-amber-400 font-mono block">COLLECTOR</span>
                <span className="text-[11px] text-slate-400">Accept tasks, route navigation, upload before/after photos</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-bold text-purple-400 font-mono block">ADMIN</span>
                <span className="text-[11px] text-slate-400">Verify reports, dispatch workforce, audit evidence, GIS command</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
