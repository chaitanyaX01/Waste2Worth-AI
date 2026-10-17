import {
  AuthResponse,
  User,
  PredictionResult,
  WasteReport,
  CollectionTask,
  CollectorProfile,
  DashboardStats,
  RewardItem,
  BadgeItem,
  LeaderboardEntry,
  RedeemRewardResult
} from "./types";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 1. Check custom user-configured backend URL stored in localStorage
    const customUrl = localStorage.getItem("w2w_custom_backend_url");
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, "");
    }

    // 2. Client-accessible environment variable (if explicitly configured)
    const publicEnv = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_AI_API_URL;
    if (publicEnv && publicEnv.trim()) {
      const cleanEnv = publicEnv.trim().replace(/\/+$/, "");
      const isRemoteHost =
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1");
      const isEnvLocalhost = cleanEnv.includes("localhost") || cleanEnv.includes("127.0.0.1");
      
      // If user is accessing from localhost, or publicEnv is an actual remote URL, use it
      if (!isRemoteHost || !isEnvLocalhost) {
        return cleanEnv;
      }
    }

    // 3. For custom domain websites, use same-origin relative path ("")
    // This allows Next.js rewrites or reverse proxies to route /api to the backend without CORS issues
    return "";
  }

  // Server-side rendering
  const serverUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_AI_API_URL ||
    "http://127.0.0.1:8000";
  return serverUrl.trim().replace(/\/+$/, "");
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window === "undefined") return;
  const clean = url.trim().replace(/\/+$/, "");
  if (!clean) {
    localStorage.removeItem("w2w_custom_backend_url");
  } else {
    localStorage.setItem("w2w_custom_backend_url", clean);
  }
}

export function getCustomBackendUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("w2w_custom_backend_url") || "";
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  status?: string;
  model?: string;
  url?: string;
  error?: string;
}> {
  const base = getApiBaseUrl();
  const endpoints = base ? [`${base}/health`, `${base}/api/health`] : ["/api/health", "/health"];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { method: "GET", cache: "no-store" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: true, status: data.status || "online", model: data.model, url: ep };
      }
    } catch {
      // Continue to next endpoint
    }
  }
  return { ok: false, error: "Backend unreachable", url: base || "relative" };
}

export async function downscaleImageForPrediction(
  fileOrBlob: File | Blob,
  maxDimension = 800,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve) => {
    // If it's already a very small image (< 350KB), return as is
    if (fileOrBlob.size < 350 * 1024) {
      return resolve(fileOrBlob);
    }

    const timer = setTimeout(() => {
      resolve(fileOrBlob);
    }, 1800);

    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      clearTimeout(timer);
      try {
        let width = img.naturalWidth || 800;
        let height = img.naturalHeight || 800;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(fileOrBlob);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || fileOrBlob);
          },
          "image/jpeg",
          quality
        );
      } catch {
        resolve(fileOrBlob);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      clearTimeout(timer);
      resolve(fileOrBlob);
    };

    img.src = url;
  });
}

export const API_BASE_URL = getApiBaseUrl();

export function buildApiUrl(path: string, params?: Record<string, string | undefined>): string {
  const base = getApiBaseUrl();
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.set(key, val);
      }
    }
  }
  const queryString = searchParams.toString();
  const fullPath = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return queryString ? `${fullPath}?${queryString}` : fullPath;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("w2w_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function predictWaste(imageFile: File | Blob): Promise<PredictionResult> {
  // Compress image to ~100KB to prevent Vercel 4.5MB payload errors and reduce server memory load
  const compressed =
    typeof window !== "undefined"
      ? await downscaleImageForPrediction(imageFile, 800, 0.85)
      : imageFile;

  const formData = new FormData();
  formData.append("file", compressed, "scan.jpg");

  const base = getApiBaseUrl();
  const candidates = base
    ? [`${base}/api/predict`, `${base}/predict`]
    : ["/api/predict", "/predict"];

  let lastError: Error | null = null;
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 404) {
        continue;
      }

      let errorMsg = "AI classification failed";
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {
        const text = await response.text().catch(() => "");
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("AI classification failed. Cloud service may still be waking up.");
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication failed");
  }

  const data: AuthResponse = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("w2w_token", data.access_token);
    localStorage.setItem("w2w_user", JSON.stringify(data));
  }
  return data;
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  otp_code?: string;
  role?: string;
  employee_code?: string;
  organization?: string;
  service_area?: string;
}): Promise<AuthResponse> {
  const cleanData = {
    ...userData,
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    password: userData.password.trim(),
    phone: userData.phone.replace(/\D/g, ""),
    otp_code: userData.otp_code ? userData.otp_code.trim() : undefined,
  };
  const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }

  const data: AuthResponse = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("w2w_token", data.access_token);
    localStorage.setItem("w2w_user", JSON.stringify(data));
  }
  return data;
}

export async function verifyFirebaseTokenWithBackend(payload: {
  id_token: string;
  name?: string;
  email?: string;
  phone?: string;
  otp_code?: string;
  session_info?: string;
  role?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/firebase-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_token: payload.id_token,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      otp_code: payload.otp_code,
      session_info: payload.session_info,
      role: payload.role || "CITIZEN",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Firebase verification failed" }));
    if (err.detail && typeof err.detail === "object" && err.detail.code === "PHONE_VERIFICATION_REQUIRED") {
      const error: any = new Error(err.detail.message || "Mobile phone verification is compulsory.");
      error.code = "PHONE_VERIFICATION_REQUIRED";
      error.email = err.detail.email;
      error.name = err.detail.name;
      throw error;
    }
    const msg = typeof err.detail === "string" ? err.detail : (err.detail?.message || "Firebase authentication failed");
    throw new Error(msg);
  }

  const data: AuthResponse = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("w2w_token", data.access_token);
    localStorage.setItem("w2w_user", JSON.stringify(data));
  }
  return data;
}

export async function sendWhatsAppOtp(phone: string): Promise<{
  success: boolean;
  message: string;
  phone: string;
  is_trial_fallback?: boolean;
  fallback_code?: string;
}> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to send OTP code" }));
    throw new Error(err.detail || "Failed to send WhatsApp verification code");
  }

  return response.json();
}

export async function verifyWhatsAppOtp(payload: {
  phone: string;
  code: string;
  name?: string;
  role?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: payload.phone,
      code: payload.code,
      name: payload.name,
      role: payload.role || "CITIZEN",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "OTP verification failed" }));
    throw new Error(err.detail || "Invalid verification code");
  }

  const data: AuthResponse = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("w2w_token", data.access_token);
    localStorage.setItem("w2w_user", JSON.stringify(data));
  }
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export async function submitWasteReport(formData: FormData): Promise<WasteReport> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/reports`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to submit report" }));
    throw new Error(err.detail || "Failed to submit report");
  }

  return response.json();
}

export async function getCitizenReports(): Promise<WasteReport[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/reports`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch citizen reports");
  return response.json();
}

export async function getReportDetail(reportId: string): Promise<WasteReport> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/reports/${reportId}`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch report detail");
  return response.json();
}

export async function getRewardsCatalog(): Promise<RewardItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/rewards`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch rewards");
  return response.json();
}

export async function redeemReward(rewardId: string): Promise<RedeemRewardResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/rewards/${rewardId}/redeem`, {
    method: "POST",
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to redeem reward" }));
    throw new Error(err.detail || "Failed to redeem reward");
  }
  return response.json();
}

export async function getCitizenBadges(): Promise<BadgeItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/badges`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch badges");
  return response.json();
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/citizen/leaderboard`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
}

// ==================== COLLECTOR API ====================

export async function getCollectorTasks(statusFilter?: string): Promise<CollectionTask[]> {
  const url = buildApiUrl("/api/collector/tasks", statusFilter ? { status_filter: statusFilter } : undefined);

  const response = await fetch(url, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch collector tasks");
  return response.json();
}

export async function getTaskDetail(taskId: string): Promise<CollectionTask> {
  const response = await fetch(`${getApiBaseUrl()}/api/collector/tasks/${taskId}`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch task detail");
  return response.json();
}

export async function updateTaskStatus(taskId: string, status: string, comment?: string): Promise<CollectionTask> {
  const response = await fetch(`${getApiBaseUrl()}/api/collector/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status, comment }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to update task status" }));
    throw new Error(err.detail || "Failed to update task status");
  }

  return response.json();
}

export async function uploadTaskEvidence(
  taskId: string,
  file: File | Blob,
  evidenceType: "BEFORE" | "AFTER",
  notes?: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("evidence_type", evidenceType);
  if (notes) formData.append("notes", notes);

  const response = await fetch(`${getApiBaseUrl()}/api/collector/tasks/${taskId}/evidence`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to upload evidence");
  return response.json();
}

export async function getCollectorProfile(): Promise<CollectorProfile> {
  const response = await fetch(`${getApiBaseUrl()}/api/collector/profile`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch collector profile");
  return response.json();
}

// ==================== ADMIN API ====================

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/dashboard/stats`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch admin stats");
  return response.json();
}

export async function getAdminReports(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<WasteReport[]> {
  const url = buildApiUrl("/api/admin/reports", {
    status_filter: filters?.status,
    category_filter: filters?.category,
    search: filters?.search,
  });

  const response = await fetch(url, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch admin reports");
  return response.json();
}

export async function verifyReport(reportId: string, status: "VERIFIED" | "REJECTED", comment?: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/reports/${reportId}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status, comment }),
  });

  if (!response.ok) throw new Error("Failed to verify report");
  return response.json();
}

export async function assignCollectorToReport(reportId: string, collectorId: string, priority: string = "MEDIUM") {
  const url = buildApiUrl("/api/admin/tasks/assign", { report_id: reportId });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ collector_id: collectorId, priority }),
  });

  if (!response.ok) throw new Error("Failed to assign collector");
  return response.json();
}

export async function verifyTaskCompletion(taskId: string, comment?: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/tasks/${taskId}/verify-completion`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) throw new Error("Failed to verify task completion");
  return response.json();
}

export async function getAdminCollectors(): Promise<CollectorProfile[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/collectors`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch collectors");
  return response.json();
}

export async function getAdminCitizens(): Promise<User[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/citizens`, {
    headers: { ...getAuthHeader() },
  });

  if (!response.ok) throw new Error("Failed to fetch citizens");
  return response.json();
}

export const DEFAULT_WASTE_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' fill='none'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230a0a0c'/%3E%3Cstop offset='100%25' stop-color='%23141418'/%3E%3C/linearGradient%3E%3ClinearGradient id='brand' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981'/%3E%3Cstop offset='100%25' stop-color='%23059669'/%3E%3C/linearGradient%3E%3Cdefs%3E%3Crect width='600' height='400' fill='url(%23bg)'/%3E%3Crect x='2' y='2' width='596' height='396' rx='20' stroke='%2327272a' stroke-width='1.5' stroke-dasharray='6 6'/%3E%3Ccircle cx='300' cy='165' r='46' fill='%2318181b' stroke='%2327272a' stroke-width='2'/%3E%3Cpath d='M285 152h30l5 7h10c4.4 0 8 3.6 8 8v28c0 4.4-3.6 8-8 8H270c-4.4 0-8-3.6-8-8v-28c0-4.4 3.6-8 8-8h10l5-7z' stroke='url(%23brand)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='300' cy='172' r='11' stroke='url(%23brand)' stroke-width='2.5'/%3E%3Ctext x='300' y='248' fill='%23f4f4f5' font-family='-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' font-size='15' font-weight='600' text-anchor='middle' letter-spacing='0.5'%3EWaste2Worth AI Evidence%3C/text%3E%3Ctext x='300' y='272' fill='%2371717a' font-family='-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' font-size='12' text-anchor='middle'%3ECommunity Report Record%3C/text%3E%3C/svg%3E";

export function resolveImageUrl(path?: string | null): string {
  if (!path || !path.trim()) return DEFAULT_WASTE_PLACEHOLDER;
  const p = path.trim();
  if (p.startsWith("data:") || p.startsWith("blob:")) {
    return p;
  }
  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p;
  }
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
  const base = getApiBaseUrl();
  if (base) {
    return `${base}${cleanPath}`;
  }
  if (typeof window !== "undefined") {
    return cleanPath;
  }
  const backendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";
  return `${backendUrl}${cleanPath}`;
}


