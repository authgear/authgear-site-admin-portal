import React, { useCallback, useMemo, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Text, Icon, IconButton, Callout, DirectionalHint } from "@fluentui/react";
import auditStyles from "./AuditLogDetail.module.css";

export interface AuditLogDetailEntry {
  key: string;
  timestamp: string;
  activity: string;
  isError: boolean;
}

interface AuditLogDetailLocationState {
  logEntry: AuditLogDetailEntry;
  userId?: string;
}

type JsonTokenType = "key" | "string" | "number" | "boolean" | "null" | "plain";

function tokenizeJsonLine(
  line: string
): Array<{ type: JsonTokenType; text: string }> {
  const segments: Array<{ type: JsonTokenType; text: string }> = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    const keyMatch = rest.match(/^(\s*)"([^"]+)"\s*:/);
    if (keyMatch) {
      if (keyMatch[1]) segments.push({ type: "plain", text: keyMatch[1] });
      segments.push({ type: "key", text: `"${keyMatch[2]}"` });
      const colonPart = rest.match(/^\s*:\s*/)?.[0] ?? "";
      segments.push({ type: "plain", text: colonPart });
      i += keyMatch[0].length;
      continue;
    }
    const strMatch = rest.match(/^"(?:[^"\\]|\\.)*"/);
    if (strMatch) {
      segments.push({ type: "string", text: strMatch[0] });
      i += strMatch[0].length;
      continue;
    }
    const numMatch = rest.match(/^-?\d+/);
    if (numMatch) {
      segments.push({ type: "number", text: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }
    if (rest.startsWith("true")) {
      segments.push({ type: "boolean", text: "true" });
      i += 4;
      continue;
    }
    if (rest.startsWith("false")) {
      segments.push({ type: "boolean", text: "false" });
      i += 5;
      continue;
    }
    if (rest.startsWith("null")) {
      segments.push({ type: "null", text: "null" });
      i += 4;
      continue;
    }
    segments.push({ type: "plain", text: line[i] });
    i += 1;
  }
  return segments;
}

const AuditLogDetailPage: React.VFC = () => {
  const { projectId, logKey } = useParams<"projectId" | "logKey">();
  const location = useLocation();
  const state = location.state as AuditLogDetailLocationState | undefined;
  let logEntry = state?.logEntry;
  const stateUserId = state?.userId;

  if (!logEntry && logKey) {
    try {
      const raw = sessionStorage.getItem(`audit-log-logs-${projectId}`);
      if (raw) {
        const logs = JSON.parse(raw) as Array<{
          key: string;
          timestamp: string;
          flowAction: string;
          verdict: string;
          userId?: string;
        }>;
        const found = logs.find((l) => l.key === logKey);
        if (found) {
          logEntry = {
            key: found.key,
            timestamp: found.timestamp,
            activity: found.flowAction,
            isError: found.verdict === "blocked",
          };
        }
      }
    } catch {
      // ignore
    }
  }

  const [rawLogCopied, setRawLogCopied] = useState(false);
  const copyButtonRef = useRef<HTMLSpanElement>(null);

  const backUrl = projectId ? `/teams/${projectId}` : "/teams";
  const backState = projectId ? { tab: "auditLog" as const } : undefined;

  if (!logEntry) {
    return (
      <div className={auditStyles.root}>
        <Link
          to={backUrl}
          state={backState}
          className={auditStyles.breadcrumbLink}
        >
          ← Audit Log
        </Link>
        <Text variant="large">Log not found.</Text>
      </div>
    );
  }

  const loggedAtDisplay = (() => {
    const d = new Date(logEntry.timestamp);
    return Number.isNaN(d.getTime())
      ? logEntry.timestamp
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " UTC+08:00";
  })();

  const ipAddress = "94.190.220.240";
  const userAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
  const clientID = "cd54c7b6f29ee540";

  const rawEventLog = useMemo(
    () => ({
      context: {
        app_id: "authui-demo-business",
        audit_context: null,
        client_id: clientID,
        geo_location_code: "HK",
        ip_address: ipAddress,
        language: "en",
        preferred_languages: ["en-US", "en"],
      },
      timestamp:
        Math.floor(new Date(logEntry!.timestamp).getTime() / 1000) || 1758180373,
      triggered_by: "user",
      activity_type: logEntry!.activity,
      is_error: logEntry!.isError,
      user_id: stateUserId ?? null,
      user_agent: userAgent,
    }),
    [logEntry, stateUserId, clientID, ipAddress, userAgent]
  );

  const rawLogText = useMemo(
    () => JSON.stringify(rawEventLog, null, 2),
    [rawEventLog]
  );
  const rawLogLines = useMemo(() => rawLogText.split("\n"), [rawLogText]);

  const copyRawLog = useCallback(() => {
    void navigator.clipboard.writeText(rawLogText).then(() => {
      setRawLogCopied(true);
      window.setTimeout(() => setRawLogCopied(false), 2000);
    });
  }, [rawLogText]);

  return (
    <div className={auditStyles.root}>
      <div className={auditStyles.titleRow}>
        <Text as="h1" variant="xxLarge" block className={auditStyles.breadcrumb}>
          <span className={auditStyles.breadcrumbInner}>
            <Link
              to={backUrl}
              state={backState}
              className={auditStyles.breadcrumbLink}
            >
              Audit Log
            </Link>
            <Icon
              iconName="ChevronRight"
              className={auditStyles.breadcrumbSepIcon}
            />
            <span className={auditStyles.breadcrumbCurrent}>
              Log Details
            </span>
          </span>
        </Text>
      </div>

      <div className={auditStyles.detailSummary}>
        <div className={auditStyles.detailRow}>
          <span className={auditStyles.detailLabel}>Activity Type:</span>
          <span className={auditStyles.detailValue}>{logEntry.activity}</span>
        </div>
        <div className={auditStyles.detailRow}>
          <span className={auditStyles.detailLabel}>Logged at:</span>
          <span className={auditStyles.detailValue}>{loggedAtDisplay}</span>
        </div>
        {stateUserId && (
          <div className={auditStyles.detailRow}>
            <span className={auditStyles.detailLabel}>User ID:</span>
            <span className={auditStyles.detailValue}>{stateUserId}</span>
          </div>
        )}
        <div className={auditStyles.detailRow}>
          <span className={auditStyles.detailLabel}>IP Address:</span>
          <span className={auditStyles.detailValue}>{ipAddress}</span>
        </div>
        <div className={auditStyles.detailRow}>
          <span className={auditStyles.detailLabel}>User Agent:</span>
          <span className={auditStyles.detailValue}>{userAgent}</span>
        </div>
        <div className={auditStyles.detailRow}>
          <span className={auditStyles.detailLabel}>Client ID:</span>
          <span className={auditStyles.detailValue}>{clientID}</span>
        </div>
      </div>

      <div className={auditStyles.rawSection}>
        <div className={auditStyles.rawLogHeader}>
          <span className={auditStyles.rawSectionTitle}>Raw Event Log</span>
          <div className={auditStyles.rawLogCopyWrap}>
            <span ref={copyButtonRef}>
              <IconButton
                iconProps={{ iconName: "Copy" }}
                ariaLabel="Copy raw log"
                onClick={copyRawLog}
                styles={{
                  root: { marginLeft: 8, color: "#176df3" },
                  icon: { fontSize: 14, color: "#176df3" },
                }}
              />
            </span>
            {rawLogCopied && copyButtonRef.current && (
              <Callout
                target={copyButtonRef.current}
                directionalHint={DirectionalHint.topCenter}
                onDismiss={() => setRawLogCopied(false)}
                setInitialFocus={false}
                role="status"
                styles={{ root: { padding: "8px 12px" } }}
              >
                <Text variant="small">Copied to clipboard</Text>
              </Callout>
            )}
          </div>
        </div>
        <div className={auditStyles.rawLogContent}>
          <div className={auditStyles.rawLogLineNumbers}>
            {rawLogLines.map((_, i) => (
              <span key={i} className={auditStyles.rawLogLineNum}>
                {i + 1}
              </span>
            ))}
          </div>
          <pre className={auditStyles.rawLogPre}>
            {rawLogLines.map((line, lineIdx) => (
              <div key={lineIdx} className={auditStyles.rawLogLine}>
                {tokenizeJsonLine(line).map((seg, segIdx) => {
                  const typeClass =
                    seg.type === "key"
                      ? auditStyles.rawLogKey
                      : seg.type === "string"
                        ? auditStyles.rawLogString
                        : seg.type === "number"
                          ? auditStyles.rawLogNumber
                          : seg.type === "boolean"
                            ? auditStyles.rawLogBoolean
                            : seg.type === "null"
                              ? auditStyles.rawLogNull
                              : undefined;
                  return (
                    <span key={segIdx} className={typeClass}>
                      {seg.text}
                    </span>
                  );
                })}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailPage;
