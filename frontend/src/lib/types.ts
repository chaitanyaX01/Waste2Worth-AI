export type UserRole = "CITIZEN" | "COLLECTOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  points_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  name: string;
  email: string;
}

export interface PredictionResult {
  success: boolean;
  prediction: string;
  confidence: number;
  confidence_percent: number;
  all_predictions: Record<string, number>;
  model_version?: string;
}

export interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface AIPredictionData {
  id: string;
  model_version: string;
  predicted_class: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  created_at: string;
}

export interface StatusHistoryItem {
  id: string;
  old_status?: string;
  new_status: string;
  changed_by_name?: string;
  comment?: string;
  created_at: string;
}

export interface WasteReport {
  id: string;
  report_code: string;
  citizen_id: string;
  citizen_name: string;
  image_url: string;
  description?: string;
  status: "PENDING" | "VERIFIED" | "ASSIGNED" | "IN_PROGRESS" | "COLLECTED" | "COMPLETED" | "REJECTED" | "CANCELLED";
  location: LocationData;
  ai_prediction?: AIPredictionData;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  completed_at?: string;
  status_history?: StatusHistoryItem[];
  collection_task_id?: string;
  collector_name?: string;
}

export interface CollectionEvidence {
  id: string;
  task_id: string;
  evidence_type: "BEFORE" | "AFTER";
  image_url: string;
  notes?: string;
  created_at: string;
}

export interface CollectionTask {
  id: string;
  report_id: string;
  collector_id?: string;
  collector_name?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "ASSIGNED" | "IN_PROGRESS" | "COLLECTED" | "COMPLETED" | "CANCELLED";
  report: WasteReport;
  assigned_at: string;
  accepted_at?: string;
  started_at?: string;
  collected_at?: string;
  completed_at?: string;
  evidence: CollectionEvidence[];
}

export interface CollectorProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_code: string;
  organization?: string;
  service_area?: string;
  is_available: boolean;
  assigned_tasks_count: number;
  completed_tasks_count: number;
}

export interface WasteDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface HotspotLocation {
  latitude: number;
  longitude: number;
  report_count: number;
  categories: string[];
  radius_meters: number;
}

export interface DashboardStats {
  total_reports: number;
  pending_reports: number;
  verified_reports: number;
  assigned_reports: number;
  in_progress_reports: number;
  collected_reports: number;
  completed_reports: number;
  rejected_reports: number;
  total_collectors: number;
  active_collectors: number;
  total_citizens: number;
  total_points_issued: number;
  waste_distribution: WasteDistribution[];
  recent_hotspots: HotspotLocation[];
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_required: number;
  is_active: boolean;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  points_balance: number;
  verified_reports_count: number;
  cleanups_count: number;
  badge_count: number;
}

export interface RedeemRewardResult {
  success: boolean;
  reward_id: string;
  reward_name: string;
  voucher_code: string;
  points_spent: number;
  remaining_balance: number;
  message: string;
  created_at: string;
}

