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
    // Relative path leverages Next.js rewrites to proxy directly to backend
    return "";
  }
  return process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
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
  const formData = new FormData();
  formData.append("file", imageFile, "scan.jpg");

  const response = await fetch(`${getApiBaseUrl()}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI classification failed");
  }

  return response.json();
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

export function resolveImageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // In browser, relative URL /uploads/... is proxied by Next.js to backend without mixed-content SSL errors
  if (typeof window !== "undefined") {
    return cleanPath;
  }
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
  return `${backendUrl}${cleanPath}`;
}

