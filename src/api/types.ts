// TypeScript types generated from the Site Admin API spec:
// https://raw.githubusercontent.com/authgear/authgear-server/refs/heads/main/docs/api/siteadmin-api.yaml

export interface APIErrorDetail {
  name: string;
  reason: string;
  message: string;
  code: number;
  tracking_id?: string;
  info?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  error: APIErrorDetail;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export interface App {
  id: string;
  owner_email: string;
  plan: string;
  created_at: string; // RFC 3339
  last_month_mau: number;
}

export interface AppDetail extends App {
  user_count: number;
}

export interface AppsListResponse {
  apps: App[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export type CollaboratorRole = "owner" | "editor";

export interface Collaborator {
  id: string;
  app_id: string;
  user_id: string;
  user_email: string;
  role: CollaboratorRole;
  created_at: string; // RFC 3339
}

export interface CollaboratorsListResponse {
  collaborators: Collaborator[];
}

export interface AddCollaboratorRequest {
  user_email: string;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface MessagingUsage {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  sms_north_america_count: number;
  sms_other_regions_count: number;
  whatsapp_north_america_count: number;
  whatsapp_other_regions_count: number;
}

export interface MonthlyActiveUsersCount {
  year: number;
  month: number; // 1–12
  count: number;
}

export interface MonthlyActiveUsersUsage {
  counts: MonthlyActiveUsersCount[];
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface Plan {
  name: string;
}

export interface PlansListResponse {
  plans: Plan[];
}

export interface ChangeAppPlanRequest {
  plan_name: string;
}
