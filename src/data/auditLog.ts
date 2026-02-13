import type { AuditLogEntry } from "../types/auditLog";

/** User activities only (no Admin API & Portal). */
const USER_ACTIVITIES = [
  "User signed in",
  "Account created",
  "Password changed",
  "Email verification sent",
  "Login failed",
  "2FA enrolled",
  "Session expired",
  "Rate limit exceeded",
  "SMS OTP",
  "Email OTP",
  "WhatsApp OTP",
  "Verify",
  "Create Authenticator",
  "Create Passkey",
  "Authenticate",
  "Change Password",
];

const VERDICTS: AuditLogEntry["verdict"][] = ["blocked", "allowed", "challenged"];

/** Same format as auth-fraud UserManagement randomId(): 8-4-4-4-12 hex chars */
const ID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomIdSegment(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return s;
}

function randomUserId(): string {
  return `${randomIdSegment(8)}-${randomIdSegment(4)}-${randomIdSegment(4)}-${randomIdSegment(4)}-${randomIdSegment(12)}`;
}

/** Pre-generate a small set of user IDs in auth-fraud format for sample logs */
function getSampleUserIds(): string[] {
  const set = new Set<string>();
  while (set.size < 8) set.add(randomUserId());
  return Array.from(set);
}

const SAMPLE_USER_IDS = getSampleUserIds();

export function generateUserActivityLogs(projectId: string, count = 25): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const flowAction = USER_ACTIVITIES[Math.floor(Math.random() * USER_ACTIVITIES.length)];
    const isError =
      flowAction.includes("failed") ||
      flowAction.includes("exceeded") ||
      flowAction.includes("expired");
    const verdict = isError ? "blocked" : VERDICTS[Math.floor(Math.random() * VERDICTS.length)];
    const userId =
      Math.random() > 0.2
        ? SAMPLE_USER_IDS[Math.floor(Math.random() * SAMPLE_USER_IDS.length)]
        : undefined;

    logs.push({
      key: `audit-${projectId}-${i}`,
      timestamp: date.toISOString(),
      flowAction,
      verdict,
      userId,
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
