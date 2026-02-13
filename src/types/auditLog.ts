/** User activity log entry (User Activities only — no Admin API & Portal). */
export interface AuditLogEntry {
  key: string;
  timestamp: string;
  flowAction: string;
  verdict: "blocked" | "allowed" | "challenged";
  userId?: string;
}
